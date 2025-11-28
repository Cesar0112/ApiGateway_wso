

import {
  PrimaryGeneratedColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryColumn,
} from 'typeorm';
import { Permission } from './permission.entity';
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
