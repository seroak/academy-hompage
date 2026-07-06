import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { QueryReservationsDto } from './dto/query-reservations.dto';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notification: NotificationService,
  ) {}

  findAll(query: QueryReservationsDto) {
    const where: Prisma.ReservationWhereInput = {};

    if (query.status) where.status = query.status;
    if (query.age !== undefined) where.childAge = query.age;
    if (query.dayOfWeek) where.preferredDayOfWeek = query.dayOfWeek;
    if (query.hour !== undefined) where.preferredHour = query.hour;

    return this.prisma.reservation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const reservation = await this.prisma.reservation.findUnique({ where: { id } });

    if (!reservation) {
      throw new NotFoundException(`Reservation ${id} not found`);
    }

    return reservation;
  }

  async create(dto: CreateReservationDto, parentUserId?: string) {
    if (!parentUserId) {
      throw new NotFoundException('Parent user not found');
    }

    const parentUser = await this.prisma.parentUser.findUnique({ where: { id: parentUserId } });

    if (!parentUser) {
      throw new NotFoundException(`ParentUser ${parentUserId} not found`);
    }

    const reservation = await this.prisma.reservation.create({
      data: { ...dto, parentUserId },
    });
    await this.notification.sendReservationReceived(reservation);
    return reservation;
  }

  async update(id: string, dto: UpdateReservationDto) {
    try {
      return await this.prisma.reservation.update({ where: { id }, data: dto });
    } catch (error) {
      if (this.isNotFoundError(error)) {
        throw new NotFoundException(`Reservation ${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.reservation.delete({ where: { id } });
    } catch (error) {
      if (this.isNotFoundError(error)) {
        throw new NotFoundException(`Reservation ${id} not found`);
      }
      throw error;
    }
  }

  private isNotFoundError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && (error as { code?: string }).code === 'P2025';
  }
}
