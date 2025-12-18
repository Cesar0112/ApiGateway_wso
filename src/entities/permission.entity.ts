
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity()
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column({ unique: true })
  value: string;

  @Column({ unique: true, nullable: true })
  displayName?: string;

  @Column({ nullable: true })
  description?: string;

  toString() {
    return this.value;
  }
}
