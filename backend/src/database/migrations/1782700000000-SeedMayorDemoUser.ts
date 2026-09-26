import { hashSync } from 'bcrypt';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedMayorDemoUser1782700000000 implements MigrationInterface {
  name = 'SeedMayorDemoUser1782700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const passwordHash = hashSync('password-demo', 10);

    await queryRunner.query(`
      INSERT INTO "users" (
        "first_name", "last_name", "email", "password", "is_active",
        "role_id", "department_id"
      )
      SELECT
        'Alcalde', 'Demo', 'alcalde@demo.local', '${passwordHash}', true,
        r.id, d.id
      FROM "roles" r
      LEFT JOIN "departments" d ON d.name = 'Despacho del Alcalde'
      WHERE r.name = 'MAYOR'
      ON CONFLICT ("email") DO NOTHING
    `);

    await queryRunner.query(`
      UPDATE "users" u
      SET "department_id" = d.id
      FROM "departments" d
      WHERE u.email = 'supervisor@demo.local'
        AND u.department_id IS NULL
        AND d.name = 'Obras y Construcciones'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "users" WHERE "email" = 'alcalde@demo.local'`,
    );
    await queryRunner.query(`
      UPDATE "users" SET "department_id" = NULL
      WHERE "email" = 'supervisor@demo.local'
    `);
  }
}
