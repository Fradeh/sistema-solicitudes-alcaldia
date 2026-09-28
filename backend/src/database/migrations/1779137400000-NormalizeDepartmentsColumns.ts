import { MigrationInterface, QueryRunner } from 'typeorm';

export class NormalizeDepartmentsColumns1779137400000
  implements MigrationInterface
{
  name = 'NormalizeDepartmentsColumns1779137400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "departments" RENAME COLUMN "isActive" TO "is_active"`,
    );
    await queryRunner.query(
      `ALTER TABLE "departments" RENAME COLUMN "createdAt" TO "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "departments" RENAME COLUMN "updatedAt" TO "updated_at"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "departments" RENAME COLUMN "updated_at" TO "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "departments" RENAME COLUMN "created_at" TO "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "departments" RENAME COLUMN "is_active" TO "isActive"`,
    );
  }
}
