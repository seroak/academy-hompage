import { ArrayNotEmpty, IsIn, IsInt, IsString, Max, Min } from 'class-validator';

const DAYS_OF_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export class CreateReservationGroupDto {
  @IsString()
  label: string;

  @IsIn(DAYS_OF_WEEK)
  dayOfWeek: string;

  @IsInt()
  @Min(12)
  @Max(17)
  hour: number;

  @ArrayNotEmpty()
  @IsString({ each: true })
  reservationIds: string[];
}
