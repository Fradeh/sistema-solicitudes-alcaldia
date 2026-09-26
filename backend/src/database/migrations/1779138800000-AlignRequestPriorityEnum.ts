import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignRequestPriorityEnum1779138800000
  implements MigrationInterface
{
  name = 'AlignRequestPriorityEnum1779138800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "requests_priority_enum" RENAME VALUE 'Low' TO 'Baja'
    `);
    await queryRunner.query(`
      ALTER TYPE "requests_priority_enum" RENAME VALUE 'Medium' TO 'Media'
    `);
    await queryRunner.query(`
      ALTER TYPE "requests_priority_enum" RENAME VALUE 'High' TO 'Alta'
    `);
    await queryRunner.query(`
      ALTER TYPE "requests_priority_enum" RENAME VALUE 'Urgent' TO 'Urgente'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "requests_priority_enum" RENAME VALUE 'Baja' TO 'Low'
    `);
    await queryRunner.query(`
      ALTER TYPE "requests_priority_enum" RENAME VALUE 'Media' TO 'Medium'
    `);
    await queryRunner.query(`
      ALTER TYPE "requests_priority_enum" RENAME VALUE 'Alta' TO 'High'
    `);
    await queryRunner.query(`
      ALTER TYPE "requests_priority_enum" RENAME VALUE 'Urgente' TO 'Urgent'
    `);
  }
}
