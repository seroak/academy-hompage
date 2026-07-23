import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationService } from '../notifications/notification.service.js';
import { ReservationGroupsValidator } from './reservation-groups.validator.js';
import { ReservationGroupTransactionService } from './reservation-group-transaction.service.js';
import {
  CreateReservationGroupDto,
  GroupSlotDto,
} from './dto/create-reservation-group.dto.js';
import { UpdateReservationGroupDto } from './dto/update-reservation-group.dto.js';
import { FULL_GROUP_INCLUDE } from './reservation-group-includes.js';
import { isPrismaNotFoundError } from '../common/prisma-errors.js';

@Injectable()
export class ReservationGroupLifecycleService {
  constructor(
    private readonly transaction: ReservationGroupTransactionService,
    private readonly notification: NotificationService,
    private readonly validator: ReservationGroupsValidator,
  ) {}

  async create(dto: CreateReservationGroupDto) {
    const { group, reservations } = await this.transaction.run(async (tx) => {
      const reservationIds = [
        ...new Set(dto.slots.map((slot) => slot.reservationId)),
      ];
      const reservations = await tx.reservation.findMany({
        where: { id: { in: reservationIds } },
        include: { preferredSlots: true },
      });
      if (reservations.length !== reservationIds.length) {
        throw new ConflictException('일부 신청을 찾을 수 없습니다');
      }
      reservations.forEach((reservation) =>
        this.validator.validateReservationStatus(
          reservation.status,
          'WAITING',
          '대기 중인 신청만 그룹으로 확정할 수 있습니다',
        ),
      );
      this.validator.validateCapacity(dto.capacity, reservationIds.length);

      const ages = reservations.map((reservation) => reservation.childAge);
      const minAge = dto.minAge ?? (ages.length > 0 ? Math.min(...ages) : 4);
      const maxAge = dto.maxAge ?? (ages.length > 0 ? Math.max(...ages) : 10);
      const reservationById = new Map(
        reservations.map((reservation) => [reservation.id, reservation]),
      );
      const schedule = this.validator.resolveSchedule(dto);
      if (schedule) {
        const otherGroups = await tx.reservationGroup.findMany({
          where: { status: { in: ['CONFIRMED', 'EMPTY'] } },
          include: { slots: true },
        });
        this.validator.validateScheduleOverlap(
          schedule.dayOfWeek,
          schedule.startMinute,
          schedule.endMinute,
          otherGroups,
        );

        const slotsByReservation = new Map<string, GroupSlotDto[]>();
        dto.slots.forEach((slot) => {
          const slots = slotsByReservation.get(slot.reservationId) ?? [];
          slots.push(slot);
          slotsByReservation.set(slot.reservationId, slots);
        });
        slotsByReservation.forEach((slots, reservationId) => {
          const reservation = reservationById.get(reservationId)!;
          this.validator.validateSlotsWithinPreferred(
            [schedule],
            reservation.preferredSlots,
          );
          this.validator.validateScheduledMemberSlots(slots, schedule);
        });
      } else {
        dto.slots.forEach((slot) => {
          const reservation = reservationById.get(slot.reservationId)!;
          this.validator.validateSlotsWithinPreferred(
            [slot],
            reservation.preferredSlots,
          );
        });
      }
      this.validator.assertNoGaps(dto.slots);

      const createdGroup = await tx.reservationGroup.create({
        data: {
          label: dto.label,
          status: reservationIds.length > 0 ? 'CONFIRMED' : 'EMPTY',
          capacity: dto.capacity,
          minAge,
          maxAge,
          ...(dto.scheduleDayOfWeek !== undefined
            ? {
                scheduleDayOfWeek: dto.scheduleDayOfWeek,
                scheduleStartMinute: dto.scheduleStartMinute,
                scheduleEndMinute: dto.scheduleEndMinute,
              }
            : {}),
        },
      });
      await tx.reservationGroupSlot.createManyAndReturn({
        data: dto.slots.map((slot) => ({ ...slot, groupId: createdGroup.id })),
      });
      const updatedReservations = await tx.reservation.updateMany({
        where: { id: { in: reservationIds }, status: 'WAITING', groupId: null },
        data: { status: 'GROUPED', groupId: createdGroup.id },
      });
      if (updatedReservations.count !== reservationIds.length) {
        throw new ConflictException(
          '일부 신청의 상태가 변경되어 그룹을 확정할 수 없습니다',
        );
      }
      const group = await tx.reservationGroup.findUnique({
        where: { id: createdGroup.id },
        include: FULL_GROUP_INCLUDE,
      });
      return { group: group!, reservations };
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

  async update(id: string, dto: UpdateReservationGroupDto) {
    try {
      return await this.transaction.run(async (tx) => {
        if (
          dto.capacity !== undefined ||
          dto.minAge !== undefined ||
          dto.maxAge !== undefined
        ) {
          const members = await tx.reservation.findMany({
            where: { groupId: id },
          });
          this.validator.validateUpdateBounds(
            members,
            dto.capacity,
            dto.minAge,
            dto.maxAge,
          );
        }

        const scheduleFields = [
          dto.scheduleDayOfWeek,
          dto.scheduleStartMinute,
          dto.scheduleEndMinute,
        ];
        const hasScheduleChange = scheduleFields.some(
          (value) => value !== undefined,
        );

        if (hasScheduleChange) {
          if (scheduleFields.some((value) => value === undefined)) {
            throw new ConflictException(
              '요일과 시작·종료 시각을 모두 선택해 주세요',
            );
          }
          const group = await tx.reservationGroup.findUnique({
            where: { id },
            include: { slots: true },
          });
          if (!group) {
            throw new NotFoundException(`ReservationGroup ${id} not found`);
          }
          const newSchedule = {
            dayOfWeek: dto.scheduleDayOfWeek!,
            startMinute: dto.scheduleStartMinute!,
            endMinute: dto.scheduleEndMinute!,
          };
          const otherGroups = await tx.reservationGroup.findMany({
            where: { id: { not: id }, status: { in: ['CONFIRMED', 'EMPTY'] } },
            include: { slots: true },
          });
          this.validator.validateScheduleOverlap(
            newSchedule.dayOfWeek,
            newSchedule.startMinute,
            newSchedule.endMinute,
            otherGroups,
          );
          const members = await tx.reservation.findMany({
            where: { groupId: id, status: 'GROUPED' },
            include: { preferredSlots: true },
          });
          members.forEach((member) =>
            this.validator.validateSlotsWithinPreferred(
              [newSchedule],
              member.preferredSlots,
            ),
          );
          const hadAnchor = group.slots.some(
            (slot) => slot.reservationId === null,
          );
          await tx.reservationGroupSlot.deleteMany({ where: { groupId: id } });
          const newSlots = [
            ...members.map((member) => ({
              ...newSchedule,
              groupId: id,
              reservationId: member.id,
            })),
            ...(members.length === 0 && hadAnchor
              ? [{ ...newSchedule, groupId: id, reservationId: null }]
              : []),
          ];
          if (newSlots.length > 0) {
            await tx.reservationGroupSlot.createManyAndReturn({
              data: newSlots,
            });
          }
        }

        return tx.reservationGroup.update({
          where: { id },
          data: dto,
          include: FULL_GROUP_INCLUDE,
        });
      });
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        throw new NotFoundException(`ReservationGroup ${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      await this.transaction.run(async (tx) => {
        await tx.reservation.updateMany({
          where: { groupId: id },
          data: { groupId: null, status: 'WAITING' },
        });
        await tx.reservationGroup.delete({ where: { id } });
      });
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        throw new NotFoundException(`ReservationGroup ${id} not found`);
      }
      throw error;
    }
  }
}
