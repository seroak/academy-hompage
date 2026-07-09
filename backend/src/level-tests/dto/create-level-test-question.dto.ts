import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { LevelTestQuestionType } from '@prisma/client';
import { IsValidCorrectChoiceIndex } from './level-test-question.validators';

export class CreateLevelTestQuestionDto {
  @IsInt()
  @Min(4)
  @Max(10)
  age: number;

  @IsEnum(LevelTestQuestionType)
  type: LevelTestQuestionType;

  @IsString()
  prompt: string;

  @ValidateIf((dto) => dto.type === LevelTestQuestionType.MULTIPLE_CHOICE)
  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  choices?: string[];

  @ValidateIf((dto) => dto.type === LevelTestQuestionType.MULTIPLE_CHOICE)
  @IsInt()
  @Min(0)
  @IsValidCorrectChoiceIndex()
  correctChoiceIndex?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
