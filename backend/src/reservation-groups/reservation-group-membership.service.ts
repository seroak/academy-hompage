import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { NotificationService } from '../notifications/notification.service.js';
import { ReservationGroupsValidator } from './reservation-groups.validator.js';
import { ReservationGroupTransactionService } from './reservation-group-transaction.service.js';
import { AddGroupMemberDto } from './dto/add-group-member.dto.js';
import { ReplaceMemberSlotsDto } from './dto/replace-member-slots.dto.js';
import { MoveGroupMemberDto } from './dto/move-group-member.dto.js';
import { GroupSlotDto } from './dto/create-reservation-group.dto.js';

type ConfirmedGroupWithSlots = Prisma.ReservationGroupGetPayload<{
  include: { slots: true };
}>;

@Injectable()
export class ReservationGroupMembershipService {
  constructor(
    private readonly transaction: ReservationGroupTransactionService,
    private readonly notification: NotificationService,
    private readonly validator: ReservationGroupsValidator,
  ) {}

  async addMember(groupId: string, dto: AddGroupMemberDto) {
    const { reservation, updatedGroup, newSlots } = await this.transaction.run(
      async (tx) => {
        const group = await this.loadConfirmedGroup(
          tx,
          groupId,
          { slots: true },
          '확정된 그룹에만 인원을 추가할 수 있습니다',
        );
        const reservation = await this.loadReservation(tx, dto.reservationId);
        this.validator.validateReservationStatus(
          reservation.status,
          'WAITING',
          '대기 중인 신청만 그룹에 추가할 수 있습니다',
        );
        const currentCount = await tx.reservation.count({ where: { groupId } });
        this.validator.validateCapacity(group.capacity, currentCount + 1);
        this.validator.validateAgeBounds(
          reservation.childAge,
          group.minAge,
          group.maxAge,
        );
        const schedule = this.validator.resolveSchedule(group);
        if (schedule) {
          this.validator.validateSlotsWithinPreferred(
            [schedule],
            reservation.preferredSlots,
          );
          this.validator.validateScheduledMemberSlots(dto.slots, schedule);
        } else {
          this.validator.validateSlotsWithinPreferred(
            dto.slots,
            reservation.preferredSlots,
          );
          this.validator.validateSlotsOverlap(dto.slots, group.slots);
        }
        const newSlots = dto.slots.map((slot) => ({
          ...slot,
          reservationId: dto.reservationId,
        }));
        this.validator.assertNoGaps(newSlots);
        await this.clearAnchorSlots(tx, groupId);
        const createdSlots = await tx.reservationGroupSlot.createManyAndReturn({
          data: newSlots.map((slot) => ({ ...slot, groupId })),
        });
        const updatedReservations = await tx.reservation.updateMany({
          where: { id: dto.reservationId, status: 'WAITING', groupId: null },
          data: { status: 'GROUPED', groupId, requestedGroupId: null },
        });
        this.assertSingleUpdate(
          updatedReservations.count,
          '신청 상태가 변경되어 그룹에 추가할 수 없습니다',
        );
        return {
          reservation,
          updatedGroup: {
            ...group,
            slots: [
              ...group.slots.filter((slot) => slot.reservationId !== null),
              ...createdSlots,
            ],
          },
          newSlots,
        };
      },
    );
    await this.notification.sendGroupConfirmed(
      reservation,
      updatedGroup,
      newSlots,
    );
    return updatedGroup;
  }

  async replaceMemberSlots(
    groupId: string,
    reservationId: string,
    dto: ReplaceMemberSlotsDto,
  ) {
    return this.transaction.run(async (tx) => {
      const group = await this.loadConfirmedGroup(
        tx,
        groupId,
        { slots: true },
        '확정된 그룹만 시간을 수정할 수 있습니다',
      );
      const reservation = await this.loadReservation(tx, reservationId);
      this.assertMemberOf(reservation, groupId);
      const schedule = this.validator.resolveSchedule(group);
      if (schedule) {
        this.validator.validateSlotsWithinPreferred(
          [schedule],
          reservation.preferredSlots,
        );
        this.validator.validateScheduledMemberSlots(dto.slots, schedule);
      } else {
        this.validator.validateSlotsWithinPreferred(
          dto.slots,
          reservation.preferredSlots,
        );
      }
      const newSlots = dto.slots.map((slot) => ({ ...slot, reservationId }));
      this.validator.assertNoGaps(newSlots);
      const confirmed = await tx.reservation.updateMany({
        where: { id: reservationId, groupId, status: 'GROUPED' },
        data: { status: 'GROUPED' },
      });
      this.assertSingleUpdate(
        confirmed.count,
        '신청 상태가 변경되어 시간을 수정할 수 없습니다',
      );
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

  async moveMember(
    sourceGroupId: string,
    reservationId: string,
    dto: MoveGroupMemberDto,
  ) {
    if (dto.targetGroupId === sourceGroupId)
      throw new ConflictException('같은 그룹으로는 이동할 수 없습니다');
    const { reservation, updatedGroup, newSlots } = await this.transaction.run(
      async (tx) => {
        const prepared = await this.prepareMove(
          tx,
          sourceGroupId,
          reservationId,
          dto,
        );
        const updatedGroup = await this.applyMove(
          tx,
          sourceGroupId,
          reservationId,
          dto,
          prepared,
        );
        return {
          reservation: prepared.reservation,
          updatedGroup,
          newSlots: prepared.newSlots,
        };
      },
    );
    await this.notification.sendGroupConfirmed(
      reservation,
      updatedGroup,
      newSlots,
    );
    return updatedGroup;
  }

  private async prepareMove(
    tx: Prisma.TransactionClient,
    sourceGroupId: string,
    reservationId: string,
    dto: MoveGroupMemberDto,
  ) {
    await this.loadConfirmedGroup(
      tx,
      sourceGroupId,
      {},
      '확정된 그룹에서만 멤버를 이동할 수 있습니다',
    );
    const reservation = await this.loadReservation(tx, reservationId);
    this.assertMemberOf(reservation, sourceGroupId);
    const targetGroup = await this.loadConfirmedGroup(
      tx,
      dto.targetGroupId,
      { slots: true },
      '확정된 그룹으로만 이동할 수 있습니다',
    );
    const currentCount = await tx.reservation.count({
      where: { groupId: dto.targetGroupId },
    });
    this.validator.validateCapacity(targetGroup.capacity, currentCount + 1);
    const schedule = this.validator.resolveSchedule(targetGroup);
    if (schedule)
      this.validator.validateScheduledMemberSlots(dto.slots, schedule);
    else if (targetGroup.slots.length > 0)
      this.validator.validateSlotsOverlap(dto.slots, targetGroup.slots);
    const newSlots = dto.slots.map((slot) => ({ ...slot, reservationId }));
    this.validator.assertNoGaps(newSlots);
    const newMinAge = Math.min(targetGroup.minAge, reservation.childAge);
    const newMaxAge = Math.max(targetGroup.maxAge, reservation.childAge);
    return { reservation, targetGroup, newSlots, newMinAge, newMaxAge };
  }

  private async applyMove(
    tx: Prisma.TransactionClient,
    sourceGroupId: string,
    reservationId: string,
    dto: MoveGroupMemberDto,
    {
      targetGroup,
      newSlots,
      newMinAge,
      newMaxAge,
    }: {
      targetGroup: ConfirmedGroupWithSlots;
      newSlots: GroupSlotDto[];
      newMinAge: number;
      newMaxAge: number;
    },
  ) {
    const updatedReservations = await tx.reservation.updateMany({
      where: {
        id: reservationId,
        status: 'GROUPED',
        groupId: sourceGroupId,
      },
      data: {
        status: 'GROUPED',
        groupId: dto.targetGroupId,
        requestedGroupId: null,
      },
    });
    this.assertSingleUpdate(
      updatedReservations.count,
      '신청 상태가 변경되어 그룹을 이동할 수 없습니다',
    );
    await this.vacateMemberSlots(tx, sourceGroupId, reservationId);
    await this.clearAnchorSlots(tx, dto.targetGroupId);
    const createdSlots = await tx.reservationGroupSlot.createManyAndReturn({
      data: newSlots.map((slot) => ({
        ...slot,
        groupId: dto.targetGroupId,
      })),
    });
    await tx.reservation.update({
      where: { id: reservationId },
      data: {
        preferredSlots: {
          deleteMany: {},
          create: dto.slots.map(({ dayOfWeek, startMinute, endMinute }) => ({
            dayOfWeek,
            startMinute,
            endMinute,
          })),
        },
      },
    });
    if (newMinAge !== targetGroup.minAge || newMaxAge !== targetGroup.maxAge) {
      await tx.reservationGroup.update({
        where: { id: dto.targetGroupId },
        data: { minAge: newMinAge, maxAge: newMaxAge },
      });
    }
    return {
      ...targetGroup,
      minAge: newMinAge,
      maxAge: newMaxAge,
      slots: [
        ...targetGroup.slots.filter((slot) => slot.reservationId !== null),
        ...createdSlots,
      ],
    };
  }

  async removeMember(groupId: string, reservationId: string) {
    const { reservation, group } = await this.transaction.run(async (tx) => {
      const group = await this.loadConfirmedGroup(
        tx,
        groupId,
        { reservations: true },
        '확정된 그룹만 멤버를 제거할 수 있습니다',
      );
      const reservation = group.reservations.find(
        (member) => member.id === reservationId,
      );
      if (!reservation)
        throw new NotFoundException(
          `Reservation ${reservationId} not found in group ${groupId}`,
        );
      const updatedReservations = await tx.reservation.updateMany({
        where: { id: reservationId, groupId, status: 'GROUPED' },
        data: { groupId: null, status: 'WAITING' },
      });
      this.assertSingleUpdate(
        updatedReservations.count,
        '신청 상태가 변경되어 멤버를 제거할 수 없습니다',
      );
      await this.vacateMemberSlots(tx, groupId, reservationId);
      return { reservation, group };
    });
    await this.notification.sendGroupMemberRemoved(reservation, group);
  }

  private async vacateMemberSlots(
    tx: Prisma.TransactionClient,
    groupId: string,
    reservationId: string,
  ) {
    const remainingMembers = await tx.reservation.count({
      where: { groupId },
    });
    if (remainingMembers === 0) {
      await tx.reservationGroupSlot.updateMany({
        where: { groupId, reservationId },
        data: { reservationId: null },
      });
    } else {
      await tx.reservationGroupSlot.deleteMany({
        where: { groupId, reservationId },
      });
    }
  }

  private async clearAnchorSlots(
    tx: Prisma.TransactionClient,
    groupId: string,
  ) {
    await tx.reservationGroupSlot.deleteMany({
      where: { groupId, reservationId: null },
    });
  }

  private async loadConfirmedGroup<
    Include extends Prisma.ReservationGroupInclude,
  >(
    tx: Prisma.TransactionClient,
    groupId: string,
    include: Include,
    message: string,
  ): Promise<Prisma.ReservationGroupGetPayload<{ include: Include }>> {
    const group = await tx.reservationGroup.findUnique({
      where: { id: groupId },
      include,
    });
    if (!group)
      throw new NotFoundException(`ReservationGroup ${groupId} not found`);
    this.validator.validateGroupStatus(group.status, 'CONFIRMED', message);
    return group as Prisma.ReservationGroupGetPayload<{ include: Include }>;
  }

  private async loadReservation(
    tx: Prisma.TransactionClient,
    reservationId: string,
  ) {
    const reservation = await tx.reservation.findUnique({
      where: { id: reservationId },
      include: { preferredSlots: true },
    });
    if (!reservation)
      throw new NotFoundException(`Reservation ${reservationId} not found`);
    return reservation;
  }

  private assertMemberOf(
    reservation: { groupId: string | null },
    groupId: string,
  ): void {
    if (reservation.groupId !== groupId)
      throw new ConflictException('해당 신청은 이 그룹의 멤버가 아닙니다');
  }

  private assertSingleUpdate(count: number, message: string): void {
    if (count !== 1) throw new ConflictException(message);
  }
}
