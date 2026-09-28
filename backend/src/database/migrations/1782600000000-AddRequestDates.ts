import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRequestDates1782600000000 implements MigrationInterface {
  name = 'AddRequestDates1782600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "requests"
      ADD COLUMN "request_date" date NOT NULL DEFAULT CURRENT_DATE,
      ADD COLUMN "deadline" date NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "requests"
      DROP COLUMN "deadline",
      DROP COLUMN "request_date"
    `);
  }
}
