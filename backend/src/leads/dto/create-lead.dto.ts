import { Transform, Type } from 'class-transformer';
import {
  Equals,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const optionalTrimmedString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() || undefined : value;

export class CreateLeadDto {
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  guardianName!: string;

  @IsString()
  @Matches(/^01[016789][\s-]?\d{3,4}[\s-]?\d{4}$/)
  phone!: string;

  @Type(() => Number)
  @IsInt()
  @Min(4)
  @Max(10)
  childAge!: number;

  @IsIn(['H13_15', 'H15_18', 'H18_20'])
  contactWindow!: 'H13_15' | 'H15_18' | 'H18_20';

  @IsIn(['AVAILABLE', 'DECIDE_AFTER_CONSULTATION'])
  commuteStatus!: 'AVAILABLE' | 'DECIDE_AFTER_CONSULTATION';

  @Equals(true)
  privacyConsent!: true;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  privacyConsentVersion!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  turnstileToken!: string;

  @IsBoolean()
  analyticsConsent!: boolean;

  @IsBoolean()
  marketingConsent!: boolean;

  @Transform(optionalTrimmedString)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  utmSource?: string;

  @Transform(optionalTrimmedString)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  utmMedium?: string;

  @Transform(optionalTrimmedString)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  utmCampaign?: string;

  @Transform(optionalTrimmedString)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  utmContent?: string;

  @Transform(optionalTrimmedString)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  utmTerm?: string;

  @Transform(optionalTrimmedString)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  fbclid?: string;

  @Transform(optionalTrimmedString)
  @IsOptional()
  @IsString()
  @Matches(/^\//)
  @MaxLength(500)
  landingPath?: string;

  @Transform(optionalTrimmedString)
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  referrer?: string;
}
