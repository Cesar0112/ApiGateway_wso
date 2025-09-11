import { User } from 'src/users/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Structure {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  // padre (opcional) -> recursividad
  @ManyToOne(() => Structure, (parent) => parent.children, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parentId' })
  parent: Structure | null;

  @Column({ nullable: true })
  parentId: string | null;

  // hijos
  @OneToMany(() => Structure, (child) => child.parent, { cascade: true })
  children: Structure[];

  // usuarios que pertenecen a esta estructura (inversa)
  @OneToMany(() => User, (user) => user.structure)
  users: User[];
}
