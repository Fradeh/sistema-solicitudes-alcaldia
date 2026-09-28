# V3-4.5 Matriz de permisos administrativos — Sprint 3

## Proposito

Este documento define los permisos, restricciones, alcance de consulta y reglas
del actor **Administrador** (`ADMIN`) dentro del Sprint 3.

Complementa la matriz oficial de permisos (`docs/sprint-03-permission-matrix.md`)
con la granularidad necesaria para implementar autorización administrativa
sobre usuarios, roles, permisos y departamentos, dejando claro que el
Administrador no obtiene permisos operativos sobre solicitudes.

Este documento es funcional. No implementa tablas, migraciones, guards,
decoradores ni lógica de autorización.

## Fuentes

- `docs/sprint-03-permission-matrix.md` — Catálogo de permisos y matriz
  rol-permiso.
- `docs/sprint-03-official-roles.md` — Responsabilidades y restricciones del
  Administrador.
- `docs/sprint-03-gap-analysis.md` — Análisis de brecha del backend actual.
- `docs/v3-5-1-catalogo-eventos-auditables.md` — Catálogo oficial de eventos
  auditables.
- `docs/v3-5-3-catalogo-eventos-administrativos.md` — Catálogo de eventos
  administrativos.

## Rol: ADMIN

| Atributo | Valor |
|---|---|
| Código técnico | `ADMIN` |
| Actor funcional | Administrador |
| Departamento requerido | No |
| Alcance principal | Usuarios, roles, permisos y departamentos |

El Administrador representa al personal responsable de la configuración,
continuidad y gestión de accesos del sistema. No participa en el flujo
operativo de solicitudes.

## Permisos asignados

### Permisos del catálogo oficial

El Administrador recibe los siguientes permisos definidos en la matriz oficial:

| # | Código técnico | Descripción | Acción protegida |
|---|---|---|---|
| P20 | `users:create` | Crear un nuevo usuario | POST /users |
| P21 | `users:update` | Actualizar datos de un usuario | PATCH /users/:id |
| P22 | `users:disable` | Activar o desactivar un usuario | PATCH /users/:id/status |
| P23 | `users:assign_role` | Asignar o cambiar el rol de un usuario | PATCH /users/:id/role |
| P24 | `users:assign_department` | Asignar o cambiar el departamento de un usuario | PATCH /users/:id/department |

### Permisos adicionales propuestos

La matriz oficial no contempla permisos explícitos para consultar o gestionar
departamentos, roles y permisos. Se proponen los siguientes códigos para que
la Subissue 4.1 — Consolidar el catálogo de permisos — los evalúe e incorpore:

| # | Código técnico propuesto | Descripción | Acción protegida |
|---|---|---|---|
| P25 | `departments:view` | Consultar lista y detalle de departamentos | GET /departments |
| P26 | `departments:create` | Crear un nuevo departamento | POST /departments |
| P27 | `departments:update` | Actualizar datos de un departamento | PATCH /departments/:id |
| P28 | `departments:disable` | Activar o desactivar un departamento | PATCH /departments/:id/status |
| P29 | `roles:view` | Consultar roles y permisos del sistema | GET /roles, GET /permissions |

### Nota sobre consulta de usuarios

El permiso `users:view` no está definido explícitamente en el catálogo. Para
efectos del MVP, se asume que la consulta de usuarios está implícitamente
disponible para quien tenga al menos un permiso `users:*`. Si la Subissue 4.1
requiere explicitarlo, se propone:

| # | Código técnico propuesto | Descripción | Acción protegida |
|---|---|---|---|
| P30 | `users:view` | Consultar lista y detalle de usuarios | GET /users, GET /users/:id |

## Matriz rol-permiso completa para ADMIN

| # | Permiso | ADMIN |
|---|---|---|
| P20 | `users:create` | SI |
| P21 | `users:update` | SI |
| P22 | `users:disable` | SI |
| P23 | `users:assign_role` | SI |
| P24 | `users:assign_department` | SI |
| P25 | `departments:view` | SI |
| P26 | `departments:create` | SI |
| P27 | `departments:update` | SI |
| P28 | `departments:disable` | SI |
| P29 | `roles:view` | SI |
| P30 | `users:view` | SI |

Los permisos P25–P30 se marcan como propuestos. La matriz oficial debe
actualizarse para incluirlos si la Subissue 4.1 los aprueba.

## Acciones bloqueadas

El Administrador **no puede** ejecutar las siguientes acciones bajo ninguna
circunstancia:

| # | Acción bloqueada | Actor responsable | Motivo del bloqueo |
|---|---|---|---|
| P1 | `requests:create` | Secretaria | La recepción y registro es función de Secretaria |
| P2 | `requests:upload_documents` | Secretaria | La carga documental corresponde a Secretaria |
| P3 | `requests:update` | Secretaria / Despacho | La edición de solicitudes es operativa |
| P4 | `requests:assign_department` | Secretaria / Despacho | Asignar departamento es una acción operativa |
| P5 | `requests:set_priority` | Secretaria / Despacho | La prioridad es definida por actores operativos |
| P6 | `requests:set_deadline` | Secretaria / Despacho | La fecha límite es definida por actores operativos |
| P7 | `requests:view_all` | Secretaria / Despacho | Sin permiso de soporte aprobado |
| P8 | `requests:view_own_department` | Departamento | No aplica: ADMIN no tiene departamento |
| P9 | `requests:view_audit` | Secretaria / Departamento / Despacho | Sin permiso de soporte aprobado |
| P10 | `requests:mark_viewed` | Departamento | Marcar como vista es responsabilidad del Departamento |
| P11 | `requests:start_review` | Departamento | Iniciar revisión es responsabilidad del Departamento |
| P12 | `requests:approve_department` | Departamento | Decisión departamental exclusiva del Departamento |
| P13 | `requests:reject_department` | Departamento | Decisión departamental exclusiva del Departamento |
| P14 | `requests:send_to_mayor_office` | Departamento | Escalamiento al despacho exclusivo del Departamento |
| P15 | `requests:return_to_department` | Despacho del Alcalde | Decisión del Despacho del Alcalde |
| P16 | `requests:approve_mayor_office` | — | No existe como permiso activo en el catálogo |
| P17 | `requests:reject_mayor_office` | Despacho del Alcalde | Decisión del Despacho del Alcalde |
| P18 | `requests:sign` | Despacho del Alcalde | Firma exclusiva del Despacho del Alcalde |
| P19 | `requests:close` | Secretaria | Cierre ordinario por Secretaria (según Issue 3) |

### Otras acciones bloqueadas

| Acción bloqueada | Justificación |
|---|---|
| Aprobar solicitudes a nivel departamental | El Administrador no tiene rol operativo |
| Rechazar solicitudes a nivel departamental | El Administrador no tiene rol operativo |
| Firmar solicitudes | La firma es exclusiva del Despacho del Alcalde |
| Cerrar solicitudes | El cierre ordinario corresponde a Secretaria |
| Enviar solicitudes al despacho | El escalamiento es competencia del Departamento |
| Devolver solicitudes al departamento | Es decisión del Despacho del Alcalde |
| Reasignar solicitudes a otro departamento | La reasignación operativa corresponde a Secretaria o Despacho |
| Modificar prioridad o fecha límite de solicitudes | Son decisiones operativas, no administrativas |
| Crear solicitudes | La recepción inicial corresponde a Secretaria |

## Alcance de consulta

### Usuarios

| Tipo de consulta | Alcance del Administrador |
|---|---|
| Listar todos los usuarios | Acceso completo |
| Consultar detalle de un usuario | Acceso completo |
| Consultar usuarios activos e inactivos | Acceso completo |
| Consultar el rol y departamento de un usuario | Acceso completo |

### Departamentos

| Tipo de consulta | Alcance del Administrador |
|---|---|
| Listar todos los departamentos | Acceso completo |
| Consultar detalle de un departamento | Acceso completo |
| Consultar departamentos activos e inactivos | Acceso completo |
| Consultar usuarios por departamento | Acceso completo |

### Roles y permisos

| Tipo de consulta | Alcance del Administrador |
|---|---|
| Listar roles del sistema | Acceso completo |
| Consultar detalle de un rol | Acceso completo |
| Consultar matriz de permisos por rol | Acceso completo |

### Solicitudes (consulta de soporte)

| Tipo de consulta | Alcance del Administrador |
|---|---|
| Consultar solicitudes por defecto | **No permitido** |
| Consultar detalle de una solicitud por defecto | **No permitido** |
| Consultar historial de solicitudes por defecto | **No permitido** |

#### Condiciones para acceso excepcional a solicitudes

El Administrador **no debe** consultar solicitudes como parte de sus funciones
ordinarias. Si se requiere un acceso excepcional para tareas de soporte
autorizadas (verificación de integridad, depuración, investigación de
incidentes), deben cumplirse todas las condiciones siguientes:

1. Existe una solicitud de soporte documentada (ticket, incidencia o
   autorización explícita).
2. El acceso es temporal y limitado al recurso específico.
3. El acceso es de solo lectura.
4. El acceso queda registrado en auditoría con el motivo.
5. No otorga permisos operativos sobre la solicitud (no puede aprobar,
   rechazar, firmar, cerrar, editar ni reasignar).

Para este escenario, la Subissue 4.1 puede evaluar la creación de un permiso
excepcional como:

| # | Código técnico propuesto | Descripción | Acción protegida |
|---|---|---|---|
| P31 | `requests:view_support` | Consultar solicitudes para soporte autorizado | GET /requests (restringido) |

**Decisión:** Durante el MVP, el Administrador **no** recibe permiso de
consulta de solicitudes. El permiso `requests:view_support` queda propuesto
para una fase posterior si se aprueba el caso de uso de soporte.

## Reglas sobre usuarios departamentales

### Departamento obligatorio para DEPARTMENT_STAFF

Todo usuario con rol `DEPARTMENT_STAFF` debe tener un `departmentId` activo y
válido. El Administrador debe aplicar esta regla al crear o modificar usuarios
con rol departamental.

| Escenario | Regla |
|---|---|
| Crear usuario `DEPARTMENT_STAFF` sin departamento | **Bloqueado.** El sistema debe rechazar la creación. |
| Crear usuario `DEPARTMENT_STAFF` con departamento inactivo | **Bloqueado.** El sistema debe rechazar la creación. |
| Cambiar rol de un usuario a `DEPARTMENT_STAFF` sin departamento | **Bloqueado.** El sistema debe rechazar el cambio de rol. |
| Cambiar departamento de `DEPARTMENT_STAFF` a un departamento inactivo | **Bloqueado.** El sistema debe rechazar el cambio. |
| Desactivar departamento de un usuario `DEPARTMENT_STAFF` activo | **Bloqueado.** El usuario debe ser reasignado a otro departamento activo o desactivado primero. |
| Usuario `DEPARTMENT_STAFF` existe sin departamento por migración | El Administrador debe corregir la inconsistencia asignando un departamento activo o desactivando el usuario. |

### Roles que NO requieren departamento

| Rol | Regla |
|---|---|
| `SECRETARY` | El departamento es opcional y no se usa como alcance principal. Puede tenerlo por registro pero no limita sus operaciones. |
| `MAYOR_OFFICE` | No requiere departamento. Su alcance es global. |
| `ADMIN` | No requiere departamento. Su alcance es administrativo. |

### Validación de consistencia

El Administrador debe poder identificar y corregir inconsistencias como:

- Usuarios `DEPARTMENT_STAFF` sin departamento.
- Usuarios `DEPARTMENT_STAFF` con departamento inactivo.
- Usuarios con rol no departamental que tienen departamento pero este fue
  desactivado (no bloquea al usuario, pero debe notificarse).

## Reglas sobre departamentos

### Regla para impedir desactivar departamentos con usuarios activos

Un departamento **no puede desactivarse** si tiene al menos un usuario activo
con rol `DEPARTMENT_STAFF` asignado a ese departamento.

La desactivación debe seguir este flujo:

1. Verificar que no existan usuarios activos con `role = DEPARTMENT_STAFF` y
   `departmentId = target`.
2. Si existen usuarios activos, la desactivación se rechaza con un mensaje que
   indique la cantidad de usuarios activos que deben ser reasignados o
   desactivados primero.
3. Si no existen usuarios activos, la desactivación procede y se registra el
   evento de auditoría.

Usuarios con roles `SECRETARY`, `MAYOR_OFFICE` o `ADMIN` que tengan un
departamento asignado no bloquean la desactivación, aunque debería generarse
una notificación informativa.

### Efectos de desactivar un departamento

| Efecto | Descripción |
|---|---|
| Usuarios `DEPARTMENT_STAFF` activos | **No puede desactivarse.** Deben reasignarse o desactivarse primero. |
| Solicitudes en el departamento | Las solicitudes en estados operativos (`assigned_to_department`, `in_review`, `returned_to_department`) deben ser reasignadas antes de desactivar. Esta validación puede implementarse en una fase posterior. Durante el MVP, el sistema debe advertir al Administrador si existen solicitudes activas en el departamento. |
| Nuevas operaciones | Los usuarios del departamento no pueden iniciar nuevas operaciones sobre solicitudes después de la desactivación. |
| Reactivación | Un departamento desactivado puede reactivarse. La reactivación no reasigna automáticamente usuarios o solicitudes. |

### Reglas de integridad para departamentos

| Regla | Descripción |
|---|---|
| Nombre único | El nombre del departamento debe ser único en el sistema. |
| Desactivación con advertencia | Si existen solicitudes activas en el departamento, el sistema debe mostrar una advertencia antes de permitir la desactivación. |
| Restricción de eliminación física | Los departamentos no se eliminan físicamente. Solo se desactivan mediante `isActive = false`. |
| Historial de cambios | Toda creación, actualización o desactivación de departamentos debe quedar registrada en auditoría. |

## Asociación con eventos de auditoría

### Acciones administrativas y eventos

| Acción administrativa | Evento de auditoría | Obligatorio |
|---|---|---|
| Crear usuario | `USER_CREATED` | SI |
| Actualizar datos de usuario | `USER_UPDATED` | SI |
| Activar usuario | `USER_ACTIVATED` | SI |
| Desactivar usuario | `USER_DEACTIVATED` | SI |
| Asignar rol a usuario | `USER_ROLE_ASSIGNED` | SI |
| Cambiar rol de usuario | `USER_ROLE_CHANGED` | SI |
| Asignar departamento a usuario | `USER_DEPARTMENT_ASSIGNED` | SI |
| Remover departamento de usuario | `USER_DEPARTMENT_REMOVED` | SI |
| Crear departamento | `DEPARTMENT_CREATED` | SI |
| Actualizar departamento | `DEPARTMENT_UPDATED` | SI |
| Desactivar departamento | `DEPARTMENT_DEACTIVATED` | SI |
| Reactivar departamento | `DEPARTMENT_REACTIVATED` | SI |
| Actualizar permisos de un rol | `PERMISSION_UPDATED` | SI |

### Información mínima por evento

Cada evento administrativo debe registrar como mínimo:

| Campo | Descripción |
|---|---|
| `actorId` | Identificador del usuario Administrador que ejecutó la acción |
| `actorEmail` | Email del Administrador (para legibilidad en auditoría) |
| `resourceType` | Tipo de recurso afectado: `user`, `department`, `role`, `permission` |
| `resourceId` | Identificador del recurso afectado |
| `action` | Código del evento (`USER_CREATED`, `DEPARTMENT_DEACTIVATED`, etc.) |
| `previousValue` | Valor anterior del campo modificado (si aplica) |
| `newValue` | Valor nuevo del campo modificado (si aplica) |
| `reason` | Motivo u observación (opcional para algunas acciones, recomendado para desactivaciones) |
| `timestamp` | Fecha y hora del evento |

### Reglas de generación de auditoría

- Los eventos marcados como **obligatorios** nunca deben omitirse.
- Los cambios administrativos deben registrarse en la misma transacción que la
  acción que los genera.
- La auditoría administrativa debe almacenarse en una tabla o colección
  separada de `request_history`. El diseño de `audit_logs` corresponde a la
  Issue 5.
- Si una operación administrativa afecta múltiples recursos (ej. desactivación
  masiva), cada recurso debe tener su propio evento individual.

## Reglas de validación

El flujo de autorización para una acción del Administrador debe seguir este
orden:

1. El usuario está autenticado (JWT válido).
2. El usuario tiene rol `ADMIN` activo.
3. El rol tiene el permiso requerido para la acción (según la matriz de este
   documento).
4. Si la acción afecta un usuario `DEPARTMENT_STAFF`, se valida que el
   departamento asociado exista y esté activo.
5. Si la acción es desactivar un departamento, se valida que no tenga usuarios
   `DEPARTMENT_STAFF` activos.
6. Los datos obligatorios para la acción están presentes.
7. Se registra el evento de auditoría correspondiente.

Si cualquiera de las validaciones falla, la operación debe rechazarse con el
código HTTP y mensaje de error definidos en el contrato técnico.

## Errores esperados

| Escenario | Código HTTP | Mensaje |
|---|---|---|
| Acción sin permiso | 403 | `PERMISSION_DENIED` |
| Usuario `DEPARTMENT_STAFF` sin departamento | 400 | `DEPARTMENT_REQUIRED_FOR_ROLE` |
| Departamento destino inactivo | 400 | `INACTIVE_DEPARTMENT` |
| Desactivar departamento con usuarios activos | 409 | `DEPARTMENT_HAS_ACTIVE_USERS` |
| Desactivar departamento con solicitudes activas | 409 | `DEPARTMENT_HAS_ACTIVE_REQUESTS` |
| Usuario a desactivar no existe | 404 | `USER_NOT_FOUND` |
| Departamento a desactivar no existe | 404 | `DEPARTMENT_NOT_FOUND` |
| Email de usuario duplicado | 409 | `DUPLICATE_EMAIL` |
| Nombre de departamento duplicado | 409 | `DUPLICATE_DEPARTMENT_NAME` |
| Acción de soporte sin autorización | 403 | `SUPPORT_ACCESS_NOT_AUTHORIZED` |

## Resumen de permisos administrativos

### Permisos asignados

| # | Permiso | Descripción |
|---|---|---|
| P20 | `users:create` | Crear usuarios |
| P21 | `users:update` | Actualizar usuarios |
| P22 | `users:disable` | Activar / desactivar usuarios |
| P23 | `users:assign_role` | Asignar o cambiar rol |
| P24 | `users:assign_department` | Asignar o cambiar departamento |
| P25 | `departments:view` | Consultar departamentos |
| P26 | `departments:create` | Crear departamentos |
| P27 | `departments:update` | Actualizar departamentos |
| P28 | `departments:disable` | Activar / desactivar departamentos |
| P29 | `roles:view` | Consultar roles y permisos |
| P30 | `users:view` | Consultar usuarios |

### Restricciones operativas

- El Administrador **no** puede aprobar solicitudes.
- El Administrador **no** puede rechazar solicitudes.
- El Administrador **no** puede firmar solicitudes.
- El Administrador **no** puede cerrar solicitudes.
- El Administrador **no** puede crear, editar, asignar, reasignar, escalar ni
  modificar solicitudes.
- El Administrador **no** recibe permisos operativos automáticamente por su
  rol.

### Alcance de consulta

- El Administrador puede consultar: usuarios, departamentos, roles y permisos.
- El Administrador **no** puede consultar solicitudes por defecto.
- El acceso a solicitudes para soporte requiere un permiso excepcional
  (`requests:view_support`) que queda fuera del MVP.

### Reglas sobre usuarios departamentales

- `DEPARTMENT_STAFF` requiere departamento activo obligatorio.
- No se puede crear, actualizar ni cambiar el rol de un usuario a
  `DEPARTMENT_STAFF` sin un departamento activo válido.
- No se puede desactivar el departamento de un usuario `DEPARTMENT_STAFF`
  activo sin reasignarlo o desactivar al usuario primero.

### Reglas sobre departamentos

- No se puede desactivar un departamento con usuarios `DEPARTMENT_STAFF`
  activos.
- La desactivación de un departamento con solicitudes activas debe mostrar una
  advertencia.
- Los departamentos no se eliminan físicamente, solo se desactivan.

### Eventos de auditoría asociados

- Toda acción administrativa (crear, actualizar, activar, desactivar, asignar
  rol, asignar departamento) genera un evento de auditoría obligatorio.
- Los eventos se almacenan en una tabla/colección separada de
  `request_history`.
- Cada evento registra actor, recurso, acción, valores anterior/nuevo, motivo
  y timestamp.

## Cobertura de criterios de aceptación

- [x] El Administrador puede consultar usuarios (P30).
- [x] El Administrador puede crear usuarios (P20).
- [x] El Administrador puede actualizar usuarios (P21).
- [x] El Administrador puede activar usuarios (P22).
- [x] El Administrador puede desactivar usuarios (P22).
- [x] El Administrador puede asignar roles (P23).
- [x] El Administrador puede asignar departamentos (P24).
- [x] El Administrador puede consultar y gestionar departamentos (P25–P28).
- [x] El Administrador puede consultar roles y permisos (P29).
- [x] El Administrador no recibe permisos operativos de solicitudes
      automáticamente.
- [x] El Administrador no puede aprobar solicitudes por defecto.
- [x] El Administrador no puede rechazar solicitudes por defecto.
- [x] El Administrador no puede firmar solicitudes por defecto.
- [x] El Administrador no puede cerrar solicitudes por defecto.
- [x] Los usuarios departamentales requieren un departamento válido.
- [x] Está definida la regla para impedir desactivar departamentos con usuarios
      activos.
- [x] Las acciones administrativas generan auditoría (tabla de eventos por
      acción).
- [x] Las restricciones están documentadas claramente.

## Actualizaciones requeridas a la matriz oficial

Para reflejar completamente los permisos de ADMIN, la matriz oficial
(`docs/sprint-03-permission-matrix.md`) debe incorporar:

1. Nuevos permisos P25 (`departments:view`), P26 (`departments:create`),
   P27 (`departments:update`), P28 (`departments:disable`),
   P29 (`roles:view`) y P30 (`users:view`).
2. Asignar estos permisos al rol `ADMIN` en la matriz rol-permiso.
3. Agregar los nuevos permisos a la sección de alcance asociado por permiso,
   todos con alcance "Administrativo".
4. Actualizar el conteo de permisos en la sección de cobertura de criterios de
   aceptación.

## Historial de cambios

| Fecha | Cambio | Autor |
|---|---|---|
| 2026-06-14 | Creación inicial de la matriz de permisos administrativos | Lucas-Santamaria-Create |
