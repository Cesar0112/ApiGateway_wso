import { Permission } from 'src/permissions/entities/permission.entity';
import {
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
@Entity()
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @PrimaryColumn()
  name: string;

  @ManyToMany(() => Permission, { eager: true })
  @JoinTable()
  permissions: Permission[];
}
