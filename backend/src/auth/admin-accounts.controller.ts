import { Body, Controller, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AdminRole } from './admin-role';
import { AdminAccountsService } from './admin-accounts.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { Roles } from './decorators/roles.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Controller('admins')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.SUPER_ADMIN)
export class AdminAccountsController {
  constructor(private readonly adminAccountsService: AdminAccountsService) {}

  @Post()
  async create(@Body() dto: CreateAdminDto) {
    return this.adminAccountsService.create(dto);
  }
}
