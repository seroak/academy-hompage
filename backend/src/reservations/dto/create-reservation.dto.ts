import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  IsMultipleOfSlotStep,
  IsValidSlotEndMinute,
  OPERATING_END_MINUTE,
  OPERATING_START_MINUTE,
} from '../../common/validators/time-range.validators.js';

const DAYS_OF_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

export class PreferredSlotDto {
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

export class CreateReservationDto {
  @IsString()
  @IsNotEmpty()
  childId: string;

  @IsString()
  childName: string;

  @IsInt()
  @Min(4)
  @Max(10)
  childAge: number;

  @IsString()
  parentName: string;

  @IsString()
  parentEmail: string;

  @IsString()
  parentPhone: string;

  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PreferredSlotDto)
  preferredSlots: PreferredSlotDto[];

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  requestedGroupId?: string;

}
