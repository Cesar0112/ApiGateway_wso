import { BaseIdEntity } from '../../roles/entities/role.entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity()
export class Permission extends BaseIdEntity {
  @Column({ unique: true })
  value: string;

  @Column({ unique: true, nullable: true })
  displayName?: string;

  @Column({ nullable: true })
  description?: string;
}
