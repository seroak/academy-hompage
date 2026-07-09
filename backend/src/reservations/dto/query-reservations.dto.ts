import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class QueryReservationsDto {
  @IsOptional()
  @IsIn(['WAITING', 'GROUPED', 'CANCELLED'])
  status?: 'WAITING' | 'GROUPED' | 'CANCELLED';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(4)
  @Max(10)
  age?: number;

  @IsOptional()
  @IsIn(['MON', 'TUE', 'WED', 'THU', 'FRI'])
  dayOfWeek?: string;
}
