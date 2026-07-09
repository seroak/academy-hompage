import {
  ArrayNotEmpty,
  IsIn,
  IsInt,
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

export class MemberSlotDto {
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

export class AddGroupMemberDto {
  @IsString()
  reservationId: string;

  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => MemberSlotDto)
  slots: MemberSlotDto[];
}
