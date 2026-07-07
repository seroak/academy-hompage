import { ArrayNotEmpty, IsIn, IsInt, IsString, Max, Min } from 'class-validator';
import {
  IsMultipleOfSlotStep,
  IsValidSlotEndMinute,
  OPERATING_END_MINUTE,
  OPERATING_START_MINUTE,
} from '../../common/validators/time-range.validators';

const DAYS_OF_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export class CreateReservationGroupDto {
  @IsString()
  label: string;

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

  @ArrayNotEmpty()
  @IsString({ each: true })
  reservationIds: string[];
}
