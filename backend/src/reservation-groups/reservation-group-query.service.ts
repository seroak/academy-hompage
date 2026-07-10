import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ReservationGroupQueryService {
  constructor(private readonly prisma: PrismaService) {}

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
          scheduleDayOfWeek: group.scheduleDayOfWeek,
          scheduleStartMinute: group.scheduleStartMinute,
          scheduleEndMinute: group.scheduleEndMinute,
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
}
