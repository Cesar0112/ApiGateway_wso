
import { Role } from './role.entity';
import { Structure } from './structure.entity';
import {
  Column,
  CreateDateColumn,
  Entity, JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userName: string;

  @Column()
  password: string;

  @Column({ nullable: true, default: null })
  email?: string; //TODO Agregar que sea un arreglo de string indicando que el primero es el primario

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToMany(() => Structure, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  structures: Structure[];

  @ManyToMany(() => Role, { eager: true })
  @JoinTable()
  roles: Role[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
