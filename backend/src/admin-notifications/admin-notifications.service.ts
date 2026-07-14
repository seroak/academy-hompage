import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationService } from '../notifications/notification.service.js';

interface ReservationCreatedLike {
  id: string;
  childName: string;
  childAge: number;
  parentName: string;
  parentEmail: string;
  parentPhone?: string | null;
  preferredSlots: { dayOfWeek: string; startMinute: number; endMinute: number }[];
}

@Injectable()
export class AdminNotificationsService {
  private readonly logger = new Logger(AdminNotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notification: NotificationService,
  ) {}

  async notifyReservationCreated(reservation: ReservationCreatedLike): Promise<void> {
    try {
      await this.prisma.adminNotification.create({
        data: {
          type: 'RESERVATION_CREATED',
          title: `${reservation.childName} 어린이의 수업 신청이 접수되었습니다`,
          body: `${reservation.parentName}님이 ${reservation.childName}(${reservation.childAge}세) 어린이의 수업을 신청했습니다.`,
          reservationId: reservation.id,
        },
      });
    } catch (error) {
      this.logger.error(
        `관리자 인앱 알림 생성 실패: reservationId=${reservation.id}`,
        error instanceof Error ? error.stack : error,
      );
    }

    try {
      await this.notification.sendAdminReservationReceived(reservation);
    } catch (error) {
      this.logger.error(
        `관리자 이메일 알림 발송 실패: reservationId=${reservation.id}`,
        error instanceof Error ? error.stack : error,
      );
    }
  }

  findAll() {
    return this.prisma.adminNotification.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async unreadCount(): Promise<{ count: number }> {
    const count = await this.prisma.adminNotification.count({
      where: { readAt: null },
    });
    return { count };
  }

  async markRead(id: string) {
    try {
      return await this.prisma.adminNotification.update({
        where: { id },
        data: { readAt: new Date() },
      });
    } catch (error) {
      if (this.isNotFoundError(error)) {
        throw new NotFoundException(`AdminNotification ${id} not found`);
      }
      throw error;
    }
  }

  async markAllRead(): Promise<void> {
    await this.prisma.adminNotification.updateMany({
      where: { readAt: null },
      data: { readAt: new Date() },
    });
  }

  private isNotFoundError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && (error as { code?: string }).code === 'P2025';
  }
}
