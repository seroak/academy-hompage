import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  category: string;

  @IsString()
  level: string;

  @IsInt()
  @Min(0)
  tuition: number;

  @IsString()
  schedule: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsString()
  instructorId: string;
}
