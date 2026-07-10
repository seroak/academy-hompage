import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class CreateChildDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(4)
  @Max(10)
  age: number;
}
