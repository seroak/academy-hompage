import { Module } from '@nestjs/common';
import { ReservationGroupsController } from './reservation-groups.controller';
import { ReservationGroupsService } from './reservation-groups.service';
import { ReservationGroupsValidator } from './reservation-groups.validator';

@Module({
  controllers: [ReservationGroupsController],
  providers: [ReservationGroupsService, ReservationGroupsValidator],
})
export class ReservationGroupsModule {}
