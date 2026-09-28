# V3-4.4 Matriz de permisos del Despacho del Alcalde — Sprint 3

## Proposito

Este documento define los permisos, restricciones, alcance de acceso y
comportamiento por estado del actor **Despacho del Alcalde** (`MAYOR_OFFICE`)
dentro del Sprint 3.

Complementa la matriz oficial de permisos (`docs/sprint-03-permission-matrix.md`)
con la granularidad necesaria para implementar autorización sobre las
transiciones del despacho.

Este documento es funcional. No implementa tablas, migraciones, guards,
decoradores ni lógica de autorización.

## Fuentes

- `docs/sprint-03-permission-matrix.md` — Catálogo de 24 permisos y matriz
  rol-permiso.
- `docs/sprint-03-official-roles.md` — Responsabilidades y restricciones del
  Despacho del Alcalde.
- `docs/sprint-03-official-states.md` — Comportamiento detallado de cada estado
  del catálogo oficial, incluyendo los estados del despacho.
- `docs/sprint-03-gap-analysis.md` — Análisis de brecha del backend actual.

## Rol: MAYOR_OFFICE

| Atributo | Valor |
|---|---|
| Código técnico | `MAYOR_OFFICE` |
| Actor funcional | Despacho del Alcalde |
| Departamento requerido | No |
| Alcance principal | Solicitudes de todos los departamentos |

El Despacho del Alcalde representa al alcalde y al personal autorizado del
despacho que interviene en solicitudes escaladas o que requieren una decisión
superior. Tiene visibilidad global sobre todas las solicitudes,
independientemente del departamento.

## Permisos asignados

El Despacho del Alcalde recibe los siguientes permisos del catálogo oficial:

| # | Código técnico | Descripción | Acción protegida |
|---|---|---|---|
| P3 | `requests:update` | Editar campos autorizados de una solicitud | PATCH /requests/:id |
| P4 | `requests:assign_department` | Reasignar departamento responsable | PATCH /requests/:id/assign-department |
| P5 | `requests:set_priority` | Definir o cambiar la prioridad | PATCH /requests/:id/priority |
| P6 | `requests:set_deadline` | Definir o cambiar la fecha límite | PATCH /requests/:id/deadline |
| P7 | `requests:view_all` | Consultar solicitudes de todos los departamentos | GET /requests |
| P9 | `requests:view_audit` | Consultar el historial y auditoría de una solicitud | GET /requests/:id/history |
| P15 | `requests:return_to_department` | Devolver una solicitud al departamento desde despacho | POST /requests/:id/return-to-department |
| P17 | `requests:reject_mayor_office` | Rechazar una solicitud desde el despacho del alcalde | POST /requests/:id/reject-mayor |
| P18 | `requests:sign` | Firmar lógicamente una solicitud | POST /requests/:id/sign |
| P19 | `requests:close` | Cerrar una solicitud | POST /requests/:id/close |

### Acción sin cambio de estado: agregar observación interna

| Aspecto | Descripción |
|---|---|
| **Acción** | Agregar observación interna a una solicitud |
| **Actor** | `MAYOR_OFFICE` |
| **Cambia estado** | **No** |
| **Permiso implícito** | Asociado a la capacidad operativa del despacho |
| **Estados donde aplica** | `awaiting_mayor_signature` (E6), y cualquier estado donde el despacho tenga acceso de consulta |

## Acciones bloqueadas

El Despacho del Alcalde **no puede** ejecutar las siguientes acciones:

| # | Acción bloqueada | Actor responsable | Motivo del bloqueo |
|---|---|---|---|
| P1 | `requests:create` | Secretaria | La recepción es función de Secretaria |
| P2 | `requests:upload_documents` | Secretaria | La carga documental corresponde a Secretaria |
| P8 | `requests:view_own_department` | — | No aplica: el despacho tiene alcance global, no departamental |
| P10 | `requests:mark_viewed` | Departamento | Marcar como vista es responsabilidad del Departamento |
| P11 | `requests:start_review` | Departamento | Iniciar revisión es responsabilidad del Departamento |
| P12 | `requests:approve_department` | Departamento | Decisión departamental exclusiva del Departamento |
| P13 | `requests:reject_department` | Departamento | Decisión departamental exclusiva del Departamento |
| P14 | `requests:send_to_mayor_office` | Departamento | Envío al despacho es potestad del Departamento |
| P16 | `requests:approve_mayor_office` | — | No existe como permiso activo en el catálogo |
| P20–24 | `users:*` | Administrador | Gestión de usuarios es función del Administrador |

### Otras acciones bloqueadas

| Acción bloqueada | Justificación |
|---|---|
| Crear solicitudes desde el despacho | La recepción inicial corresponde a Secretaría |
| Actuar sobre solicitudes sin haber sido escaladas | El despacho solo interviene en los estados autorizados del flujo |
| Firmar sin que la solicitud esté en `awaiting_mayor_signature` | La firma requiere estado compatible |
| Cerrar solicitudes sin resultado previo | El cierre solo procede desde estados de resultado válidos |
| Reemplazar la revisión departamental | El despacho no omite la revisión del Departamento |

## Alcance de acceso

| Tipo de consulta | Alcance del Despacho |
|---|---|
| Solicitudes de todos los departamentos | **Acceso global** — consulta completa |
| Historial y auditoría de cualquier solicitud | **Acceso global** — consulta completa |
| Solicitudes escaladas (E6) | Acceso operativo completo según estado y permiso |
| Solicitudes en estado de resultado (E4, E5, E8, E9) | Acceso de consulta; solo cierre si tiene permiso |

El Despacho del Alcalde tiene alcance **global** sobre solicitudes sin
restricción de departamento. Sin embargo:

- La visibilidad global **no permite ejecutar cualquier transición**.
- Cada acción sigue necesitando: permiso específico, estado compatible, datos
  obligatorios y registro de auditoría.
- El despacho **no administra usuarios, roles o permisos** por tener alcance
  global.

## Permiso de firma

La firma lógica está asignada al rol `MAYOR_OFFICE` mediante el permiso P18
(`requests:sign`). Dentro del MVP:

- Todos los usuarios del rol `MAYOR_OFFICE` reciben el permiso de firma.
- La firma representa una actuación lógica del MVP, no una integración de firma
  digital certificada.
- La firma requiere que el usuario esté autenticado y tenga el permiso explícito.
- No se asume que cualquier usuario con alcance global puede firmar.
- El sistema debe conservar la identidad del firmante (`signed_by_id`) y la
  fecha (`signed_at`).
- No puede firmarse una segunda vez por el flujo ordinario.

### Validaciones previas a la firma

1. La solicitud debe estar en `awaiting_mayor_signature` (E6).
2. El usuario debe tener el permiso `requests:sign`.
3. La solicitud no debe haber sido firmada previamente.
4. El usuario debe estar autenticado y tener rol activo.
5. Se registra `signed_at`, `signed_by_id` y el evento `SIGNED`.

## Relación de permisos con estados

La siguiente tabla define en qué estados del ciclo de vida de la solicitud
puede el Despacho del Alcalde ejercer cada permiso.

### Estados del catálogo oficial

| # | Código técnico | Etiqueta | Tipo |
|---|---|---|---|
| E1 | `received` | Recibida | Inicial |
| E2 | `assigned_to_department` | Asignada a departamento | Intermedio operativo |
| E3 | `in_review` | En revisión | Intermedio operativo |
| E4 | `approved_by_department` | Aprobada por departamento | Intermedio de resultado |
| E5 | `rejected_by_department` | Rechazada por departamento | Terminal |
| E6 | `awaiting_mayor_signature` | Pendiente de decisión del despacho | Intermedio operativo |
| E7 | `returned_to_department` | Devuelta al departamento | Intermedio operativo |
| E8 | `rejected_by_mayor_office` | Rechazada por alcaldía | Terminal |
| E9 | `signed` | Firmada | Intermedio de resultado |
| E10 | `closed` | Cerrada | Terminal |

### Matriz permiso-estado para MAYOR_OFFICE

| Permiso | E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8 | E9 | E10 |
|---|---|---|---|---|---|---|---|---|---|---|
| `requests:view_all` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `requests:view_audit` | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `requests:update` | No | No | No | No | No | Sí | No | No | No | No |
| `requests:assign_department` | No | Sí | No | No | — | Sí | No | — | No | — |
| `requests:set_priority` | No | No | No | No | — | Sí | No | — | No | — |
| `requests:set_deadline` | No | No | No | No | — | Sí | No | — | No | — |
| `requests:return_to_department` | No | No | No | No | — | Sí | No | — | — | — |
| `requests:reject_mayor_office` | No | No | No | No | — | Sí | No | — | — | — |
| `requests:sign` | No | No | No | No | — | Sí | No | — | — | — |
| `requests:close` | No | No | No | No | No | No | No | Sí | Sí | No |

**Leyenda:**
- **Sí** — Permiso disponible en ese estado.
- **No** — Permiso bloqueado en ese estado.
- **—** — Estado no aplicable o no alcanzable desde ese permiso.
- Estados terminales (E5, E8, E10): solo lectura global, sin operaciones.

### Reglas por permiso

#### P3 — `requests:update`

- Disponible solo en E6 (`awaiting_mayor_signature`).
- Permite editar los campos expresamente autorizados de la solicitud.
- No permite modificar datos que hayan sido registrados por otros actores fuera
  del alcance del despacho.
- Incluye la capacidad de agregar observaciones internas sin cambiar el estado.

#### P4 — `requests:assign_department`

- Disponible en E2 (`assigned_to_department`) como reasignación directa y en
  E6 (`awaiting_mayor_signature`) como reasignación desde el despacho.
- La reasignación cambia inmediatamente el departamento responsable y registra
  el evento correspondiente.
- Requiere que el departamento destino exista y esté activo.
- La reasignación desde E6 cambia a `assigned_to_department` del nuevo
  departamento.

#### P5 — `requests:set_priority`

- Disponible en E6 (`awaiting_mayor_signature`).
- Permite modificar la prioridad de la solicitud.
- El cambio se registra en auditoría.

#### P6 — `requests:set_deadline`

- Disponible en E6 (`awaiting_mayor_signature`).
- Permite modificar la fecha límite.
- La fecha debe ser igual o posterior a la fecha actual.

#### P7 — `requests:view_all`

- Disponible en todos los estados.
- Permite consultar cualquier solicitud independientemente del departamento.
- La respuesta debe incluir datos básicos, estado actual, departamento asignado,
  prioridad, fecha límite y fechas operativas.

#### P9 — `requests:view_audit`

- Disponible en todos los estados.
- Permite consultar el historial completo de eventos de cualquier solicitud.
- La respuesta debe incluir todos los eventos del ciclo de vida, incluyendo
  decisiones departamentales, firmas y cierre.

#### P15 — `requests:return_to_department`

- Disponible solo en E6 (`awaiting_mayor_signature`).
- Requiere motivo obligatorio de devolución.
- Transiciona a `returned_to_department` (E7).
- El motivo queda visible para el personal autorizado del departamento.
- No puede ejecutarse si la solicitud no está en E6.

#### P17 — `requests:reject_mayor_office`

- Disponible solo en E6 (`awaiting_mayor_signature`).
- Requiere motivo obligatorio de rechazo.
- Transiciona a `rejected_by_mayor_office` (E8).
- Registra `decision_at` y genera `REJECTED_BY_MAYOR_OFFICE`.
- No puede ejecutarse si la solicitud no está en E6.

#### P18 — `requests:sign`

- Disponible solo en E6 (`awaiting_mayor_signature`).
- Requiere que el usuario tenga permiso explícito de firma.
- Transiciona a `signed` (E9).
- Registra `signed_at`, `signed_by_id` y genera `SIGNED`.
- No puede firmarse una segunda vez por el flujo ordinario.

#### P19 — `requests:close`

- Disponible en E8 (`rejected_by_mayor_office`) y E9 (`signed`) como cierre
  desde el despacho.
- **Nota de inconsistencia:** La matriz de permisos (`permission-matrix.md`)
  asigna `requests:close` a `MAYOR_OFFICE` con alcance global, pero
  `sprint-03-official-states.md` establece que "el cierre es manual y
  corresponde a Secretaría durante el MVP". Esta inconsistencia debe resolverse
  en la Issue 4.1. Hasta entonces, se documenta la disponibilidad según la
  matriz.

## Restricciones funcionales

### Restricción de estado para acciones operativas

Las acciones de firma, devolución, rechazo y reasignación solo son posibles
cuando la solicitud está en `awaiting_mayor_signature` (E6). No pueden
ejecutarse en estados previos o posteriores.

### Restricción de motivo

- Devolver al departamento (P15) requiere **motivo obligatorio**.
- Rechazar desde la alcaldía (P17) requiere **motivo obligatorio**.
- Reasignar departamento (P4) requiere **motivo obligatorio**.
- Firmar (P18) no requiere motivo, aunque se recomienda registrar una
  observación.

### Restricción de no duplicidad

- No puede firmarse una solicitud que ya fue firmada.
- No puede rechazarse una solicitud que ya fue rechazada o firmada.
- No puede devolverse una solicitud que ya fue devuelta por el flujo ordinario.

### Restricción de intervención

El Despacho del Alcalde no puede intervenir en solicitudes que no hayan sido
escaladas por el Departamento. No puede iniciar revisión, aprobar a nivel
departamental ni reemplazar la decisión departamental.

### Restricción de edición

La edición de solicitudes (P3) solo está disponible en E6
(`awaiting_mayor_signature`). No se permite modificar solicitudes que están
siendo revisadas por el Departamento o que ya tienen un resultado registrado,
salvo la reasignación explícita permitida en E2.

## Reglas de validación

El flujo de autorización para una acción del Despacho del Alcalde debe seguir
este orden:

1. El usuario está autenticado (JWT válido).
2. El usuario tiene rol `MAYOR_OFFICE` activo.
3. El rol tiene el permiso requerido para la acción.
4. El usuario tiene alcance global sobre la solicitud (sin restricción de
   departamento).
5. La solicitud está en un estado compatible con el permiso (según la matriz
   permiso-estado de este documento).
6. Si la acción requiere motivo obligatorio (devolución, rechazo, reasignación),
   el motivo está presente.
7. Si la acción requiere datos adicionales (firmante, departamento destino), los
   datos son válidos.
8. Se registra el evento de auditoría correspondiente.

Si cualquiera de las validaciones falla, la operación debe rechazarse con el
código HTTP y mensaje de error definidos en el contrato técnico.

## Errores esperados

| Escenario | Código HTTP | Mensaje |
|---|---|---|
| Acción sin permiso | 403 | `PERMISSION_DENIED` |
| Estado incompatible con la acción | 409 | `INVALID_TRANSITION` |
| Solicitud inexistente | 404 | `REQUEST_NOT_FOUND` |
| Motivo de devolución obligatorio ausente | 400 | `RETURN_REASON_REQUIRED` |
| Motivo de rechazo obligatorio ausente | 400 | `REJECTION_REASON_REQUIRED` |
| Motivo de reasignación obligatorio ausente | 400 | `REASSIGNMENT_REASON_REQUIRED` |
| Intento de firma sin estar en E6 | 409 | `ACTION_NOT_ALLOWED_IN_CURRENT_STATE` |
| Solicitud ya firmada | 409 | `ALREADY_SIGNED` |
| Departamento destino inválido o inactivo | 400 | `INVALID_DEPARTMENT` |
| Fecha límite en el pasado | 400 | `INVALID_DEADLINE` |

## Eventos de auditoría asociados

| Acción | Estado origen | Estado destino | Evento | Motivo / Observación |
|---|---|---|---|---|
| Reasignar departamento | E6 / E2 | E2 | `DEPARTMENT_REASSIGNED` | Motivo obligatorio |
| Devolver al departamento | E6 | E7 | `REQUEST_RETURNED_TO_DEPARTMENT` | Motivo obligatorio |
| Rechazar desde alcaldía | E6 | E8 | `REQUEST_REJECTED_BY_MAYOR_OFFICE` | Motivo obligatorio |
| Firmar | E6 | E9 | `REQUEST_SIGNED` | Observación opcional |
| Cerrar | E8 / E9 | E10 | `REQUEST_CLOSED` | Observación opcional |
| Agregar observación | E6 | — | `REQUEST_INTERNAL_OBSERVATION_ADDED` | Observación obligatoria |
| Editar solicitud | E6 | — | `STATUS_CHANGED` solo si cambia estado | Según política de auditoría |

## Reglas de firma

| Aspecto | Descripción |
|---|---|
| **Permiso requerido** | `requests:sign` (P18) |
| **Estado requerido** | `awaiting_mayor_signature` (E6) |
| **Motivo** | No obligatorio |
| **Datos registrados** | `signed_at`, `signed_by_id` |
| **Evento** | `REQUEST_SIGNED` |
| **Validaciones** | Usuario autenticado, permiso explícito, estado compatible, no duplicidad |
| **Restricción** | No puede firmarse una segunda vez por el flujo ordinario |

## Reglas de devolución

| Aspecto | Descripción |
|---|---|
| **Permiso requerido** | `requests:return_to_department` (P15) |
| **Estado requerido** | `awaiting_mayor_signature` (E6) |
| **Motivo** | **Obligatorio** |
| **Estado destino** | `returned_to_department` (E7) |
| **Evento** | `REQUEST_RETURNED_TO_DEPARTMENT` |
| **Validaciones** | Usuario autenticado, permiso, estado compatible, motivo presente |
| **Restricción** | El despacho no puede firmar mientras la solicitud esté devuelta |

## Reglas de rechazo

| Aspecto | Descripción |
|---|---|
| **Permiso requerido** | `requests:reject_mayor_office` (P17) |
| **Estado requerido** | `awaiting_mayor_signature` (E6) |
| **Motivo** | **Obligatorio** |
| **Estado destino** | `rejected_by_mayor_office` (E8) |
| **Evento** | `REQUEST_REJECTED_BY_MAYOR_OFFICE` |
| **Validaciones** | Usuario autenticado, permiso, estado compatible, motivo presente |
| **Restricción** | No vuelve al departamento por el flujo ordinario |

## Cobertura de criterios de aceptación

- [x] Se definieron los permisos necesarios para Alcaldía (10 permisos: P3–P7,
  P9, P15, P17–P19).
- [x] Se definieron las acciones permitidas para Alcaldía (editar, reasignar,
  cambiar prioridad/fecha, consultar, devolver, rechazar, firmar, cerrar).
- [x] Está documentado el alcance de acceso (global, sin restricción de
  departamento).
- [x] Está documentado qué estados permiten intervención de Alcaldía
  (principalmente E6, con excepciones documentadas en la matriz).
- [x] La acción de firma tiene permisos definidos (P18 — `requests:sign`).
- [x] La acción de devolución tiene permisos definidos (P15 —
  `requests:return_to_department`).
- [x] La acción de rechazo tiene permisos definidos (P17 —
  `requests:reject_mayor_office`).
- [x] Las validaciones previas a la firma están documentadas (5 validaciones).
- [x] Las validaciones para devolución están documentadas (motivo obligatorio,
  estado compatible).
- [x] Las validaciones para rechazo están documentadas (motivo obligatorio,
  estado compatible).
- [x] Cada permiso está asociado a una transición válida (matriz permiso-estado
  y reglas por permiso).
- [x] Las acciones coinciden con las transiciones definidas en la Issue 3
  (alineación con `sprint-03-official-states.md`).

## Historial de cambios

| Fecha | Cambio | Autor |
|---|---|---|
| 2026-06-13 | Creación inicial de la matriz de permisos del Despacho del Alcalde | Anton |
