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

const CONTACT_WINDOWS = [
  'H09_10', 'H10_11', 'H11_12', 'H12_13', 'H13_14', 'H14_15', 'H15_16',
  'H16_17', 'H17_18', 'H18_19', 'H19_20', 'H20_21', 'H21_22', 'H22_23', 'H23_24',
] as const;
type ContactWindow = (typeof CONTACT_WINDOWS)[number];

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

  @IsIn(CONTACT_WINDOWS)
  contactWindow!: ContactWindow;

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
