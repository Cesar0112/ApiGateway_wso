import { Role } from 'src/roles/entities/role.entity';
import { Structure } from 'src/structures/entities/structure.entity';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @PrimaryColumn()
  username: string;

  @Column()
  password: string;

  @ManyToOne(() => Structure, (st) => st.users, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'structureId' })
  structure: Structure | null;

  @Column({ nullable: true })
  structureId: string | null;

  @ManyToMany(() => Role, { eager: true })
  @JoinTable()
  roles: Role[];
}
