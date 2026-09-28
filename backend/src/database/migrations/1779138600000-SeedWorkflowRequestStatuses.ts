import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedWorkflowRequestStatuses1779138600000
  implements MigrationInterface
{
  name = 'SeedWorkflowRequestStatuses1779138600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "request_statuses" ("name", "description")
      VALUES
        ('received', 'Solicitud registrada, pendiente de revisión'),
        ('in_review', 'Solicitud asignada a un funcionario'),
        ('approved_by_officer', 'Aprobada por el funcionario responsable'),
        ('awaiting_mayor_signature', 'Pendiente de firma del Alcalde'),
        ('signed', 'Firmada y completada')
      ON CONFLICT ("name") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "request_statuses"
      WHERE "name" IN ('received', 'in_review', 'approved_by_officer', 'awaiting_mayor_signature', 'signed')
    `);
  }
}
