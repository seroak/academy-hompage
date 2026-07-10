import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminAccountsService } from './admin-accounts.service.js';
import { CreateAdminDto } from './dto/create-admin.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { AdminPrincipal } from './strategies/jwt.strategy.js';

interface AdminRequest {
  user: AdminPrincipal;
}

@Controller('admins')
@UseGuards(JwtAuthGuard)
export class AdminAccountsController {
  constructor(private readonly adminAccountsService: AdminAccountsService) {}

  @Get()
  findAll() {
    return this.adminAccountsService.findAll();
  }

  @Post()
  async create(@Body() dto: CreateAdminDto) {
    return this.adminAccountsService.create(dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Req() request: AdminRequest) {
    await this.adminAccountsService.remove(id, request.user.adminId);
  }
}
