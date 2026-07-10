import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationService } from '../notifications/notification.service.js';
import { ReservationGroupsValidator } from './reservation-groups.validator.js';
import { ReservationGroupTransactionService } from './reservation-group-transaction.service.js';
import { AddGroupMemberDto } from './dto/add-group-member.dto.js';
import { ReplaceMemberSlotsDto } from './dto/replace-member-slots.dto.js';
import { MoveGroupMemberDto } from './dto/move-group-member.dto.js';

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
        const group = await tx.reservationGroup.findUnique({
          where: { id: groupId },
          include: { slots: true },
        });
        if (!group)
          throw new NotFoundException(`ReservationGroup ${groupId} not found`);
        this.validator.validateGroupStatus(
          group.status,
          'CONFIRMED',
          '확정된 그룹에만 인원을 추가할 수 있습니다',
        );
        const reservation = await tx.reservation.findUnique({
          where: { id: dto.reservationId },
          include: { preferredSlots: true },
        });
        if (!reservation)
          throw new NotFoundException(
            `Reservation ${dto.reservationId} not found`,
          );
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
        const schedule = this.getSchedule(group);
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
        const createdSlots = await tx.reservationGroupSlot.createManyAndReturn({
          data: newSlots.map((slot) => ({ ...slot, groupId })),
        });
        const updatedReservations = await tx.reservation.updateMany({
          where: { id: dto.reservationId, status: 'WAITING', groupId: null },
          data: { status: 'GROUPED', groupId, requestedGroupId: null },
        });
        if (updatedReservations.count !== 1) {
          throw new ConflictException(
            '신청 상태가 변경되어 그룹에 추가할 수 없습니다',
          );
        }
        return {
          reservation,
          updatedGroup: { ...group, slots: [...group.slots, ...createdSlots] },
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
      const group = await tx.reservationGroup.findUnique({
        where: { id: groupId },
        include: { slots: true },
      });
      if (!group)
        throw new NotFoundException(`ReservationGroup ${groupId} not found`);
      this.validator.validateGroupStatus(
        group.status,
        'CONFIRMED',
        '확정된 그룹만 시간을 수정할 수 있습니다',
      );
      const reservation = await tx.reservation.findUnique({
        where: { id: reservationId },
        include: { preferredSlots: true },
      });
      if (!reservation)
        throw new NotFoundException(`Reservation ${reservationId} not found`);
      if (reservation.groupId !== groupId)
        throw new ConflictException('해당 신청은 이 그룹의 멤버가 아닙니다');
      const schedule = this.getSchedule(group);
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
      if (confirmed.count !== 1)
        throw new ConflictException(
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
        const sourceGroup = await tx.reservationGroup.findUnique({
          where: { id: sourceGroupId },
        });
        if (!sourceGroup)
          throw new NotFoundException(
            `ReservationGroup ${sourceGroupId} not found`,
          );
        this.validator.validateGroupStatus(
          sourceGroup.status,
          'CONFIRMED',
          '확정된 그룹에서만 멤버를 이동할 수 있습니다',
        );
        const reservation = await tx.reservation.findUnique({
          where: { id: reservationId },
          include: { preferredSlots: true },
        });
        if (!reservation)
          throw new NotFoundException(`Reservation ${reservationId} not found`);
        if (reservation.groupId !== sourceGroupId)
          throw new ConflictException('해당 신청은 이 그룹의 멤버가 아닙니다');
        const targetGroup = await tx.reservationGroup.findUnique({
          where: { id: dto.targetGroupId },
          include: { slots: true },
        });
        if (!targetGroup)
          throw new NotFoundException(
            `ReservationGroup ${dto.targetGroupId} not found`,
          );
        this.validator.validateGroupStatus(
          targetGroup.status,
          'CONFIRMED',
          '확정된 그룹으로만 이동할 수 있습니다',
        );
        const currentCount = await tx.reservation.count({
          where: { groupId: dto.targetGroupId },
        });
        this.validator.validateCapacity(targetGroup.capacity, currentCount + 1);
        const schedule = this.getSchedule(targetGroup);
        if (schedule)
          this.validator.validateScheduledMemberSlots(dto.slots, schedule);
        else if (targetGroup.slots.length > 0)
          this.validator.validateSlotsOverlap(dto.slots, targetGroup.slots);
        const newSlots = dto.slots.map((slot) => ({ ...slot, reservationId }));
        this.validator.assertNoGaps(newSlots);
        const newMinAge = Math.min(targetGroup.minAge, reservation.childAge);
        const newMaxAge = Math.max(targetGroup.maxAge, reservation.childAge);
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
        if (updatedReservations.count !== 1)
          throw new ConflictException(
            '신청 상태가 변경되어 그룹을 이동할 수 없습니다',
          );
        await tx.reservationGroupSlot.deleteMany({
          where: { groupId: sourceGroupId, reservationId },
        });
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
              create: dto.slots.map(
                ({ dayOfWeek, startMinute, endMinute }) => ({
                  dayOfWeek,
                  startMinute,
                  endMinute,
                }),
              ),
            },
          },
        });
        if (
          newMinAge !== targetGroup.minAge ||
          newMaxAge !== targetGroup.maxAge
        ) {
          await tx.reservationGroup.update({
            where: { id: dto.targetGroupId },
            data: { minAge: newMinAge, maxAge: newMaxAge },
          });
        }
        return {
          reservation,
          updatedGroup: {
            ...targetGroup,
            minAge: newMinAge,
            maxAge: newMaxAge,
            slots: [...targetGroup.slots, ...createdSlots],
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

  async removeMember(groupId: string, reservationId: string) {
    const { reservation, group } = await this.transaction.run(async (tx) => {
      const group = await tx.reservationGroup.findUnique({
        where: { id: groupId },
        include: { reservations: true },
      });
      if (!group)
        throw new NotFoundException(`ReservationGroup ${groupId} not found`);
      this.validator.validateGroupStatus(
        group.status,
        'CONFIRMED',
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
      if (updatedReservations.count !== 1)
        throw new ConflictException(
          '신청 상태가 변경되어 멤버를 제거할 수 없습니다',
        );
      await tx.reservationGroupSlot.deleteMany({
        where: { groupId, reservationId },
      });
      return { reservation, group };
    });
    await this.notification.sendGroupMemberRemoved(reservation, group);
  }

  private getSchedule(group: {
    scheduleDayOfWeek?: string | null;
    scheduleStartMinute?: number | null;
    scheduleEndMinute?: number | null;
  }): { dayOfWeek: string; startMinute: number; endMinute: number } | null {
    if (
      group.scheduleDayOfWeek == null ||
      group.scheduleStartMinute == null ||
      group.scheduleEndMinute == null
    )
      return null;
    return {
      dayOfWeek: group.scheduleDayOfWeek,
      startMinute: group.scheduleStartMinute,
      endMinute: group.scheduleEndMinute,
    };
  }
}
