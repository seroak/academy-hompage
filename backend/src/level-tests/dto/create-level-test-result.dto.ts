import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class SubmitLevelTestAnswerDto {
  @IsString()
  questionId: string;

  @IsOptional()
  @IsInt()
  selectedChoiceIndex?: number;

  @IsOptional()
  @IsString()
  textAnswer?: string;
}

export class CreateLevelTestResultDto {
  @IsString()
  @IsNotEmpty()
  childId: string;

  @IsString()
  childName: string;

  @IsInt()
  @Min(4)
  @Max(10)
  childAge: number;

  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SubmitLevelTestAnswerDto)
  answers: SubmitLevelTestAnswerDto[];
}
