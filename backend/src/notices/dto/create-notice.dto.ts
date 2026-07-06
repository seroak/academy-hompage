import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateNoticeDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsBoolean()
  pinned?: boolean;
}
