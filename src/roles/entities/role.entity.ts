import { Permission } from 'src/permissions/entities/permission.entity';

import {
  PrimaryGeneratedColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryColumn,
} from 'typeorm';
export abstract class BaseIdEntity {
  @PrimaryGeneratedColumn('uuid')
  id?: string;
}
@Entity()
export class Role extends BaseIdEntity {
  @PrimaryColumn()
  name: string;

  @ManyToMany(() => Permission, { eager: true })
  @JoinTable()
  permissions?: Permission[];
}
