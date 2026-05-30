import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedInitialDepartments1779138300000
  implements MigrationInterface
{
  name = 'SeedInitialDepartments1779138300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "departments" ("name", "description")
      VALUES
        ('Despacho del Alcalde', 'Dirige la administración municipal y ejecuta las políticas locales.'),
        ('Secretaría General', 'Encargada de la documentación oficial, actas y soporte administrativo.'),
        ('Tesorería Municipal', 'Recauda impuestos, maneja el presupuesto, las finanzas y los pagos locales.'),
        ('Obras y Construcciones', 'Gestiona permisos de construcción, planos y mantenimiento de infraestructuras del distrito.'),
        ('Dirección de Tecnología de la Información', 'Administra los sistemas informáticos, soporte técnico e infraestructura tecnológica municipal.')
      ON CONFLICT ("name") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "departments"
      WHERE "name" IN (
        'Despacho del Alcalde',
        'Secretaría General',
        'Tesorería Municipal',
        'Obras y Construcciones',
        'Dirección de Tecnología de la Información'
      )
    `);
  }
}
