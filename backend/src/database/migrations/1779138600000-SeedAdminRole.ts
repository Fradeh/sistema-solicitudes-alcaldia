import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedAdminRole1779138600000 implements MigrationInterface {
  name = 'SeedAdminRole1779138600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "roles" ("name", "description")
      VALUES ('admin', 'Gestiona permisos administrativos del sistema.')
      ON CONFLICT ("name") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "roles"
      WHERE "name" = 'admin'
    `);
  }
}

