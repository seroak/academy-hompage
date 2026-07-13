import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { ClassScheduleDayDto } from './class-schedule-day.dto.js';

export class UpdateClassScheduleDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClassScheduleDayDto)
  days?: ClassScheduleDayDto[];
}
