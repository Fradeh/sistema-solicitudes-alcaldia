import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateHistorialesTable1779137383875 implements MigrationInterface {
    name = 'CreateHistorialesTable1779137383875'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "request_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "request_id" uuid NOT NULL, "user_id" uuid NOT NULL, "previous_status_id" uuid, "new_status_id" uuid NOT NULL, "observation" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_225faa48c0dca41172e29f4cb9c" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "request_history"`);
    }

}
