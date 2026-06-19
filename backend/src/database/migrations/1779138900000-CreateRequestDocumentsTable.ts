import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRequestDocumentsTable1779138900000
  implements MigrationInterface
{
  name = 'CreateRequestDocumentsTable1779138900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "request_documents" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "file_name" character varying(255) NOT NULL,
        "file_type" character varying(100) NOT NULL,
        "size" integer NOT NULL,
        "url" text NOT NULL,
        "request_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_request_documents_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_request_documents_request"
          FOREIGN KEY ("request_id") REFERENCES "requests"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_request_documents_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_request_documents_request_id"
      ON "request_documents" ("request_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_request_documents_user_id"
      ON "request_documents" ("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_request_documents_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_request_documents_request_id"`);
    await queryRunner.query(`DROP TABLE "request_documents"`);
  }
}
