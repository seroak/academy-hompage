import { PartialType } from '@nestjs/mapped-types';
import { CreateLevelTestQuestionDto } from './create-level-test-question.dto';

export class UpdateLevelTestQuestionDto extends PartialType(CreateLevelTestQuestionDto) {}
