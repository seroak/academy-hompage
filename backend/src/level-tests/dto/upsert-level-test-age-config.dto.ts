import { IsInt, Min } from 'class-validator';

export class UpsertLevelTestAgeConfigDto {
  @IsInt()
  @Min(1)
  drawCount: number;
}
