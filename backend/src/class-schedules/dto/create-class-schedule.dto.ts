import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  Max,
  Min,
  Validate,
  ValidateNested,
} from 'class-validator';
import { ClassScheduleDayDto } from './class-schedule-day.dto.js';
import { ClassScheduleDaysConstraint } from './class-schedule-days.validator.js';

export class CreateClassScheduleDto {
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  @IsInt()
  @Min(1)
  @Max(4)
  quarter: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClassScheduleDayDto)
  @Validate(ClassScheduleDaysConstraint)
  days: ClassScheduleDayDto[];
}
