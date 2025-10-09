import { PartialType } from '@nestjs/swagger';
import { CreateUsersDto } from './create-users.dto';
import { IsString, MinLength } from 'class-validator';

export class UpdateUsersDto extends PartialType(CreateUsersDto) {
  @IsString()
  @MinLength(3)
  override userName!: string;
}
