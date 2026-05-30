import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedInitialCategories1779138400000
  implements MigrationInterface
{
  name = 'SeedInitialCategories1779138400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "categories" ("name", "description", "department_id")
      VALUES
        (
          'Solicitudes ciudadanas',
          'Peticiones y solicitudes realizadas por los ciudadanos.',
          (SELECT "id" FROM "departments" WHERE "name" = 'Despacho del Alcalde')
        ),
        (
          'Audiencias públicas',
          'Solicitud de audiencias con el alcalde.',
          (SELECT "id" FROM "departments" WHERE "name" = 'Despacho del Alcalde')
        ),
        (
          'Certificaciones y constancias',
          'Solicitud de certificados y constancias oficiales.',
          (SELECT "id" FROM "departments" WHERE "name" = 'Secretaría General')
        ),
        (
          'Correspondencia oficial',
          'Gestión de correspondencia y documentos oficiales.',
          (SELECT "id" FROM "departments" WHERE "name" = 'Secretaría General')
        ),
        (
          'Pago de impuestos',
          'Consultas y pagos de impuestos municipales.',
          (SELECT "id" FROM "departments" WHERE "name" = 'Tesorería Municipal')
        ),
        (
          'Consulta de deuda',
          'Consulta de deudas y obligaciones fiscales.',
          (SELECT "id" FROM "departments" WHERE "name" = 'Tesorería Municipal')
        ),
        (
          'Solicitud de presupuesto',
          'Solicitudes de presupuesto y cotizaciones.',
          (SELECT "id" FROM "departments" WHERE "name" = 'Tesorería Municipal')
        ),
        (
          'Permiso de construcción',
          'Solicitud de permisos para obras y construcciones.',
          (SELECT "id" FROM "departments" WHERE "name" = 'Obras y Construcciones')
        ),
        (
          'Solicitud de bacheo',
          'Reporte de baches y solicitud de reparación de vías.',
          (SELECT "id" FROM "departments" WHERE "name" = 'Obras y Construcciones')
        ),
        (
          'Inspección de obra',
          'Solicitud de inspección técnica de obras.',
          (SELECT "id" FROM "departments" WHERE "name" = 'Obras y Construcciones')
        ),
        (
          'Soporte técnico',
          'Reporte de problemas técnicos y de infraestructura informática.',
          (SELECT "id" FROM "departments" WHERE "name" = 'Dirección de Tecnología de la Información')
        ),
        (
          'Solicitudes de sistemas',
          'Peticiones de desarrollo o mejora de sistemas informáticos.',
          (SELECT "id" FROM "departments" WHERE "name" = 'Dirección de Tecnología de la Información')
        )
      ON CONFLICT ("name") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "categories"
      WHERE "name" IN (
        'Solicitudes ciudadanas',
        'Audiencias públicas',
        'Certificaciones y constancias',
        'Correspondencia oficial',
        'Pago de impuestos',
        'Consulta de deuda',
        'Solicitud de presupuesto',
        'Permiso de construcción',
        'Solicitud de bacheo',
        'Inspección de obra',
        'Soporte técnico',
        'Solicitudes de sistemas'
      )
    `);
  }
}
