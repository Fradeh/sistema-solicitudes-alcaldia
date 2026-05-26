import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnableUuidExtension1779137000000 implements MigrationInterface {
  name = 'EnableUuidExtension1779137000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // The extension may be shared by tables outside this migration chain.
  }
}
