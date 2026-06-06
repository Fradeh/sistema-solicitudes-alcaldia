import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedBaseRoles1779138700000 implements MigrationInterface {
  name = 'SeedBaseRoles1779138700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "roles" ("name", "description")
      VALUES
        ('ADMIN', 'Administrador del sistema'),
        ('RECEPTIONIST', 'Recibe y registra solicitudes ciudadanas'),
        ('OFFICER', 'Funcionario asignado para tramitar solicitudes'),
        ('SUPERVISOR', 'Supervisa y asigna solicitudes'),
        ('MAYOR', 'Alcalde, firma documentos en una fase posterior')
      ON CONFLICT ("name") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "roles"
      WHERE "name" IN ('ADMIN', 'RECEPTIONIST', 'OFFICER', 'SUPERVISOR', 'MAYOR')
    `);
  }
}
