import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';
import { ReservationGroupsValidator } from './reservation-groups.validator';
import {
  CreateReservationGroupDto,
  GroupSlotDto,
} from './dto/create-reservation-group.dto';
import { UpdateReservationGroupDto } from './dto/update-reservation-group.dto';
import { AddGroupMemberDto } from './dto/add-group-member.dto';
import { ReplaceMemberSlotsDto } from './dto/replace-member-slots.dto';

@Injectable()
export class ReservationGroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notification: NotificationService,
    private readonly validator: ReservationGroupsValidator,
  ) {}

  findAll() {
    return this.prisma.reservationGroup.findMany({
      include: {
        slots: true,
        reservations: { include: { preferredSlots: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findConfirmedSlots() {
    return this.prisma.reservationGroupSlot.findMany({
      where: { group: { status: 'CONFIRMED' } },
      select: { dayOfWeek: true, startMinute: true, endMinute: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startMinute: 'asc' }],
    });
  }

  async findJoinable() {
    const groups = await this.prisma.reservationGroup.findMany({
      where: { status: 'CONFIRMED' },
      include: { slots: true, _count: { select: { reservations: true } } },
    });

    return groups
      .filter((group) => group._count.reservations < group.capacity)
      .map((group) => {
        const seen = new Set<string>();
        const slots = group.slots.filter((slot) => {
          const key = `${slot.dayOfWeek}-${slot.startMinute}-${slot.endMinute}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        return {
          id: group.id,
          label: group.label,
          capacity: group.capacity,
          filledCount: group._count.reservations,
          minAge: group.minAge,
          maxAge: group.maxAge,
          slots: slots.map(({ dayOfWeek, startMinute, endMinute }) => ({
            dayOfWeek,
            startMinute,
            endMinute,
          })),
        };
      });
  }

  async findOne(id: string) {
    const group = await this.prisma.reservationGroup.findUnique({
      where: { id },
      include: {
        slots: true,
        reservations: { include: { preferredSlots: true } },
      },
    });

    if (!group) {
      throw new NotFoundException(`ReservationGroup ${id} not found`);
    }

    return group;
  }

  async create(dto: CreateReservationGroupDto) {
    const reservationIds = [
      ...new Set(dto.slots.map((slot) => slot.reservationId)),
    ];

    const reservations = await this.prisma.reservation.findMany({
      where: { id: { in: reservationIds } },
      include: { preferredSlots: true },
    });

    if (reservations.length !== reservationIds.length) {
      throw new ConflictException('일부 신청을 찾을 수 없습니다');
    }

    reservations.forEach((reservation) => 
      this.validator.validateReservationStatus(reservation.status, 'WAITING', '대기 중인 신청만 그룹으로 확정할 수 있습니다')
    );
    this.validator.validateCapacity(dto.capacity, reservationIds.length);

    const ages = reservations.map((reservation) => reservation.childAge);
    const minAge = dto.minAge ?? Math.min(...ages);
    const maxAge = dto.maxAge ?? Math.max(...ages);

    const reservationById = new Map(
      reservations.map((reservation) => [reservation.id, reservation]),
    );

    dto.slots.forEach((slot) => {
      const reservation = reservationById.get(slot.reservationId)!;
      this.validator.validateSlotsWithinPreferred([slot], reservation.preferredSlots);
    });

    this.validator.assertNoGaps(dto.slots);

    const group = await this.prisma.$transaction(async (tx) => {
      const createdGroup = await tx.reservationGroup.create({
        data: { label: dto.label, capacity: dto.capacity, minAge, maxAge },
      });

      const createdSlots = await tx.reservationGroupSlot.createManyAndReturn({
        data: dto.slots.map((slot) => ({ ...slot, groupId: createdGroup.id })),
      });

      await tx.reservation.updateMany({
        where: { id: { in: reservationIds } },
        data: { status: 'GROUPED', groupId: createdGroup.id },
      });

      return { ...createdGroup, slots: createdSlots };
    });

    await Promise.all(
      reservations.map((reservation) => {
        const slots = dto.slots.filter(
          (slot) => slot.reservationId === reservation.id,
        );
        return this.notification.sendGroupConfirmed(reservation, group, slots);
      }),
    );

    return group;
  }

  async addMember(groupId: string, dto: AddGroupMemberDto) {
    const group = await this.prisma.reservationGroup.findUnique({
      where: { id: groupId },
      include: { slots: true },
    });

    if (!group) {
      throw new NotFoundException(`ReservationGroup ${groupId} not found`);
    }

    this.validator.validateGroupStatus(group.status, 'CONFIRMED', '확정된 그룹에만 인원을 추가할 수 있습니다');

    const reservation = await this.prisma.reservation.findUnique({
      where: { id: dto.reservationId },
      include: { preferredSlots: true },
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation ${dto.reservationId} not found`);
    }

    this.validator.validateReservationStatus(reservation.status, 'WAITING', '대기 중인 신청만 그룹에 추가할 수 있습니다');

    const currentCount = await this.prisma.reservation.count({
      where: { groupId },
    });
    
    this.validator.validateCapacity(group.capacity, currentCount + 1);
    this.validator.validateAgeBounds(reservation.childAge, group.minAge, group.maxAge);
    this.validator.validateSlotsWithinPreferred(dto.slots, reservation.preferredSlots);
    this.validator.validateSlotsOverlap(dto.slots, group.slots);

    const newSlots = dto.slots.map((slot) => ({
      ...slot,
      reservationId: dto.reservationId,
    }));
    this.validator.assertNoGaps(newSlots);

    const updatedGroup = await this.prisma.$transaction(async (tx) => {
      const createdSlots = await tx.reservationGroupSlot.createManyAndReturn({
        data: newSlots.map((slot) => ({ ...slot, groupId })),
      });

      await tx.reservation.update({
        where: { id: dto.reservationId },
        data: { status: 'GROUPED', groupId, requestedGroupId: null },
      });

      return { ...group, slots: [...group.slots, ...createdSlots] };
    });

    await this.notification.sendGroupConfirmed(
      reservation,
      updatedGroup,
      newSlots,
    );

    return updatedGroup;
  }

  async update(id: string, dto: UpdateReservationGroupDto) {
    if (
      dto.capacity !== undefined ||
      dto.minAge !== undefined ||
      dto.maxAge !== undefined
    ) {
      const members = await this.prisma.reservation.findMany({
        where: { groupId: id },
      });

      this.validator.validateUpdateBounds(members, dto.capacity, dto.minAge, dto.maxAge);
    }

    try {
      return await this.prisma.reservationGroup.update({
        where: { id },
        data: dto,
        include: {
          slots: true,
          reservations: { include: { preferredSlots: true } },
        },
      });
    } catch (error) {
      if (this.isNotFoundError(error)) {
        throw new NotFoundException(`ReservationGroup ${id} not found`);
      }
      throw error;
    }
  }

  async removeMember(groupId: string, reservationId: string) {
    const group = await this.prisma.reservationGroup.findUnique({
      where: { id: groupId },
      include: { reservations: true },
    });

    if (!group) {
      throw new NotFoundException(`ReservationGroup ${groupId} not found`);
    }

    const reservation = group.reservations.find(
      (member) => member.id === reservationId,
    );

    if (!reservation) {
      throw new NotFoundException(
        `Reservation ${reservationId} not found in group ${groupId}`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.reservationGroupSlot.deleteMany({
        where: { groupId, reservationId },
      });
      await tx.reservation.update({
        where: { id: reservationId },
        data: { groupId: null, status: 'WAITING' },
      });
    });

    await this.notification.sendGroupMemberRemoved(reservation, group);
  }

  async replaceMemberSlots(
    groupId: string,
    reservationId: string,
    dto: ReplaceMemberSlotsDto,
  ) {
    const group = await this.prisma.reservationGroup.findUnique({
      where: { id: groupId },
      include: { slots: true },
    });

    if (!group) {
      throw new NotFoundException(`ReservationGroup ${groupId} not found`);
    }

    this.validator.validateGroupStatus(group.status, 'CONFIRMED', '확정된 그룹만 시간을 수정할 수 있습니다');

    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { preferredSlots: true },
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation ${reservationId} not found`);
    }

    if (reservation.groupId !== groupId) {
      throw new ConflictException('해당 신청은 이 그룹의 멤버가 아닙니다');
    }

    this.validator.validateSlotsWithinPreferred(dto.slots, reservation.preferredSlots);

    const newSlots = dto.slots.map((slot) => ({ ...slot, reservationId }));
    this.validator.assertNoGaps(newSlots);

    return this.prisma.$transaction(async (tx) => {
      await tx.reservationGroupSlot.deleteMany({
        where: { groupId, reservationId },
      });
      const createdSlots = await tx.reservationGroupSlot.createManyAndReturn({
        data: newSlots.map((slot) => ({ ...slot, groupId })),
      });

      return {
        ...group,
        slots: [
          ...group.slots.filter((slot) => slot.reservationId !== reservationId),
          ...createdSlots,
        ],
      };
    });
  }

  async remove(id: string) {
    await this.prisma.reservation.updateMany({
      where: { groupId: id },
      data: { groupId: null, status: 'WAITING' },
    });

    try {
      await this.prisma.reservationGroup.delete({ where: { id } });
    } catch (error) {
      if (this.isNotFoundError(error)) {
        throw new NotFoundException(`ReservationGroup ${id} not found`);
      }
      throw error;
    }
  }

  private isNotFoundError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      (error as { code?: string }).code === 'P2025'
    );
  }
}
