import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CoursesModule } from './courses/courses.module';
import { NoticesModule } from './notices/notices.module';
import { InstructorsModule } from './instructors/instructors.module';
import { AuthModule } from './auth/auth.module';
import { NotificationModule } from './notifications/notification.module';
import { ReservationsModule } from './reservations/reservations.module';
import { ReservationGroupsModule } from './reservation-groups/reservation-groups.module';
import { MembersModule } from './members/members.module';
import { LevelTestsModule } from './level-tests/level-tests.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    NotificationModule,
    CoursesModule,
    NoticesModule,
    InstructorsModule,
    AuthModule,
    ReservationsModule,
    ReservationGroupsModule,
    MembersModule,
    LevelTestsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
