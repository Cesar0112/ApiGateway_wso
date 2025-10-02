import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
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
  @Column({ nullable: true })
  displayName: string; // ← cache del path que viene de WSO2

  // usuarios que pertenecen a esta estructura
  @ManyToMany(() => User, (user) => user.structures, { eager: true })
  @JoinTable()
  users: User[];
}
