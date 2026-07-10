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
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { CreateWalkInReservationDto } from './dto/create-walk-in-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { QueryReservationsDto } from './dto/query-reservations.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RESERVATION_ROLES } from '../auth/admin-role';
import { Roles } from '../auth/decorators/roles.decorator';
import { ParentJwtGuard } from '../auth/guards/parent-jwt.guard';
import { ParentPrincipal } from '../auth/strategies/parent-jwt.strategy';

interface ParentRequest {
  user: ParentPrincipal;
}

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...RESERVATION_ROLES)
  @Get()
  findAll(@Query() query: QueryReservationsDto) {
    return this.reservationsService.findAll(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...RESERVATION_ROLES)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reservationsService.findOne(id);
  }

  @UseGuards(ParentJwtGuard)
  @Post()
  create(@Body() dto: CreateReservationDto, @Req() request: ParentRequest) {
    return this.reservationsService.create(dto, request.user.parentUserId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...RESERVATION_ROLES)
  @Post('walk-in')
  createWalkIn(@Body() dto: CreateWalkInReservationDto) {
    return this.reservationsService.createWalkIn(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...RESERVATION_ROLES)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateReservationDto) {
    return this.reservationsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...RESERVATION_ROLES)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.reservationsService.remove(id);
  }
}
