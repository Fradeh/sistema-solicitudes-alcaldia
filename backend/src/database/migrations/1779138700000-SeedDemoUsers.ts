import { MigrationInterface, QueryRunner } from 'typeorm';
import { hashSync } from 'bcrypt';

export class SeedDemoUsers1779138700000 implements MigrationInterface {
  name = 'SeedDemoUsers1779138700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const passwordHash = hashSync('password-demo', 10);

    await queryRunner.query(`
      INSERT INTO "users" (
        "id",
        "first_name",
        "last_name",
        "email",
        "password",
        "is_active",
        "role_id",
        "department_id"
      )
      SELECT
        '11111111-1111-4111-8111-111111111111',
        'Recepcionista',
        'Demo',
        'recepcionista@demo.local',
        '${passwordHash}',
        true,
        r.id,
        NULL
      FROM "roles" r
      WHERE r.name = 'recepcionista'
      ON CONFLICT ("email") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "users" (
        "id",
        "first_name",
        "last_name",
        "email",
        "password",
        "is_active",
        "role_id",
        "department_id"
      )
      SELECT
        '22222222-2222-4222-8222-222222222222',
        'Supervisor',
        'Demo',
        'supervisor@demo.local',
        '${passwordHash}',
        true,
        r.id,
        NULL
      FROM "roles" r
      WHERE r.name = 'supervisor'
      ON CONFLICT ("email") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "users" (
        "id",
        "first_name",
        "last_name",
        "email",
        "password",
        "is_active",
        "role_id",
        "department_id"
      )
      SELECT
        '33333333-3333-4333-8333-333333333333',
        'Funcionario',
        'Demo',
        'funcionario@demo.local',
        '${passwordHash}',
        true,
        r.id,
        NULL
      FROM "roles" r
      WHERE r.name = 'revisor'
      ON CONFLICT ("email") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "users"
      WHERE "email" IN (
        'recepcionista@demo.local',
        'supervisor@demo.local',
        'funcionario@demo.local'
      )
    `);
  }
}
