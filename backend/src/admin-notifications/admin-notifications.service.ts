import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationService } from '../notifications/notification.service.js';
import { isPrismaNotFoundError } from '../common/prisma-errors.js';

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

    // NotificationService.sendMail이 내부에서 모든 발송 오류를 삼키므로 이 catch는 오늘
    // 기준으로는 도달하지 않는다. 그래도 이 메서드는 "예약 생성 흐름을 절대 막지 않는다"는
    // 계약을 지켜야 하므로(호출부인 ReservationsService.create가 이를 그대로 신뢰한다),
    // NotificationService의 내부 구현이 바뀌어도 안전하도록 방어적으로 남겨둔다.
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
      take: 50,
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
      if (isPrismaNotFoundError(error)) {
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
}
