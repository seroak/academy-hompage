import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class QueryLeadsDto {
  @IsOptional()
  @IsIn([
    'NEW',
    'CONTACTED',
    'CONSULTATION_BOOKED',
    'VISITED',
    'REGISTERED',
    'NO_RESPONSE',
    'DISQUALIFIED',
  ])
  status?:
    | 'NEW'
    | 'CONTACTED'
    | 'CONSULTATION_BOOKED'
    | 'VISITED'
    | 'REGISTERED'
    | 'NO_RESPONSE'
    | 'DISQUALIFIED';

  @IsOptional()
  @IsDateString({ strict: true })
  from?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  to?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  campaign?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  content?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;
}

export class QueryLeadSummaryDto {
  @IsOptional()
  @IsDateString({ strict: true })
  from?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  to?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  campaign?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  content?: string;
}
