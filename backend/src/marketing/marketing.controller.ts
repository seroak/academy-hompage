import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CreateMarketingEventDto } from './dto/create-marketing-event.dto.js';
import { QueryMarketingDashboardDto } from './dto/query-marketing-dashboard.dto.js';
import { MarketingService } from './marketing.service.js';
import { MetaSyncService } from './meta-sync.service.js';

@Controller('marketing')
export class MarketingController {
  constructor(
    private readonly marketing: MarketingService,
    private readonly metaSync: MetaSyncService,
  ) {}
  @Post('events')
  @HttpCode(HttpStatus.ACCEPTED)
  collect(@Body() input: CreateMarketingEventDto, @Req() request: Request) {
    return this.marketing.collect(
      input,
      request.ip ?? request.socket.remoteAddress ?? 'unknown',
    );
  }
  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  dashboard(@Query() query: QueryMarketingDashboardDto) {
    return this.marketing.dashboard(query);
  }
  @Post('meta/sync')
  @UseGuards(JwtAuthGuard)
  sync() {
    return this.metaSync.sync();
  }
  @Get('meta/status')
  @UseGuards(JwtAuthGuard)
  status() {
    return this.metaSync.status();
  }
}
