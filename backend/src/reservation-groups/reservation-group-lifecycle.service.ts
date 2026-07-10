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
      const createdSlots = await tx.reservationGroupSlot.createManyAndReturn({
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
      return { group: { ...createdGroup, slots: createdSlots }, reservations };
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
        return tx.reservationGroup.update({
          where: { id },
          data: dto,
          include: {
            slots: true,
            reservations: { include: { preferredSlots: true } },
          },
        });
      });
    } catch (error) {
      if (this.isNotFoundError(error)) {
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
