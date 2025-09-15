import { Role } from 'src/roles/entities/role.entity';
import { Structure } from 'src/structures/entities/structure.entity';
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
