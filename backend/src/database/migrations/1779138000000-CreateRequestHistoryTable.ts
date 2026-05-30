import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRequestHistoryTable1779138000000
  implements MigrationInterface
{
  name = 'CreateRequestHistoryTable1779138000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "request_history" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "request_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "previous_status_id" uuid,
        "new_status_id" uuid,
        "previous_assigned_user_id" uuid,
        "new_assigned_user_id" uuid,
        "observation" text,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_request_history_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_request_history_request"
          FOREIGN KEY ("request_id") REFERENCES "requests"("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_request_history_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_request_history_previous_status"
          FOREIGN KEY ("previous_status_id") REFERENCES "request_statuses"("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_request_history_new_status"
          FOREIGN KEY ("new_status_id") REFERENCES "request_statuses"("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_request_history_previous_assigned_user"
          FOREIGN KEY ("previous_assigned_user_id") REFERENCES "users"("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_request_history_new_assigned_user"
          FOREIGN KEY ("new_assigned_user_id") REFERENCES "users"("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "request_history"`);
  }
}
