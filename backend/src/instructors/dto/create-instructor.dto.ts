import { IsOptional, IsString } from 'class-validator';

export class CreateInstructorDto {
  @IsString()
  name: string;

  @IsString()
  subject: string;

  @IsString()
  bio: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;
}
