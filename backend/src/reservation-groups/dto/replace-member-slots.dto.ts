import { ArrayNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MemberSlotDto } from './add-group-member.dto';

export class ReplaceMemberSlotsDto {
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => MemberSlotDto)
  slots: MemberSlotDto[];
}
