import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';
import { CreateReservationGroupDto } from './dto/create-reservation-group.dto';
import { UpdateReservationGroupDto } from './dto/update-reservation-group.dto';

@Injectable()
export class ReservationGroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notification: NotificationService,
  ) {}

  findAll() {
    return this.prisma.reservationGroup.findMany({
      include: { reservations: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const group = await this.prisma.reservationGroup.findUnique({
      where: { id },
      include: { reservations: true },
    });

    if (!group) {
      throw new NotFoundException(`ReservationGroup ${id} not found`);
    }

    return group;
  }

  async create(dto: CreateReservationGroupDto) {
    const reservations = await this.prisma.reservation.findMany({
      where: { id: { in: dto.reservationIds } },
    });

    if (reservations.length !== dto.reservationIds.length) {
      throw new ConflictException('일부 신청을 찾을 수 없습니다');
    }

    if (reservations.some((reservation) => reservation.status !== 'WAITING')) {
      throw new ConflictException('대기 중인 신청만 그룹으로 확정할 수 있습니다');
    }

    const group = await this.prisma.$transaction(async (tx) => {
      const createdGroup = await tx.reservationGroup.create({
        data: { label: dto.label, dayOfWeek: dto.dayOfWeek, hour: dto.hour },
      });

      await tx.reservation.updateMany({
        where: { id: { in: dto.reservationIds } },
        data: { status: 'GROUPED', groupId: createdGroup.id },
      });

      return createdGroup;
    });

    await Promise.all(
      reservations.map((reservation) => this.notification.sendGroupConfirmed(reservation, group)),
    );

    return group;
  }

  async update(id: string, dto: UpdateReservationGroupDto) {
    try {
      return await this.prisma.reservationGroup.update({ where: { id }, data: dto });
    } catch (error) {
      if (this.isNotFoundError(error)) {
        throw new NotFoundException(`ReservationGroup ${id} not found`);
      }
      throw error;
    }
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
    return typeof error === 'object' && error !== null && (error as { code?: string }).code === 'P2025';
  }
}
