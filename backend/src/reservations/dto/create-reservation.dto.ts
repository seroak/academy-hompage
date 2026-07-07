import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

const DAYS_OF_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export class PreferredSlotDto {
  @IsIn(DAYS_OF_WEEK)
  dayOfWeek: string;

  @IsInt()
  @Min(12)
  @Max(17)
  hour: number;
}

export class CreateReservationDto {
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

  @IsOptional()
  @IsString()
  parentPhone?: string;

  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PreferredSlotDto)
  preferredSlots: PreferredSlotDto[];

  @IsOptional()
  @IsString()
  note?: string;
}
