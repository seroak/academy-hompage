import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateReservationGroupDto } from './create-reservation-group.dto';

export class UpdateReservationGroupDto extends PartialType(
  OmitType(CreateReservationGroupDto, ['reservationIds'] as const),
) {}
