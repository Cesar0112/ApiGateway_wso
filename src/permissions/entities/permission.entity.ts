import { Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
@Entity()
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @PrimaryColumn()
  value: string;
}
