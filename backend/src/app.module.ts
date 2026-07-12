import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { NoticesModule } from './notices/notices.module.js';
import { AuthModule } from './auth/auth.module.js';
import { NotificationModule } from './notifications/notification.module.js';
import { ReservationsModule } from './reservations/reservations.module.js';
import { ReservationGroupsModule } from './reservation-groups/reservation-groups.module.js';
import { MembersModule } from './members/members.module.js';
import { ChildrenModule } from './children/children.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    NotificationModule,
    NoticesModule,
    AuthModule,
    ReservationsModule,
    ReservationGroupsModule,
    MembersModule,
    ChildrenModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
