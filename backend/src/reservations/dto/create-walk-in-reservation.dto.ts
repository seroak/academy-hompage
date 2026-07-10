import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { PreferredSlotDto } from './create-reservation.dto.js';

export class CreateWalkInReservationDto {
  @IsString()
  childName: string;

  @IsInt()
  @Min(4)
  @Max(10)
  childAge: number;

  @IsString()
  parentName: string;

  @IsOptional()
  @IsEmail()
  parentEmail?: string;

  @IsOptional()
  @IsString()
  parentPhone?: string;

  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PreferredSlotDto)
  preferredSlots: PreferredSlotDto[];
}
