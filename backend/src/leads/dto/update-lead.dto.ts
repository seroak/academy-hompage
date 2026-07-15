import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateLeadDto {
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
  @IsString()
  @MaxLength(5000)
  adminNote?: string;
}
