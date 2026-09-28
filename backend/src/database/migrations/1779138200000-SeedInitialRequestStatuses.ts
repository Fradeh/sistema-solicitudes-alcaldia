import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedInitialRequestStatuses1779138200000
  implements MigrationInterface
{
  name = 'SeedInitialRequestStatuses1779138200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "request_statuses" ("name", "description")
      VALUES
        ('Pendiente', 'Solicitud recibida y pendiente de revisión.'),
        ('En Proceso', 'Solicitud siendo atendida por el personal municipal.'),
        ('Resuelto', 'Solicitud ha sido resuelta satisfactoriamente.'),
        ('Cerrado', 'Solicitud cerrada sin resolverse o finalizada.')
      ON CONFLICT ("name") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "request_statuses"
      WHERE "name" IN ('Pendiente', 'En Proceso', 'Resuelto', 'Cerrado')
    `);
  }
}
