# V3-2.1 — Diagnóstico técnico del esquema actual y evaluación de compatibilidad para futuras migraciones

| Campo | Valor |
| --- | --- |
| **Revisor** | @Fradeh |
| **Tipo** | Analisis tecnico |
| **Dependencias** | Subissue 1.1 — Analizar las diferencias entre el flujo actual y el nuevo alcance. |
| **Fuentes** | ``, ``, `` |

---

## Propósito

Analizar el estado actual del esquema PostgreSQL (entidades TypeORM + migraciones ejecutables) y la base MongoDB asociada, identificando inconsistencias, riesgos y restricciones antes de diseñar nuevas migraciones o modificar el modelo de datos.

---

## Fuera de alcance

- Crear nuevas migraciones.
- Modificar migraciones existentes.
- Modificar entidades TypeORM.
- Crear tablas o colecciones nuevas.
- Implementar normalización.
- Ejecutar cambios en ningún entorno.
- Corregir producción.

---

## Criterios de aceptación

- [x] Se revisaron todas las tablas relacionadas con el flujo de solicitudes.
- [x] Se compararon entidades TypeORM con tablas existentes en migraciones.
- [x] Se analizaron migraciones relevantes (orden, nombres, timestamps).
- [x] Se identificaron migraciones conflictivas (timestamps duplicados).
- [x] Se identificaron roles inconsistentes (nomenclatura duplicada).
- [x] Se identificaron estados incompatibles (dos vocabularios distintos).
- [x] Se documentaron diferencias en prioridades (enum TypeORM vs enum DB).
- [x] Se documentaron problemas de relaciones o nulabilidad.
- [x] Cada inconsistencia incluye impacto técnico.
- [x] Cada inconsistencia incluye recomendación.
- [x] Se identificó qué migraciones pudieron ejecutarse previamente en otros entornos.

---

## Principios del análisis

1. **Synchronize desactivado** (`synchronize: false`) — el esquema se gobierna exclusivamente por migraciones.
2. **Dos motores de base de datos**: PostgreSQL (TypeORM) para datos transaccionales
3. **Las migraciones se ejecutan por orden de timestamp** (no por nombre).
4. **Cada migración es irreversible en producción** a menos que tenga `down()`.

---

## Estructura actual del esquema PostgreSQL

### Tablas y su propósito

| Tabla | Migración de creación | Propósito |
|---|---|---|
| `departments` | `1779137321952-CreateDepartmentsTable` | Departamentos municipales |
| `roles` | `1779137500000-CreateRolesTable` | Roles del sistema |
| `request_statuses` | `1779137600000-CreateRequestStatusesTable` | Catálogo de estados de solicitud |
| `categories` | `1779137700000-CreateCategoriesTable` | Categorías de solicitud (por departamento) |
| `users` | `1779137800000-CreateUsersTable` | Usuarios del sistema |
| `requests` | `1779137900000-CreateRequestsTable` | Solicitudes ciudadanas |
| `request_history` | `1779138000000-CreateRequestHistoryTable` | Historial de cambios de solicitudes |

### Relaciones entre tablas

```
departments ──< categories
departments ──< users
roles ────────< users
categories ──< requests (category_id)
departments ──< requests (department_id)
request_statuses ─< requests (status_id)
users ───────────< requests (received_by_id)
users ───────────< requests (user_assigned_id)
requests ────────< request_history (request_id)
users ───────────< request_history (user_id)
request_statuses ─< request_history (previous_status_id)
request_statuses ─< request_history (new_status_id)
users ───────────< request_history (previous_assigned_user_id)
users ───────────< request_history (new_assigned_user_id)
```

Todas las claves foráneas usan `ON DELETE NO ACTION ON UPDATE NO ACTION`.

---

## Orden de ejecución de migraciones

| # | Timestamp | Nombre | Tipo |
|---|---|---|---|
| 1 | `1779137000000` | EnableUuidExtension | DDL |
| 2 | `1779137321952` | CreateDepartmentsTable | DDL (con columnas camelCase) |
| 3 | `1779137400000` | NormalizeDepartmentsColumns | DDL (rename a snake_case) |
| 4 | `1779137500000` | CreateRolesTable | DDL |
| 5 | `1779137600000` | CreateRequestStatusesTable | DDL |
| 6 | `1779137700000` | CreateCategoriesTable | DDL |
| 7 | `1779137800000` | CreateUsersTable | DDL |
| 8 | `1779137900000` | CreateRequestsTable | DDL |
| 9 | `1779138000000` | CreateRequestHistoryTable | DDL |
| 10 | `1779138100000` | SeedInitialRoles | Seed (roles español) |
| 11 | `1779138200000` | SeedInitialRequestStatuses | Seed (estados español) |
| 12 | `1779138300000` | SeedInitialDepartments | Seed |
| 13 | `1779138400000` | SeedInitialCategories | Seed |
| 14 | `1779138500000` | AddEventTypeToRequestHistory | DDL (alter table) |
| 15 | `1779138600000` | **SeedAdminRole** | Seed (rol admin) |
| 16 | `1779138600000` | **SeedWorkflowRequestStatuses** | Seed (estados inglés) |
| 17 | `1779138700000` | **SeedBaseRoles** | Seed (roles inglés) |
| 18 | `1779138700000` | **SeedDemoUsers** | Seed (usuarios demo) |

---

## Hallazgos documentados

### H01 — Timestamps duplicados

**Descripción**: Los pares `1779138600000` (SeedAdminRole + SeedWorkflowRequestStatuses) y `1779138700000` (SeedBaseRoles + SeedDemoUsers) comparten el mismo timestamp. TypeORM ordena por timestamp y luego por nombre, por lo que el orden entre ellas es determinista por nombre alfabético, pero la intención del desarrollador no es evidente.

**Impacto**: Si en otro entorno se ejecutan las migraciones una por una, el orden podría variar si el mecanismo de ordenación cambia. Además, dificulta leer la secuencia lógica.

**Recomendación**: Asignar timestamps exclusivos a cada migración incrementando en 1 el último dígito (ej. `1779138600001`, `1779138700001`).

---

### H02 — Roles duplicados con nomenclatura inconsistente

**Descripción**: Existen dos conjuntos de roles que conviven en la tabla `roles`:

| Origen | Roles insertados |
|---|---|
| `SeedInitialRoles` (1779138100000) | `recepcionista`, `revisor`, `supervisor`, `alcalde` |
| `SeedAdminRole` (1779138600000) | `admin` |
| `SeedBaseRoles` (1779138700000) | `ADMIN`, `RECEPTIONIST`, `OFFICER`, `SUPERVISOR`, `MAYOR` |

`SeedBaseRoles` introduce una nomenclatura en inglés mayúscula que se superpone semánticamente con los roles en español (`recepcionista` ≈ `RECEPTIONIST`, `supervisor` ≈ `SUPERVISOR`, `alcalde` ≈ `MAYOR`). No hay rol `OFFICER` en español ni `revisor` en inglés. Además, `admin` (minúscula) y `ADMIN` (mayúscula) coexisten como dos registros distintos.

**Impacto**:
- Confusión sobre qué rol asignar a nuevos usuarios.
- La lógica de autorización en los guards de NestJS debe manejar ambos nombres.
- Los seed de usuarios demo (`SeedDemoUsers`) referencian los nombres en español (`recepcionista`, `revisor`, `supervisor`), por lo que si se decide migrar a la nomenclatura inglesa, los usuarios demo quedarían huérfanos.

**Recomendación**: Unificar a un solo estándar de nomenclatura. Definir una migración de limpieza que desactive (`is_active = false`) los roles obsoletos y migre los usuarios existentes al rol equivalente.

---

### H03 — Estados de solicitud incompatibles

**Descripción**: Existen dos conjuntos de estados en `request_statuses`:

| Origen | Estados insertados |
|---|---|
| `SeedInitialRequestStatuses` (1779138200000) | `Pendiente`, `En Proceso`, `Resuelto`, `Cerrado` |
| `SeedWorkflowRequestStatuses` (1779138600000) | `received`, `in_review`, `approved_by_officer`, `awaiting_mayor_signature`, `signed` |

El primer conjunto describe estados genéricos (típico de un sistema de tickets). El segundo describe un flujo de trabajo específico con validación y firma del alcalde.

**Impacto**:
- Ambigüedad al asignar un estado a una solicitud nueva.
- Las reglas de transición de estados (workflow) no pueden definirse claramente si conviven dos vocabularios.
- Las consultas y reportes deben filtrar por ambos conjuntos.

**Recomendación**: Definir un catálogo de estados unificado que cubra todo el flujo de principio a fin. Los estados actuales del primer conjunto pueden mapearse a estados del nuevo flujo (ej. `Pendiente` → `received`, `En Proceso` → `in_review`, etc.) y luego desactivarse.

---

### H04 — Priority enum: TypeORM vs PostgreSQL

**Descripción**: La migración `1779137900000` crea el tipo enum:

```sql
CREATE TYPE "requests_priority_enum" AS ENUM ('Low', 'Medium', 'High', 'Urgent')
```

Pero la entidad TypeORM define:

```typescript
export enum RequestPriority {
    LOW = 'Baja',
    MEDIUM = 'Media',
    HIGH = 'Alta',
    URGENT = 'Urgente',
}
```

Los valores del enum en la base de datos están en **inglés** (`'Low'`, `'Medium'`, `'High'`, `'Urgent'`), mientras que la entity TypeORM usa valores en **español** (`'Baja'`, `'Media'`, `'Alta'`, `'Urgente'`). El valor por defecto en la entidad es `RequestPriority.MEDIUM` que resuelve a `'Media'`, pero el default en la migración es `'Medium'`.

**Impacto**: **CRÍTICO**. Cualquier intento de insertar o actualizar una solicitud desde la aplicación con valores del enum TypeORM (`'Baja'`, `'Media'`, `'Alta'`, `'Urgente'`) resultará en un error de PostgreSQL:

```
ERROR: invalid input value for enum requests_priority_enum: "Media"
```

**Recomendación**: Corregir el enum TypeORM para que coincida con los valores de la base de datos, o viceversa. La opción más segura es alinear el enum de TypeScript con los valores existentes en la base de datos para evitar una migración de datos.

---

### H05 — Departamentos: columnas heredadas camelCase

**Descripción**: La migración `1779137321952` creó la tabla `departments` con columnas `isActive`, `createdAt`, `updatedAt` (camelCase). Posteriormente `1779137400000` las renombró a `is_active`, `created_at`, `updated_at`. Todas las demás tablas se crearon directamente con snake_case.

**Impacto**: Bajo. Ya está corregido. Sin embargo, si algún entorno tiene la versión anterior sin la migración de normalización, las columnas seguirían en camelCase y la entidad TypeORM (que espera snake_case) fallaría.

**Recomendación**: Verificar que todos los entornos hayan ejecutado la migración `1779137400000`. Como buena práctica, incluir un chequeo en una migración futura.

---

### H06 — Todas las FK usan ON DELETE NO ACTION

**Descripción**: Cada clave foránea del esquema se creó con `ON DELETE NO ACTION ON UPDATE NO ACTION`. No existe ninguna cascada.

**Impacto**:
- No se puede eliminar un departamento si tiene usuarios, categorías o solicitudes asociadas.
- No se puede eliminar un usuario si tiene solicitudes asignadas o registros de historial.
- La limpieza de datos requiere scripts manuales.

**Recomendación**: Evaluar caso por caso si alguna FK debería usar `ON DELETE SET NULL` (ej. `user_assigned_id` en `requests` cuando un usuario se desactiva) o `ON DELETE CASCADE` (ej. `request_history` cuando se elimina una solicitud).

---

### H07 — Tabla `request_history` con `event_type` como varchar sin restricción

**Descripción**: La migración `1779138500000` agregó `event_type` como `varchar(50) NOT NULL DEFAULT 'STATUS_CHANGED'`. La entidad TypeORM también lo define como `varchar(50)` sin usar el enum `RequestHistoryEventType` como tipo de columna.

**Impacto**: Bajo. Funciona correctamente, pero no hay validación a nivel de base de datos. Cualquier string puede insertarse en `event_type`.

**Recomendación**: Considerar migrar a un tipo enum de PostgreSQL o añadir un CHECK CONSTRAINT si se desea integridad a nivel DB.

---

### H08 — Seeders directory vacío

**Descripción**: El directorio `src/database/seeders/` contiene solo un `.gitkeep`. No hay seeds independientes de las migraciones.

**Impacto**: No hay una forma estandarizada de poblar datos de prueba sin ejecutar todo el historial de migraciones.

**Recomendación**: Implementar seeders independientes (ej. con `typeorm-extension` o scripts NestJS) para datos de prueba y desarrollo.

---

### H09 — SeedDemoUsers referencias a roles español

**Descripción**: La migración `1779138700000-SeedDemoUsers` inserta usuarios con `role_id` obtenido mediante `WHERE r.name = 'recepcionista'`, `'supervisor'` y `'revisor'`. Estos nombres existen gracias a `SeedInitialRoles`. Si en el futuro se eliminan esos roles, los seed de usuarios dejarían de funcionar.

**Impacto**: Los usuarios demo no podrían crearse en entornos nuevos si se decide limpiar los roles en español.

**Recomendación**: Actualizar `SeedDemoUsers` para que use los nombres de rol que se definan como estándar (ver H02), y agregar una dependencia explícita.

---

## Riesgos

| # | Riesgo | Impacto | Probabilidad |
|---|---|---|---|
| R01 | Inserción de prioridad falla por mismatch del enum | Alto | Alta |
| R02 | Roles duplicados causan autorización incorrecta | Medio | Media |
| R03 | Estados incompatibles rompen el workflow | Alto | Media |
| R04 | Migraciones con mismo timestamp se ejecutan en orden impredecible en otras herramientas | Bajo | Baja |
| R05 | Sin migraciones MongoDB, los schemas evolucionan sin control | Medio | Alta |

---

## Recomendaciones (priorizadas)

1. **CRÍTICO** — Corregir el enum `RequestPriority` para alinear TypeScript con PostgreSQL (o viceversa). Sin esto, la aplicación no puede insertar solicitudes con prioridad.
2. **ALTA** — Unificar roles a una sola nomenclatura y migrar usuarios existentes.
3. **ALTA** — Unificar estados de solicitud a un solo catálogo que refleje el flujo de trabajo real.
4. **MEDIA** — Asignar timestamps únicos a cada migración.
5. **MEDIA** — Implementar migraciones versionadas para MongoDB.
6. **MEDIA** — Evaluar políticas de borrado en FK (SET NULL vs CASCADE).
7. **BAJA** — Poblar el directorio `seeders/` con datos de prueba estandarizados.

---

## Referencias

- `backend/src/database/data-source.ts` — Configuración del DataSource de TypeORM
- `backend/src/database/migrations/*.ts` — Migraciones analizadas (18 archivos)
- `backend/src/**/*.entity.ts` — Entidades TypeORM (7 archivos)
- `backend/src/academic-mongo/schemas/academic-checklist.schema.ts` — Schema MongoDB
- `backend/src/documents/schema/document-user.schema.ts` — Schema MongoDB

---

## Resultado esperado

Tras la ejecución de este diagnóstico, el equipo cuenta con una radiografía completa del estado actual del esquema y las migraciones. Las inconsistencias documentadas aquí deben resolverse antes de diseñar nuevas migraciones para evitar arrastrar problemas a futuras iteraciones del modelo de datos.
