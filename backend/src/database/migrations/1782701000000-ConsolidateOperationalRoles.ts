import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConsolidateOperationalRoles1782701000000
  implements MigrationInterface
{
  name = 'ConsolidateOperationalRoles1782701000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "users" u
      SET "role_id" = target.id
      FROM "roles" current_role, "roles" target
      WHERE u.role_id = current_role.id
        AND target.name = CASE
          WHEN current_role.name = 'recepcionista' THEN 'RECEPTIONIST'
          WHEN current_role.name IN ('revisor', 'supervisor', 'SUPERVISOR') THEN 'OFFICER'
          WHEN current_role.name = 'alcalde' THEN 'MAYOR'
        END
        AND current_role.name IN (
          'recepcionista', 'revisor', 'supervisor', 'SUPERVISOR', 'alcalde'
        )
    `);

    await queryRunner.query(`
      UPDATE "roles"
      SET "is_active" = false
      WHERE "name" IN (
        'recepcionista', 'revisor', 'supervisor', 'SUPERVISOR', 'alcalde'
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "roles"
      SET "is_active" = true
      WHERE "name" IN (
        'recepcionista', 'revisor', 'supervisor', 'SUPERVISOR', 'alcalde'
      )
    `);
  }
}
