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
  UseGuards,
} from '@nestjs/common';
import { ReservationGroupQueryService } from './reservation-group-query.service.js';
import { ReservationGroupLifecycleService } from './reservation-group-lifecycle.service.js';
import { ReservationGroupMembershipService } from './reservation-group-membership.service.js';
import { CreateReservationGroupDto } from './dto/create-reservation-group.dto.js';
import { UpdateReservationGroupDto } from './dto/update-reservation-group.dto.js';
import { AddGroupMemberDto } from './dto/add-group-member.dto.js';
import { ReplaceMemberSlotsDto } from './dto/replace-member-slots.dto.js';
import { MoveGroupMemberDto } from './dto/move-group-member.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('reservation-groups')
export class ReservationGroupsController {
  constructor(
    private readonly queryService: ReservationGroupQueryService,
    private readonly lifecycleService: ReservationGroupLifecycleService,
    private readonly membershipService: ReservationGroupMembershipService,
  ) {}

  @Get('confirmed-slots')
  findConfirmedSlots() {
    return this.queryService.findConfirmedSlots();
  }

  @Get('joinable')
  findJoinable() {
    return this.queryService.findJoinable();
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.queryService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.queryService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateReservationGroupDto) {
    return this.lifecycleService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateReservationGroupDto) {
    return this.lifecycleService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/members')
  addMember(@Param('id') id: string, @Body() dto: AddGroupMemberDto) {
    return this.membershipService.addMember(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/members/:reservationId')
  replaceMemberSlots(
    @Param('id') id: string,
    @Param('reservationId') reservationId: string,
    @Body() dto: ReplaceMemberSlotsDto,
  ) {
    return this.membershipService.replaceMemberSlots(id, reservationId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/members/:reservationId/move')
  moveMember(
    @Param('id') id: string,
    @Param('reservationId') reservationId: string,
    @Body() dto: MoveGroupMemberDto,
  ) {
    return this.membershipService.moveMember(id, reservationId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/members/:reservationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMember(
    @Param('id') id: string,
    @Param('reservationId') reservationId: string,
  ) {
    return this.membershipService.removeMember(id, reservationId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.lifecycleService.remove(id);
  }
}
