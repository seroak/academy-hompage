import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CreateLeadDto } from './dto/create-lead.dto.js';
import { QueryLeadSummaryDto, QueryLeadsDto } from './dto/query-leads.dto.js';
import { UpdateLeadDto } from './dto/update-lead.dto.js';
import { LeadsService } from './leads.service.js';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  submit(@Body() input: CreateLeadDto, @Req() request: Request) {
    return this.leadsService.submit(
      input,
      request.ip ?? request.socket.remoteAddress ?? 'unknown',
      request.headers['user-agent'],
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query() query: QueryLeadsDto) {
    return this.leadsService.findAll(query);
  }

  @Get('summary')
  @UseGuards(JwtAuthGuard)
  summary(@Query() query: QueryLeadSummaryDto) {
    return this.leadsService.summary(query);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() input: UpdateLeadDto) {
    return this.leadsService.update(id, input);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.leadsService.remove(id);
  }
}
