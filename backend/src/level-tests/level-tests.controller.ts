import {
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
  UseGuards,
} from '@nestjs/common';
import { LevelTestsService } from './level-tests.service';
import { CreateLevelTestQuestionDto } from './dto/create-level-test-question.dto';
import { UpdateLevelTestQuestionDto } from './dto/update-level-test-question.dto';
import { UpsertLevelTestAgeConfigDto } from './dto/upsert-level-test-age-config.dto';
import { CreateLevelTestResultDto } from './dto/create-level-test-result.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParentJwtGuard } from '../auth/guards/parent-jwt.guard';
import { ParentPrincipal } from '../auth/strategies/parent-jwt.strategy';

interface ParentRequest {
  user: ParentPrincipal;
}

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
  @UseGuards(JwtAuthGuard)
  @Get('results')
  findAllResults() {
    return this.levelTestsService.findAllResults();
  }

  @UseGuards(JwtAuthGuard)
  @Get('results/:id')
  findOneResult(@Param('id') id: string) {
    return this.levelTestsService.findOneResult(id);
  }

  // 관리자: 문제 은행 (정답 포함이므로 가드 유지)
  @UseGuards(JwtAuthGuard)
  @Get('questions')
  findAllQuestions(@Query('age') age?: string) {
    return this.levelTestsService.findAllQuestions(age !== undefined ? Number(age) : undefined);
  }

  @UseGuards(JwtAuthGuard)
  @Post('questions')
  createQuestion(@Body() dto: CreateLevelTestQuestionDto) {
    return this.levelTestsService.createQuestion(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('questions/:id')
  updateQuestion(@Param('id') id: string, @Body() dto: UpdateLevelTestQuestionDto) {
    return this.levelTestsService.updateQuestion(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('questions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeQuestion(@Param('id') id: string) {
    return this.levelTestsService.removeQuestion(id);
  }

  // 관리자: 나이별 출제 수 설정
  @UseGuards(JwtAuthGuard)
  @Get('config')
  findAllConfigs() {
    return this.levelTestsService.findAllConfigs();
  }

  @UseGuards(JwtAuthGuard)
  @Put('config/:age')
  upsertConfig(@Param('age', ParseIntPipe) age: number, @Body() dto: UpsertLevelTestAgeConfigDto) {
    return this.levelTestsService.upsertConfig(age, dto);
  }
}
