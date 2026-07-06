import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

interface ReservationLike {
  childName: string;
  parentName: string;
  parentEmail: string;
}

interface GroupLike {
  label: string;
  dayOfWeek: string;
  hour: number;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly transporter: nodemailer.Transporter | null;
  private readonly from: string;

  constructor() {
    const host = process.env.SMTP_HOST;

    if (!host) {
      this.transporter = null;
    } else {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });
    }

    this.from = process.env.SMTP_FROM ?? '학원 <no-reply@academy.local>';
  }

  async sendReservationReceived(reservation: ReservationLike): Promise<void> {
    await this.sendMail(
      reservation.parentEmail,
      '[학원] 수업 신청이 접수되었습니다',
      `${reservation.parentName}님, ${reservation.childName} 어린이의 수업 신청이 접수되었습니다. 비슷한 신청이 모이면 그룹 편성 결과를 안내드리겠습니다.`,
    );
  }

  async sendGroupConfirmed(reservation: ReservationLike, group: GroupLike): Promise<void> {
    await this.sendMail(
      reservation.parentEmail,
      '[학원] 수업 그룹이 확정되었습니다',
      `${reservation.parentName}님, ${reservation.childName} 어린이가 "${group.label}" 그룹(${group.dayOfWeek} ${group.hour}시)에 편성되었습니다.`,
    );
  }

  private async sendMail(to: string, subject: string, text: string): Promise<void> {
    if (!this.transporter) {
      this.logger.log(`(SMTP 미설정) to=${to} subject=${subject}`);
      return;
    }

    try {
      await this.transporter.sendMail({ from: this.from, to, subject, text });
    } catch (error) {
      this.logger.error(`메일 발송 실패: to=${to}`, error instanceof Error ? error.stack : error);
    }
  }
}
