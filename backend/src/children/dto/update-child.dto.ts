import { PartialType } from '@nestjs/mapped-types';
import { CreateChildDto } from './create-child.dto.js';

export class UpdateChildDto extends PartialType(CreateChildDto) {}
