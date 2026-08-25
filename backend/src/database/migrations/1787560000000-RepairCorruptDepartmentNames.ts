import { MigrationInterface, QueryRunner } from 'typeorm';

export class RepairCorruptDepartmentNames1787560000000
  implements MigrationInterface
{
  name = 'RepairCorruptDepartmentNames1787560000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const groups: Array<{ canonical: string; corrupt: string[] }> = [
      {
        canonical: 'Secretaría General',
        corrupt: ['Secretar\\00EDa General', 'Secretar??a General'],
      },
      {
        canonical: 'Tesorería Municipal',
        corrupt: ['Tesorer\\00EDa Municipal', 'Tesorer??a Municipal'],
      },
      {
        canonical: 'Dirección de Tecnología de la Información',
        corrupt: [
          'Direcci\\00F3n de Tecnolog\\00EDa de la Informaci\\00F3n',
          'Direcci??n de Tecnolog??a de la Informaci??n',
        ],
      },
    ];

    for (const group of groups) {
      const canonicalRows: Array<{ id: string }> = await queryRunner.query(
        `SELECT "id" FROM "departments" WHERE "name" = $1 LIMIT 1`,
        [group.canonical],
      );
      if (!canonicalRows[0]) continue;

      const duplicateRows: Array<{ id: string }> = await queryRunner.query(
        `SELECT "id" FROM "departments" WHERE "name" = ANY($1::text[])`,
        [group.corrupt],
      );
      for (const duplicate of duplicateRows) {
        for (const table of ['users', 'categories', 'requests']) {
          await queryRunner.query(
            `UPDATE "${table}" SET "department_id" = $1 WHERE "department_id" = $2`,
            [canonicalRows[0].id, duplicate.id],
          );
        }
        await queryRunner.query(
          `DELETE FROM "departments" WHERE "id" = $1`,
          [duplicate.id],
        );
      }
    }
  }

  public async down(): Promise<void> {
    // No se recrean registros corruptos ni duplicados deliberadamente.
  }
}
