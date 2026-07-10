import { PartialType } from '@nestjs/mapped-types';
import { IsIn, IsOptional } from 'class-validator';
import { CreateReservationDto } from './create-reservation.dto.js';

export class UpdateReservationDto extends PartialType(CreateReservationDto) {
  @IsOptional()
  @IsIn(['WAITING', 'GROUPED', 'CANCELLED'])
  status?: 'WAITING' | 'GROUPED' | 'CANCELLED';
}
