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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('reservation-groups')
export class ReservationGroupsController {
  constructor(private readonly reservationGroupsService: ReservationGroupsService) {}

  @Get()
  findAll() {
    return this.reservationGroupsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reservationGroupsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateReservationGroupDto) {
    return this.reservationGroupsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateReservationGroupDto) {
    return this.reservationGroupsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.reservationGroupsService.remove(id);
  }
}
