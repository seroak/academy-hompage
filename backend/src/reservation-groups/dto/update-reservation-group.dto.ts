import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateReservationGroupDto } from './create-reservation-group.dto.js';

export class UpdateReservationGroupDto extends PartialType(
  OmitType(CreateReservationGroupDto, ['slots'] as const),
) {}
