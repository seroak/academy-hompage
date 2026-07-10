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
import { ParentJwtGuard } from '../auth/guards/parent-jwt.guard';
import { ParentPrincipal } from '../auth/strategies/parent-jwt.strategy';

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
  createWalkIn(@Body() dto: CreateWalkInReservationDto) {
    return this.reservationsService.createWalkIn(dto);
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
