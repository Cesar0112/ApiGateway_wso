import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { In, Repository } from 'typeorm';
import { CreateUsersDto } from '../dto/create-users.dto';
import { UpdateUsersDto } from '../dto/update-users.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '../../roles/entities/role.entity';
import { Structure } from '../../structures/entities/structure.entity';
@Injectable()
export class UsersLocalService {
  constructor(
    @InjectRepository(User)
    private readonly _userRepo: Repository<User>,
    @InjectRepository(Role)
    private readonly _roleRepo: Repository<Role>,
    @InjectRepository(Structure)
    private readonly _structureRepo: Repository<Structure>,
  ) { }

  async findByUsername(
    username: string,
    options?: { relations?: string[] },
  ): Promise<User | null> {
    return this._userRepo.findOne({
      where: { username },
      relations: options?.relations || [],
    });
  }
  async create(dto: CreateUsersDto): Promise<User> {
    const SALT = await bcrypt.genSalt();
    const HASH = await bcrypt.hash(dto.plainCipherPassword, SALT);

    // 2. construye entidad
    const user = this._userRepo.create({
      username: dto.username,
      password: HASH,
      email: dto.email,
      isActive: dto.isActive ?? true,
      roles: dto.rolesNames
        ? await this._roleRepo.findBy({ id: In(dto.rolesNames) })
        : [],
      structures: dto.structureIds
        ? await this._structureRepo.findBy({ id: In(dto.structureIds) })
        : [],
    });

    return this._userRepo.save(user);
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
