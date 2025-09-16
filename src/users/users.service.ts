import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUsersDto } from './dto/create-users.dto';
import { UpdateUsersDto } from './dto/update-users.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly _userRepo: Repository<User>,
  ) {}

  async findByUsername(
    username: string,
    options?: { relations?: string[] },
  ): Promise<User | null> {
    return this._userRepo.findOne({
      where: { username },
      relations: options?.relations || [],
    });
  }
  create(createUsersDto: CreateUsersDto) {
    return 'This action adds a new users2';
  }

  findAll() {
    return `This action returns all users2`;
  }

  findOne(id: number) {
    return `This action returns a #${id} users2`;
  }

  update(id: number, updateUsersDto: UpdateUsersDto) {
    return `This action updates a #${id} users2`;
  }

  remove(id: number) {
    return `This action removes a #${id} users2`;
  }
}
