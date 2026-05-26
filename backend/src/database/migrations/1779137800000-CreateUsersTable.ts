import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1779137800000 implements MigrationInterface {
  name = 'CreateUsersTable1779137800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "first_name" character varying(100) NOT NULL,
        "last_name" character varying(100) NOT NULL,
        "email" character varying(150) NOT NULL,
        "password" character varying(255) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "role_id" uuid NOT NULL,
        "department_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_users_role"
          FOREIGN KEY ("role_id") REFERENCES "roles"("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_users_department"
          FOREIGN KEY ("department_id") REFERENCES "departments"("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
