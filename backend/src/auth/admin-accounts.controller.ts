import { Body, Controller, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AdminAccountsService } from './admin-accounts.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('admins')
@UseGuards(JwtAuthGuard)
export class AdminAccountsController {
  constructor(private readonly adminAccountsService: AdminAccountsService) {}

  @Post()
  async create(@Body() dto: CreateAdminDto) {
    return this.adminAccountsService.create(dto);
  }
}
