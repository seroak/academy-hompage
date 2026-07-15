import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class QueryMarketingDashboardDto {
  @IsOptional() @IsDateString({ strict: true }) from?: string;
  @IsOptional() @IsDateString({ strict: true }) to?: string;
  @IsOptional() @IsString() @MaxLength(100) campaignId?: string;
}
