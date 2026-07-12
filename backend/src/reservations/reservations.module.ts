import { Module } from '@nestjs/common';
import { ReservationsController } from './reservations.controller.js';
import { ReservationsService } from './reservations.service.js';
import { ReservationsTransactionService } from './reservations-transaction.service.js';

@Module({
  controllers: [ReservationsController],
  providers: [ReservationsService, ReservationsTransactionService],
})
export class ReservationsModule {}
