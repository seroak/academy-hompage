import {
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export const SCHEDULE_DAY_KINDS = ['CLASS', 'HOLIDAY', 'CLOSED'] as const;
export type ScheduleDayKindValue = (typeof SCHEDULE_DAY_KINDS)[number];

export class ClassScheduleDayDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;

  @IsIn(SCHEDULE_DAY_KINDS)
  kind: ScheduleDayKindValue;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/)
  classMonth?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  note?: string;
}
