import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ParentJwtGuard } from '../auth/guards/parent-jwt.guard.js';
import { ParentPrincipal } from '../auth/strategies/parent-jwt.strategy.js';
import { ChildrenService } from './children.service.js';
import { CreateChildDto } from './dto/create-child.dto.js';
import { UpdateChildDto } from './dto/update-child.dto.js';

interface ParentRequest { user: ParentPrincipal }

@Controller('children')
@UseGuards(ParentJwtGuard)
export class ChildrenController {
  constructor(private readonly childrenService: ChildrenService) {}

  @Get()
  findAll(@Req() request: ParentRequest) {
    return this.childrenService.findAll(request.user.parentUserId);
  }

  @Post()
  create(@Body() dto: CreateChildDto, @Req() request: ParentRequest) {
    return this.childrenService.create(dto, request.user.parentUserId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateChildDto, @Req() request: ParentRequest) {
    return this.childrenService.update(id, dto, request.user.parentUserId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Req() request: ParentRequest) {
    return this.childrenService.remove(id, request.user.parentUserId);
  }
}
