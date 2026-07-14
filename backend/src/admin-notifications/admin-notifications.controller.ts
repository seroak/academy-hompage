import { Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminNotificationsService } from './admin-notifications.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('admin-notifications')
@UseGuards(JwtAuthGuard)
export class AdminNotificationsController {
  constructor(private readonly adminNotificationsService: AdminNotificationsService) {}

  @Get()
  findAll() {
    return this.adminNotificationsService.findAll();
  }

  @Get('unread-count')
  unreadCount() {
    return this.adminNotificationsService.unreadCount();
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string) {
    return this.adminNotificationsService.markRead(id);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  markAllRead() {
    return this.adminNotificationsService.markAllRead();
  }
}
