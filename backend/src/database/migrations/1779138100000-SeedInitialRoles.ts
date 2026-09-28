import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedInitialRoles1779138100000 implements MigrationInterface {
  name = 'SeedInitialRoles1779138100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "roles" ("name", "description")
      VALUES
        ('recepcionista', 'Recibe y registra solicitudes ciudadanas.'),
        ('revisor', 'Verifica la informacion de las solicitudes.'),
        ('supervisor', 'Supervisa el avance y asignacion de solicitudes.'),
        ('alcalde', 'Aprueba y firma solicitudes autorizadas.')
      ON CONFLICT ("name") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "roles"
      WHERE "name" IN ('recepcionista', 'revisor', 'supervisor', 'alcalde')
    `);
  }
}
