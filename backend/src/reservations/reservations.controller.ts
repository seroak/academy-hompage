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
import { ReservationsService } from './reservations.service.js';
import { CreateReservationDto } from './dto/create-reservation.dto.js';
import { CreateWalkInReservationDto } from './dto/create-walk-in-reservation.dto.js';
import { UpdateReservationDto } from './dto/update-reservation.dto.js';
import { QueryReservationsDto } from './dto/query-reservations.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ParentJwtGuard } from '../auth/guards/parent-jwt.guard.js';
import { ParentPrincipal } from '../auth/strategies/parent-jwt.strategy.js';

interface ParentRequest {
  user: ParentPrincipal;
}

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() query: QueryReservationsDto) {
    return this.reservationsService.findAll(query);
  }

  @UseGuards(ParentJwtGuard)
  @Get('mine')
  findMine(@Req() request: ParentRequest) {
    return this.reservationsService.findMine(request.user.parentUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reservationsService.findOne(id);
  }

  @UseGuards(ParentJwtGuard)
  @Post()
  create(@Body() dto: CreateReservationDto, @Req() request: ParentRequest) {
    return this.reservationsService.create(dto, request.user.parentUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('walk-in')
  createWalkInReservation(@Body() dto: CreateWalkInReservationDto) {
    return this.reservationsService.createWalkInReservation(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateReservationDto) {
    return this.reservationsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.reservationsService.remove(id);
  }
}
