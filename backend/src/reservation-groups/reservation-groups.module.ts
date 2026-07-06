import { Module } from '@nestjs/common';
import { ReservationGroupsController } from './reservation-groups.controller';
import { ReservationGroupsService } from './reservation-groups.service';

@Module({
  controllers: [ReservationGroupsController],
  providers: [ReservationGroupsService],
})
export class ReservationGroupsModule {}
