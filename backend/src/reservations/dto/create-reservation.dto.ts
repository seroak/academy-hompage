import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

const DAYS_OF_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

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

  @IsIn(DAYS_OF_WEEK)
  preferredDayOfWeek: string;

  @IsInt()
  @Min(12)
  @Max(17)
  preferredHour: number;

  @IsOptional()
  @IsString()
  note?: string;
}
