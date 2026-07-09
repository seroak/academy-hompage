import {
  ArrayNotEmpty,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  IsMultipleOfSlotStep,
  IsValidSlotEndMinute,
  OPERATING_END_MINUTE,
  OPERATING_START_MINUTE,
} from '../../common/validators/time-range.validators';

const DAYS_OF_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

export class GroupSlotDto {
  @IsString()
  reservationId: string;

  @IsIn(DAYS_OF_WEEK)
  dayOfWeek: string;

  @IsInt()
  @Min(OPERATING_START_MINUTE)
  @Max(OPERATING_END_MINUTE)
  @IsMultipleOfSlotStep()
  startMinute: number;

  @IsInt()
  @Min(OPERATING_START_MINUTE)
  @Max(OPERATING_END_MINUTE)
  @IsMultipleOfSlotStep()
  @IsValidSlotEndMinute()
  endMinute: number;
}

export class CreateReservationGroupDto {
  @IsString()
  label: string;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsOptional()
  @IsInt()
  @Min(4)
  @Max(10)
  minAge?: number;

  @IsOptional()
  @IsInt()
  @Min(4)
  @Max(10)
  maxAge?: number;

  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => GroupSlotDto)
  slots: GroupSlotDto[];
}
