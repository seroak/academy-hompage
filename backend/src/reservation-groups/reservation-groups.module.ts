import { Module } from '@nestjs/common';
import { ReservationGroupsController } from './reservation-groups.controller.js';
import { ReservationGroupsValidator } from './reservation-groups.validator.js';
import { ReservationGroupQueryService } from './reservation-group-query.service.js';
import { ReservationGroupLifecycleService } from './reservation-group-lifecycle.service.js';
import { ReservationGroupMembershipService } from './reservation-group-membership.service.js';
import { ReservationGroupTransactionService } from './reservation-group-transaction.service.js';

@Module({
  controllers: [ReservationGroupsController],
  providers: [
    ReservationGroupsValidator,
    ReservationGroupTransactionService,
    ReservationGroupQueryService,
    ReservationGroupLifecycleService,
    ReservationGroupMembershipService,
  ],
})
export class ReservationGroupsModule {}
