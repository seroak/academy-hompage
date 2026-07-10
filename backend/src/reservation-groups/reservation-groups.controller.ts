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
import { ReservationGroupsService } from './reservation-groups.service';
import { CreateReservationGroupDto } from './dto/create-reservation-group.dto';
import { UpdateReservationGroupDto } from './dto/update-reservation-group.dto';
import { AddGroupMemberDto } from './dto/add-group-member.dto';
import { ReplaceMemberSlotsDto } from './dto/replace-member-slots.dto';
import { MoveGroupMemberDto } from './dto/move-group-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RESERVATION_ROLES } from '../auth/admin-role';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('reservation-groups')
export class ReservationGroupsController {
  constructor(
    private readonly reservationGroupsService: ReservationGroupsService,
  ) {}

  @Get('confirmed-slots')
  findConfirmedSlots() {
    return this.reservationGroupsService.findConfirmedSlots();
  }

  @Get('joinable')
  findJoinable() {
    return this.reservationGroupsService.findJoinable();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...RESERVATION_ROLES)
  @Get()
  findAll() {
    return this.reservationGroupsService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...RESERVATION_ROLES)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reservationGroupsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...RESERVATION_ROLES)
  @Post()
  create(@Body() dto: CreateReservationGroupDto) {
    return this.reservationGroupsService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...RESERVATION_ROLES)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateReservationGroupDto) {
    return this.reservationGroupsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...RESERVATION_ROLES)
  @Post(':id/members')
  addMember(@Param('id') id: string, @Body() dto: AddGroupMemberDto) {
    return this.reservationGroupsService.addMember(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...RESERVATION_ROLES)
  @Patch(':id/members/:reservationId')
  replaceMemberSlots(
    @Param('id') id: string,
    @Param('reservationId') reservationId: string,
    @Body() dto: ReplaceMemberSlotsDto,
  ) {
    return this.reservationGroupsService.replaceMemberSlots(
      id,
      reservationId,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...RESERVATION_ROLES)
  @Patch(':id/members/:reservationId/move')
  moveMember(
    @Param('id') id: string,
    @Param('reservationId') reservationId: string,
    @Body() dto: MoveGroupMemberDto,
  ) {
    return this.reservationGroupsService.moveMember(id, reservationId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...RESERVATION_ROLES)
  @Delete(':id/members/:reservationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMember(
    @Param('id') id: string,
    @Param('reservationId') reservationId: string,
  ) {
    return this.reservationGroupsService.removeMember(id, reservationId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...RESERVATION_ROLES)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.reservationGroupsService.remove(id);
  }
}
