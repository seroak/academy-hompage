import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { IsMetaUtmId } from './meta-utm-id.validator.js';

export const MARKETING_EVENT_NAMES = [
  'view_ad_landing',
  'course_view',
  'consultation_cta_click',
  'phone_click',
  'lead_form_start',
] as const;
export type MarketingEventName = (typeof MARKETING_EVENT_NAMES)[number];

export class CreateMarketingEventDto {
  @IsUUID() eventId!: string;
  @IsUUID() sessionId!: string;
  @IsIn(MARKETING_EVENT_NAMES) name!: MarketingEventName;
  @IsOptional() @IsString() @MaxLength(100) utmSource?: string;
  @IsOptional() @IsString() @MaxLength(100) utmMedium?: string;
  @IsOptional() @IsString() @MaxLength(200) @IsMetaUtmId() utmCampaign?: string;
  @IsOptional() @IsString() @MaxLength(500) @IsMetaUtmId() utmContent?: string;
  @IsOptional() @IsString() @MaxLength(200) utmTerm?: string;
  @IsOptional() @IsString() @MaxLength(500) fbclid?: string;
  @IsOptional() @IsString() @MaxLength(1000) landingPath?: string;
  @IsDateString() occurredAt!: string;
}
