import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';

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
}
