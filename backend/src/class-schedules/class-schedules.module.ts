import { Module } from '@nestjs/common';
import { ClassSchedulesController } from './class-schedules.controller.js';
import { ClassSchedulesService } from './class-schedules.service.js';

@Module({
  controllers: [ClassSchedulesController],
  providers: [ClassSchedulesService],
})
export class ClassSchedulesModule {}
