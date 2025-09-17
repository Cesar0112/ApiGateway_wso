import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from 'src/permissions/entities/permission.entity';
import { In, Repository } from 'typeorm';
@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role) private _roleRepo: Repository<Role>,
    @InjectRepository(Permission) private _permRepo: Repository<Permission>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    // 1. name único
    const EXISTS = await this._roleRepo.exists({
      where: { name: createRoleDto.name },
    });
    if (EXISTS)
      throw new ConflictException(`Role ${createRoleDto.name} already exists`);

    // 2. carga permisos
    const PERMS = createRoleDto.permissionIds?.length
      ? await this._permRepo.findBy({ id: In(createRoleDto.permissionIds) })
      : [];

    // 3. crea y guarda
    const role = this._roleRepo.create({
      name: createRoleDto.name,
      permissions: PERMS,
    });
    return this._roleRepo.save(role);
  }

  findAll(): Promise<Role[]> {
    return this._roleRepo.find({ relations: ['permissions'] });
  }

  async findOne(id: string): Promise<Role> {
    const role = await this._roleRepo.findOne({
      where: { id },
      relations: ['permissions'],
    });
    if (!role) throw new NotFoundException(`Role ${id} not found`);
    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);
    if (updateRoleDto.name) role.name = updateRoleDto.name;

    if (updateRoleDto.permissionIds) {
      role.permissions = await this._permRepo.findBy({
        id: In(updateRoleDto.permissionIds),
      });
    }
    return this._roleRepo.save(role);
  }

  async remove(id: string): Promise<void> {
    const role = await this.findOne(id);
    await this._roleRepo.remove(role);
  }
}
