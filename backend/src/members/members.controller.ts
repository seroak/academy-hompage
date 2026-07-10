import { Controller, Get, UseGuards } from '@nestjs/common';
import { MembersService } from './members.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RESERVATION_ROLES } from '../auth/admin-role';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...RESERVATION_ROLES)
  @Get()
  findAll() {
    return this.membersService.findAll();
  }
}
