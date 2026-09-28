import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRequestStatusesTable1779137600000
  implements MigrationInterface
{
  name = 'CreateRequestStatusesTable1779137600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "request_statuses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(50) NOT NULL,
        "description" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_request_statuses_name" UNIQUE ("name"),
        CONSTRAINT "PK_request_statuses_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "request_statuses"`);
  }
}
