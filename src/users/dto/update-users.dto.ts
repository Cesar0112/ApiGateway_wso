import { PartialType } from '@nestjs/swagger';
import { CreateUsersDto } from './create-users.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateUsersDto extends PartialType(CreateUsersDto) {}
