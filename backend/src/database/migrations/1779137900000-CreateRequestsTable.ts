import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRequestsTable1779137900000 implements MigrationInterface {
  name = 'CreateRequestsTable1779137900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "requests_priority_enum"
      AS ENUM ('Low', 'Medium', 'High', 'Urgent')
    `);
    await queryRunner.query(`
      CREATE TABLE "requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "subject" character varying(200) NOT NULL,
        "description" text NOT NULL,
        "applicant_name" character varying(150) NOT NULL,
        "applicant_contact" character varying(150) NOT NULL,
        "category_id" uuid NOT NULL,
        "department_id" uuid NOT NULL,
        "status_id" uuid NOT NULL,
        "priority" "requests_priority_enum" NOT NULL DEFAULT 'Medium',
        "received_by_id" uuid NOT NULL,
        "user_assigned_id" uuid,
        "tracking_code" character varying(30) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_requests_tracking_code" UNIQUE ("tracking_code"),
        CONSTRAINT "PK_requests_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_requests_category"
          FOREIGN KEY ("category_id") REFERENCES "categories"("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_requests_department"
          FOREIGN KEY ("department_id") REFERENCES "departments"("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_requests_status"
          FOREIGN KEY ("status_id") REFERENCES "request_statuses"("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_requests_received_by"
          FOREIGN KEY ("received_by_id") REFERENCES "users"("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_requests_user_assigned"
          FOREIGN KEY ("user_assigned_id") REFERENCES "users"("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "requests"`);
    await queryRunner.query(`DROP TYPE "requests_priority_enum"`);
  }
}
