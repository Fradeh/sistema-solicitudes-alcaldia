import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConsolidateAdminRole1782703000000 implements MigrationInterface {
  name = 'ConsolidateAdminRole1782703000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "users" u
      SET "role_id" = canonical.id
      FROM "roles" legacy, "roles" canonical
      WHERE u.role_id = legacy.id
        AND legacy.name = 'admin'
        AND canonical.name = 'ADMIN'
    `);

    await queryRunner.query(`
      UPDATE "roles"
      SET "is_active" = false
      WHERE "name" = 'admin'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "roles" SET "is_active" = true WHERE "name" = 'admin'
    `);
  }
}
