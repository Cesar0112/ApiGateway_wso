import { Permission } from '../../permissions/entities/permission.entity';

import {
  PrimaryGeneratedColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryColumn,
} from 'typeorm';
@Entity()
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @PrimaryColumn()
  name: string;

  @ManyToMany(() => Permission, { eager: true })
  @JoinTable()
  permissions?: Permission[];
}
