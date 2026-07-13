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
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ClassSchedulesService } from './class-schedules.service.js';
import { CreateClassScheduleDto } from './dto/create-class-schedule.dto.js';
import { UpdateClassScheduleDto } from './dto/update-class-schedule.dto.js';

@Controller('class-schedules')
export class ClassSchedulesController {
  constructor(private readonly service: ClassSchedulesService) {}

  @Get('published')
  findPublished() {
    return this.service.findPublished();
  }

  @Get('published/:year/:quarter')
  findPublishedOne(
    @Param('year', ParseIntPipe) year: number,
    @Param('quarter', ParseIntPipe) quarter: number,
  ) {
    return this.service.findPublishedOne(year, quarter);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateClassScheduleDto) {
    return this.service.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClassScheduleDto) {
    return this.service.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/publish')
  publish(@Param('id') id: string) {
    return this.service.publish(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
