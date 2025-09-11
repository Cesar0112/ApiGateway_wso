import { Column } from 'typeorm';

// base-entity.ts  (opcional: clase base)
export abstract class BaseTenantEntity {
  @Column({ nullable: false })
  tenantId: string; // uuid o slug de la empresa
}
