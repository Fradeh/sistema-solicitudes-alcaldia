import { hashSync } from 'bcrypt';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedDemoPresentationData1782601000000 implements MigrationInterface {
  name = 'SeedDemoPresentationData1782601000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const passwordHash = hashSync('password-demo', 10);

    await queryRunner.query(`
      INSERT INTO "request_statuses" ("name", "description") VALUES
        ('rejected_by_department', 'Rechazada por el departamento'),
        ('returned_to_department', 'Devuelta al departamento'),
        ('rejected_by_mayor_office', 'Rechazada por Alcaldia'),
        ('closed', 'Solicitud cerrada')
      ON CONFLICT ("name") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "users" (
        "id", "first_name", "last_name", "email", "password",
        "is_active", "role_id", "department_id"
      )
      SELECT
        '44444444-4444-4444-8444-444444444444', 'Administrador', 'Demo',
        'admin@demo.local', '${passwordHash}', true, r.id, NULL
      FROM "roles" r
      WHERE LOWER(r.name) = 'admin'
      ORDER BY r.created_at ASC
      LIMIT 1
      ON CONFLICT ("email") DO NOTHING
    `);

    await queryRunner.query(`
      UPDATE "users"
      SET "department_id" = (
        SELECT "id" FROM "departments" WHERE "name" = 'Obras y Construcciones'
      )
      WHERE "email" = 'funcionario@demo.local'
    `);

    await queryRunner.query(`
      INSERT INTO "requests" (
        "id", "subject", "description", "applicant_name", "applicant_contact",
        "category_id", "department_id", "status_id", "priority", "received_by_id",
        "user_assigned_id", "tracking_code", "request_date", "deadline", "is_active"
      )
      SELECT
        demo.id::uuid, demo.subject, demo.description, demo.applicant_name,
        demo.applicant_contact, c.id, d.id, s.id, demo.priority::requests_priority_enum,
        receiver.id, CASE WHEN demo.assign_officer THEN officer.id ELSE NULL END,
        demo.tracking_code, demo.request_date::date, demo.deadline::date, true
      FROM (VALUES
        ('a1111111-1111-4111-8111-111111111111', 'Reparacion de via en calle central', 'Solicitud ciudadana para reparar baches que dificultan el acceso al sector.', 'Ana Martinez', '6000-1001', 'Solicitud de bacheo', 'Obras y Construcciones', 'in_review', 'Urgente', 'SA-2026-001', CURRENT_DATE - 3, CURRENT_DATE + 2, true),
        ('a2222222-2222-4222-8222-222222222222', 'Permiso para mejora de vivienda', 'Revision documental completada por el departamento responsable.', 'Luis Rodriguez', '6000-1002', 'Permiso de construcción', 'Obras y Construcciones', 'approved_by_officer', 'Alta', 'SA-2026-002', CURRENT_DATE - 5, CURRENT_DATE + 4, true),
        ('a3333333-3333-4333-8333-333333333333', 'Apoyo comunitario para centro vecinal', 'Solicitud lista para revision y firma del despacho del alcalde.', 'Maria Gonzalez', '6000-1003', 'Solicitudes ciudadanas', 'Despacho del Alcalde', 'awaiting_mayor_signature', 'Media', 'SA-2026-003', CURRENT_DATE - 7, CURRENT_DATE + 1, false),
        ('a4444444-4444-4444-8444-444444444444', 'Certificacion municipal', 'Certificacion revisada, firmada y disponible para entrega.', 'Carlos Perez', '6000-1004', 'Certificaciones y constancias', 'Secretaría General', 'signed', 'Baja', 'SA-2026-004', CURRENT_DATE - 10, CURRENT_DATE - 1, false),
        ('a5555555-5555-4555-8555-555555555555', 'Consulta de estado de cuenta municipal', 'Consulta recibida y pendiente de asignacion operativa.', 'Elena Castillo', '6000-1005', 'Consulta de deuda', 'Tesorería Municipal', 'received', 'Media', 'SA-2026-005', CURRENT_DATE, CURRENT_DATE + 7, false)
      ) AS demo(id, subject, description, applicant_name, applicant_contact, category_name, department_name, status_name, priority, tracking_code, request_date, deadline, assign_officer)
      JOIN "categories" c ON c.name = demo.category_name
      JOIN "departments" d ON d.name = demo.department_name
      JOIN "request_statuses" s ON s.name = demo.status_name
      JOIN "users" receiver ON receiver.email = 'recepcionista@demo.local'
      LEFT JOIN "users" officer ON officer.email = 'funcionario@demo.local'
      ON CONFLICT ("tracking_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "request_history" (
        "event_type", "request_id", "user_id", "observation"
      )
      SELECT 'REQUEST_CREATED', r.id, u.id, 'Dato persistente preparado para la demostracion'
      FROM "requests" r
      JOIN "users" u ON u.email = 'recepcionista@demo.local'
      WHERE r.tracking_code LIKE 'SA-2026-00%'
        AND NOT EXISTS (
          SELECT 1 FROM "request_history" h
          WHERE h.request_id = r.id AND h.event_type = 'REQUEST_CREATED'
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "request_history" WHERE "request_id" IN (SELECT "id" FROM "requests" WHERE "tracking_code" LIKE 'SA-2026-00%')`);
    await queryRunner.query(`DELETE FROM "requests" WHERE "tracking_code" LIKE 'SA-2026-00%'`);
    await queryRunner.query(`DELETE FROM "users" WHERE "email" = 'admin@demo.local'`);
    await queryRunner.query(`UPDATE "users" SET "department_id" = NULL WHERE "email" = 'funcionario@demo.local'`);
    await queryRunner.query(`DELETE FROM "request_statuses" WHERE "name" IN ('rejected_by_department', 'returned_to_department', 'rejected_by_mayor_office', 'closed')`);
  }
}
