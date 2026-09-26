import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignDemoUserDepartments1782702000000
  implements MigrationInterface
{
  name = 'AlignDemoUserDepartments1782702000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "users" u
      SET "department_id" = d.id
      FROM "departments" d
      WHERE u.email = 'recepcionista@demo.local'
        AND d.name = 'Secretaría General'
    `);

    await queryRunner.query(`
      UPDATE "users"
      SET "is_active" = false, "department_id" = NULL
      WHERE "email" = 'supervisor@demo.local'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "users"
      SET "department_id" = NULL
      WHERE "email" = 'recepcionista@demo.local'
    `);
    await queryRunner.query(`
      UPDATE "users"
      SET "is_active" = true
      WHERE "email" = 'supervisor@demo.local'
    `);
  }
}
