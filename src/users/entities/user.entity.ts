import { Role } from '../../roles/entities/role.entity';
import { Structure } from '../../structures/entities/structure.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

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

  @ManyToMany(() => Structure, (structure) => structure.users, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn()
  structures: Structure[];

  @ManyToMany(() => Role, { eager: true })
  @JoinTable()
  roles: Role[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
