import { IsNotEmpty, IsString } from 'class-validator';

export class ExchangeSessionDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}
