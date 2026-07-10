import { Controller, Get, UseGuards } from '@nestjs/common';
import { MembersService } from './members.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.membersService.findAll();
  }
}
