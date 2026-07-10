import { mkdirSync } from 'fs';
import { join } from 'path';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { LevelTestsService } from './level-tests.service';
import { CreateLevelTestQuestionDto } from './dto/create-level-test-question.dto';
import { UpdateLevelTestQuestionDto } from './dto/update-level-test-question.dto';
import { UpsertLevelTestAgeConfigDto } from './dto/upsert-level-test-age-config.dto';
import { CreateLevelTestResultDto } from './dto/create-level-test-result.dto';
import {
  MAX_IMAGE_SIZE_BYTES,
  buildUploadFilename,
  isAllowedImageMimeType,
} from './level-test-image.utils';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ASSESSMENT_ROLES } from '../auth/admin-role';
import { Roles } from '../auth/decorators/roles.decorator';
import { ParentJwtGuard } from '../auth/guards/parent-jwt.guard';
import { ParentPrincipal } from '../auth/strategies/parent-jwt.strategy';

interface ParentRequest {
  user: ParentPrincipal;
}

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'level-test-questions');
const UPLOAD_URL_PREFIX = '/uploads/level-test-questions/';

@Controller('level-tests')
export class LevelTestsController {
  constructor(private readonly levelTestsService: LevelTestsService) {}

  // 공개: 랜덤 출제
  @Get('quiz')
  getQuiz(@Query('age', ParseIntPipe) age: number) {
    return this.levelTestsService.getQuiz(age);
  }

  // 부모: 결과 제출
  @UseGuards(ParentJwtGuard)
  @Post('results')
  submitResult(@Body() dto: CreateLevelTestResultDto, @Req() request: ParentRequest) {
    return this.levelTestsService.submitResult(dto, request.user.parentUserId);
  }

  // 관리자: 결과 조회 (개인정보 포함)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ASSESSMENT_ROLES)
  @Get('results')
  findAllResults() {
    return this.levelTestsService.findAllResults();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ASSESSMENT_ROLES)
  @Get('results/:id')
  findOneResult(@Param('id') id: string) {
    return this.levelTestsService.findOneResult(id);
  }

  // 관리자: 문제 은행 (정답 포함이므로 가드 유지)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ASSESSMENT_ROLES)
  @Get('questions')
  findAllQuestions(@Query('age') age?: string) {
    return this.levelTestsService.findAllQuestions(age !== undefined ? Number(age) : undefined);
  }

  // 관리자: 문항 이미지 업로드
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ASSESSMENT_ROLES)
  @Post('question-images')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, callback) => {
          mkdirSync(UPLOAD_DIR, { recursive: true });
          callback(null, UPLOAD_DIR);
        },
        filename: (_req, file, callback) => {
          try {
            callback(null, buildUploadFilename(file.mimetype));
          } catch (error) {
            callback(error as Error, '');
          }
        },
      }),
      limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
      fileFilter: (_req, file, callback) => {
        if (!isAllowedImageMimeType(file.mimetype)) {
          callback(new BadRequestException('지원하지 않는 이미지 형식입니다') as unknown as Error, false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  uploadQuestionImage(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('이미지 파일이 필요합니다');
    }
    return { url: `${UPLOAD_URL_PREFIX}${file.filename}` };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ASSESSMENT_ROLES)
  @Post('questions')
  createQuestion(@Body() dto: CreateLevelTestQuestionDto) {
    return this.levelTestsService.createQuestion(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ASSESSMENT_ROLES)
  @Patch('questions/:id')
  updateQuestion(@Param('id') id: string, @Body() dto: UpdateLevelTestQuestionDto) {
    return this.levelTestsService.updateQuestion(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ASSESSMENT_ROLES)
  @Delete('questions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeQuestion(@Param('id') id: string) {
    return this.levelTestsService.removeQuestion(id);
  }

  // 관리자: 나이별 출제 수 설정
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ASSESSMENT_ROLES)
  @Get('config')
  findAllConfigs() {
    return this.levelTestsService.findAllConfigs();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ASSESSMENT_ROLES)
  @Put('config/:age')
  upsertConfig(@Param('age', ParseIntPipe) age: number, @Body() dto: UpsertLevelTestAgeConfigDto) {
    return this.levelTestsService.upsertConfig(age, dto);
  }
}
