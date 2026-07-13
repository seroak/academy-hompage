import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import {
  groupConfirmedEmail,
  groupMemberRemovedEmail,
  parentEmailVerificationEmail,
  reservationReceivedEmail,
} from './email-templates.js';

interface ReservationLike {
  childName: string;
  parentName: string;
  parentEmail: string;
}

interface GroupLike {
  label: string;
}

interface SlotLike {
  dayOfWeek: string;
  startMinute: number;
  endMinute: number;
}

const DAY_LABELS: Record<string, string> = {
  MON: '월',
  TUE: '화',
  WED: '수',
  THU: '목',
  FRI: '금',
  SAT: '토',
};

function timeLabel(minute: number): string {
  const hours = Math.floor(minute / 60);
  const minutes = minute % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function slotLabel(slot: SlotLike): string {
  const day = DAY_LABELS[slot.dayOfWeek] ?? slot.dayOfWeek;
  return `${day} ${timeLabel(slot.startMinute)}~${timeLabel(slot.endMinute)}`;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly transporter: nodemailer.Transporter | null;
  private readonly from: string;

  constructor(
    private readonly configService: ConfigService,
    @Optional()
    private readonly createTransport: typeof nodemailer.createTransport = nodemailer.createTransport,
  ) {
    const host = this.configService.get<string>('SMTP_HOST');

    if (!host) {
      this.transporter = null;
    } else {
      this.transporter = this.createTransport({
        host,
        port: Number(this.configService.get<string | number>('SMTP_PORT', 587)),
        secure: this.configService.get<string>('SMTP_SECURE') === 'true',
        auth: this.configService.get<string>('SMTP_USER')
          ? {
              user: this.configService.get<string>('SMTP_USER'),
              pass: this.configService.get<string>('SMTP_PASS'),
            }
          : undefined,
      });
    }

    this.from = this.configService.get<string>(
      'SMTP_FROM',
      '학원 <no-reply@academy.local>',
    );
  }

  async sendReservationReceived(reservation: ReservationLike): Promise<void> {
    await this.sendMail(
      reservation.parentEmail,
      '[학원] 수업 신청이 접수되었습니다',
      `${reservation.parentName}님, ${reservation.childName} 어린이의 수업 신청이 접수되었습니다. 비슷한 신청이 모이면 그룹 편성 결과를 안내드리겠습니다.`,
      reservationReceivedEmail({
        parentName: reservation.parentName,
        childName: reservation.childName,
      }),
    );
  }

  async sendGroupConfirmed(
    reservation: ReservationLike,
    group: GroupLike,
    slots: SlotLike[],
  ): Promise<void> {
    const scheduleText = slots.map(slotLabel).join(', ');
    await this.sendMail(
      reservation.parentEmail,
      '[학원] 수업 그룹이 확정되었습니다',
      `${reservation.parentName}님, ${reservation.childName} 어린이가 "${group.label}" 그룹(${scheduleText})에 편성되었습니다.`,
      groupConfirmedEmail({
        parentName: reservation.parentName,
        childName: reservation.childName,
        groupLabel: group.label,
        scheduleText,
      }),
    );
  }

  async sendGroupMemberRemoved(
    reservation: ReservationLike,
    group: GroupLike,
  ): Promise<void> {
    await this.sendMail(
      reservation.parentEmail,
      '[학원] 그룹 편성이 변경되었습니다',
      `${reservation.parentName}님, ${reservation.childName} 어린이가 "${group.label}" 그룹에서 제외되어 다시 대기 상태로 변경되었습니다.`,
      groupMemberRemovedEmail({
        parentName: reservation.parentName,
        childName: reservation.childName,
        groupLabel: group.label,
      }),
    );
  }

  async sendParentEmailVerification(
    email: string,
    name: string,
    verifyUrl: string,
  ): Promise<void> {
    await this.sendMail(
      email,
      '[학원] 이메일 인증을 완료해 주세요',
      `${name}님, 아래 링크를 눌러 이메일 인증을 완료하고 회원가입을 마쳐 주세요.\n${verifyUrl}\n\n본인이 요청하지 않았다면 이 메일을 무시해 주세요.`,
      parentEmailVerificationEmail({ name, verifyUrl }),
    );
  }

  private async sendMail(
    to: string,
    subject: string,
    text: string,
    html: string,
  ): Promise<void> {
    if (!to) {
      this.logger.log(`(수신 이메일 없음) subject=${subject}`);
      return;
    }

    if (!this.transporter) {
      this.logger.log(`(SMTP 미설정) to=${to} subject=${subject}\n${text}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        text,
        html,
      });
    } catch (error) {
      this.logger.error(
        `메일 발송 실패: to=${to}`,
        error instanceof Error ? error.stack : error,
      );
    }
  }
}
