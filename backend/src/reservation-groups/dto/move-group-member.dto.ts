import {
  ArrayNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MemberSlotDto } from './add-group-member.dto';

export class MoveGroupMemberDto {
  @IsString()
  targetGroupId: string;

  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => MemberSlotDto)
  slots: MemberSlotDto[];
}
