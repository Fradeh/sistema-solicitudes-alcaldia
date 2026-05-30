import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventTypeToRequestHistory1779138500000
  implements MigrationInterface
{
  name = 'AddEventTypeToRequestHistory1779138500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "request_history"
      ADD COLUMN "event_type" varchar(50) NOT NULL DEFAULT 'STATUS_CHANGED'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "request_history"
      DROP COLUMN "event_type"
    `);
  }
}
