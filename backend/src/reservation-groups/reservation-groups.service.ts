import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';
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

    if (reservations.some((reservation) => reservation.status !== 'WAITING')) {
      throw new ConflictException(
        '대기 중인 신청만 그룹으로 확정할 수 있습니다',
      );
    }

    if (dto.capacity < reservationIds.length) {
      throw new ConflictException('정원은 선택된 인원 수 이상이어야 합니다');
    }

    const ages = reservations.map((reservation) => reservation.childAge);
    const minAge = dto.minAge ?? Math.min(...ages);
    const maxAge = dto.maxAge ?? Math.max(...ages);

    const reservationById = new Map(
      reservations.map((reservation) => [reservation.id, reservation]),
    );

    if (
      dto.slots.some((slot) => {
        const reservation = reservationById.get(slot.reservationId)!;
        return !reservation.preferredSlots.some(
          (preferred) =>
            preferred.dayOfWeek === slot.dayOfWeek &&
            preferred.startMinute <= slot.startMinute &&
            preferred.endMinute >= slot.endMinute,
        );
      })
    ) {
      throw new ConflictException(
        '확정 시간은 해당 신청의 후보 시간 범위 안에 포함되어야 합니다',
      );
    }

    this.assertNoGaps(dto.slots);

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

    if (group.status !== 'CONFIRMED') {
      throw new ConflictException('확정된 그룹에만 인원을 추가할 수 있습니다');
    }

    const reservation = await this.prisma.reservation.findUnique({
      where: { id: dto.reservationId },
      include: { preferredSlots: true },
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation ${dto.reservationId} not found`);
    }

    if (reservation.status !== 'WAITING') {
      throw new ConflictException('대기 중인 신청만 그룹에 추가할 수 있습니다');
    }

    const currentCount = await this.prisma.reservation.count({
      where: { groupId },
    });
    if (currentCount + 1 > group.capacity) {
      throw new ConflictException('그룹 정원이 가득 찼습니다');
    }

    if (
      reservation.childAge < group.minAge ||
      reservation.childAge > group.maxAge
    ) {
      throw new ConflictException('그룹의 나이대와 맞지 않습니다');
    }

    if (
      dto.slots.some(
        (slot) =>
          !reservation.preferredSlots.some(
            (preferred) =>
              preferred.dayOfWeek === slot.dayOfWeek &&
              preferred.startMinute <= slot.startMinute &&
              preferred.endMinute >= slot.endMinute,
          ),
      )
    ) {
      throw new ConflictException(
        '확정 시간은 해당 신청의 후보 시간 범위 안에 포함되어야 합니다',
      );
    }

    if (
      dto.slots.some(
        (slot) =>
          !group.slots.some(
            (existing) =>
              existing.dayOfWeek === slot.dayOfWeek &&
              slot.startMinute < existing.endMinute &&
              slot.endMinute > existing.startMinute,
          ),
      )
    ) {
      throw new ConflictException(
        '추가할 시간이 그룹의 기존 시간대와 겹치지 않습니다',
      );
    }

    const newSlots = dto.slots.map((slot) => ({
      ...slot,
      reservationId: dto.reservationId,
    }));
    this.assertNoGaps(newSlots);

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

      if (dto.capacity !== undefined && dto.capacity < members.length) {
        throw new ConflictException('정원은 현재 인원 수 이상이어야 합니다');
      }

      if (
        dto.minAge !== undefined &&
        members.some((member) => member.childAge < dto.minAge!)
      ) {
        throw new ConflictException(
          '최소 연령은 기존 멤버의 나이보다 클 수 없습니다',
        );
      }

      if (
        dto.maxAge !== undefined &&
        members.some((member) => member.childAge > dto.maxAge!)
      ) {
        throw new ConflictException(
          '최대 연령은 기존 멤버의 나이보다 작을 수 없습니다',
        );
      }
    }

    try {
      return await this.prisma.reservationGroup.update({
        where: { id },
        data: dto,
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

    if (group.status !== 'CONFIRMED') {
      throw new ConflictException('확정된 그룹만 시간을 수정할 수 있습니다');
    }

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

    if (
      dto.slots.some(
        (slot) =>
          !reservation.preferredSlots.some(
            (preferred) =>
              preferred.dayOfWeek === slot.dayOfWeek &&
              preferred.startMinute <= slot.startMinute &&
              preferred.endMinute >= slot.endMinute,
          ),
      )
    ) {
      throw new ConflictException(
        '확정 시간은 해당 신청의 후보 시간 범위 안에 포함되어야 합니다',
      );
    }

    const newSlots = dto.slots.map((slot) => ({ ...slot, reservationId }));
    this.assertNoGaps(newSlots);

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

  private assertNoGaps(slots: GroupSlotDto[]): void {
    const byReservationDay = new Map<string, GroupSlotDto[]>();
    for (const slot of slots) {
      const key = `${slot.reservationId}-${slot.dayOfWeek}`;
      const list = byReservationDay.get(key) ?? [];
      list.push(slot);
      byReservationDay.set(key, list);
    }

    for (const list of byReservationDay.values()) {
      const sorted = [...list].sort((a, b) => a.startMinute - b.startMinute);
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].startMinute !== sorted[i - 1].endMinute) {
          throw new ConflictException(
            '선택한 슬롯 사이에 빈 시간이 있어 그룹으로 묶을 수 없습니다',
          );
        }
      }
    }
  }
}
