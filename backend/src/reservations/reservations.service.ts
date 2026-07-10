import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationService } from '../notifications/notification.service.js';
import { CreateReservationDto } from './dto/create-reservation.dto.js';
import { CreateWalkInReservationDto } from './dto/create-walk-in-reservation.dto.js';
import { UpdateReservationDto } from './dto/update-reservation.dto.js';
import { QueryReservationsDto } from './dto/query-reservations.dto.js';

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
    if (query.dayOfWeek) {
      where.preferredSlots = { some: { dayOfWeek: query.dayOfWeek } };
    }

    return this.prisma.reservation.findMany({
      where,
      include: { preferredSlots: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: { preferredSlots: true },
    });

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

    const { preferredSlots, ...reservationData } = dto;

    const reservation = await this.prisma.reservation.create({
      data: {
        ...reservationData,
        parentUserId,
        preferredSlots: { create: preferredSlots },
      },
      include: { preferredSlots: true },
    });
    await this.notification.sendReservationReceived(reservation);
    return reservation;
  }

  async createWalkInReservation(dto: CreateWalkInReservationDto) {
    const { preferredSlots, parentEmail, ...reservationData } = dto;

    return this.prisma.reservation.create({
      data: {
        ...reservationData,
        parentEmail: parentEmail ?? '',
        preferredSlots: { create: preferredSlots },
      },
      include: { preferredSlots: true },
    });
  }

  async update(id: string, dto: UpdateReservationDto) {
    const { preferredSlots, ...reservationData } = dto;
    const data: Prisma.ReservationUpdateInput = { ...reservationData };

    if (preferredSlots) {
      data.preferredSlots = {
        deleteMany: {},
        create: preferredSlots,
      };
    }

    try {
      return await this.prisma.reservation.update({
        where: { id },
        data,
        include: { preferredSlots: true },
      });
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
