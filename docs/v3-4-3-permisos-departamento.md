# V3-4.3 Matriz de permisos del Departamento — Sprint 3

## Proposito

Este documento define los permisos, restricciones, alcance departamental y
comportamiento por estado del actor **Personal de Departamento**
(`DEPARTMENT_STAFF`) dentro del Sprint 3.

Complementa la matriz oficial de permisos (`docs/sprint-03-permission-matrix.md`)
y las transiciones departamentales (`docs/v3-3-3-definir-transiciones-departamento.md`)
con la granularidad necesaria para implementar autorización.

Este documento es funcional. No implementa tablas, migraciones, guards,
decoradores ni lógica de autorización.

## Fuentes

- `docs/sprint-03-permission-matrix.md` — Catálogo de 24 permisos y matriz
  rol-permiso.
- `docs/sprint-03-official-roles.md` — Responsabilidades y restricciones del
  Personal de Departamento.
- `docs/v3-3-3-definir-transiciones-departamento.md` — Transiciones
  departamentales, alcance y eventos.
- `docs/sprint-03-official-states.md` — Comportamiento detallado de cada estado
  del catálogo oficial.
- `docs/sprint-03-gap-analysis.md` — Análisis de brecha del backend actual.

## Rol: DEPARTMENT_STAFF

| Atributo | Valor |
|---|---|
| Código técnico | `DEPARTMENT_STAFF` |
| Actor funcional | Personal de Departamento |
| Departamento requerido | **Sí** — obligatorio y activo |
| Alcance principal | Solicitudes del departamento asociado |

El Personal de Departamento representa al personal que analiza y decide
solicitudes dentro de una unidad organizacional de la alcaldía.

El departamento concreto es un dato asociado al usuario, no una variante del
rol. Dos usuarios pueden tener el mismo rol y pertenecer a departamentos
diferentes, por lo que tendrán las mismas capacidades generales sobre conjuntos
distintos de solicitudes.

## Permisos asignados

El Personal de Departamento recibe los siguientes permisos del catálogo oficial:

| # | Código técnico | Descripción | Acción protegida |
|---|---|---|---|
| P8 | `requests:view_own_department` | Consultar solicitudes del propio departamento | GET /requests (departamental) |
| P9 | `requests:view_audit` | Consultar el historial y auditoría de solicitudes del departamento | GET /requests/:id/history |
| P10 | `requests:mark_viewed` | Marcar una solicitud como vista | POST /requests/:id/viewed |
| P11 | `requests:start_review` | Iniciar la revisión de una solicitud | POST /requests/:id/start-review |
| P12 | `requests:approve_department` | Aprobar una solicitud a nivel departamental | POST /requests/:id/approve |
| P13 | `requests:reject_department` | Rechazar una solicitud a nivel departamental | POST /requests/:id/reject |
| P14 | `requests:send_to_mayor_office` | Enviar una solicitud al despacho del alcalde | POST /requests/:id/send-to-mayor |

### Notas sobre permisos departamentales

- Los permisos P11–P14 tienen **alcance departamental**: validan
  `user.departmentId == request.departmentId`.
- El permiso P9 (`requests:view_audit`) tiene alcance **departamental** para
  DEPARTMENT_STAFF: solo puede consultar el historial de solicitudes de su
  propio departamento.
- Tener un permiso no elimina las validaciones de estado, departamento o
  propiedad del recurso.

### Acción sin cambio de estado: agregar observación interna

| Aspecto | Descripción |
|---|---|
| **Acción** | Agregar observación interna a una solicitud del departamento |
| **Actor** | `DEPARTMENT_STAFF` (del departamento asignado) |
| **Cambia estado** | **No** |
| **Permiso implícito** | Asociado a la capacidad operativa del departamento |
| **Evento** | `REQUEST_INTERNAL_OBSERVATION_ADDED` |
| **Estados donde aplica** | `assigned_to_department`, `in_review`, `returned_to_department` |

### Acción sin cambio de estado: marcar como vista

| Aspecto | Descripción |
|---|---|
| **Acción** | Marcar solicitud como vista |
| **Cambia estado** | **No** |
| **Efecto** | Registra `viewed_at` cuando corresponda; genera `REQUEST_VIEWED` |
| **Estados donde aplica** | `assigned_to_department`, `returned_to_department` |

## Acciones bloqueadas

El Personal de Departamento **no puede** ejecutar las siguientes acciones bajo
ninguna circunstancia:

| # | Acción bloqueada | Actor responsable | Motivo del bloqueo |
|---|---|---|---|
| P1 | `requests:create` | Secretaria | La recepción es función de Secretaria |
| P2 | `requests:upload_documents` | Secretaria | La carga documental corresponde a Secretaria |
| P3 | `requests:update` | Secretaria / Despacho | Los datos iniciales son responsabilidad de Secretaria |
| P4 | `requests:assign_department` | Secretaria / Despacho | La asignación inicial corresponde a Secretaria; la reasignación al Despacho |
| P5 | `requests:set_priority` | Secretaria / Despacho | La prioridad la define Secretaria o el Despacho |
| P6 | `requests:set_deadline` | Secretaria / Despacho | La fecha límite la define Secretaria o el Despacho |
| P7 | `requests:view_all` | Secretaria (seguimiento) / Despacho | El alcance departamental no permite visión global |
| P15 | `requests:return_to_department` | Despacho del Alcalde | La devolución es una decisión superior |
| P16 | `requests:approve_mayor_office` | — | No existe como permiso activo en el catálogo |
| P17 | `requests:reject_mayor_office` | Despacho del Alcalde | El rechazo superior corresponde al Despacho |
| P18 | `requests:sign` | Despacho del Alcalde | La firma lógica requiere permiso explícito de firma |
| P19 | `requests:close` | Secretaria / Despacho (según permiso) | El cierre administrativo corresponde a otros actores |
| P20–24 | `users:*` | Administrador | Gestión de usuarios es función del Administrador |

### Otras acciones bloqueadas

| Acción bloqueada | Justificación |
|---|---|
| Aprobar o rechazar sin estar en `in_review` | Las decisiones requieren que la solicitud esté en revisión formal |
| Aprobar o rechazar solicitudes de otro departamento | El alcance departamental lo impide |
| Cambiar estado genérico (`statusId` arbitrario) | No se permite enviar `statusId` arbitrario |
| Modificar solicitudes fuera de su competencia | Las modificaciones ajenas al alcance departamental están bloqueadas |
| Modificar datos iniciales del ciudadano | Los datos iniciales son responsabilidad de Secretaria |
| Asignar roles o permisos | Gestión de accesos es función del Administrador |

## Alcance de consulta

| Tipo de consulta | Alcance del Departamento |
|---|---|
| Solicitudes del propio departamento (E2–E10) | Acceso completo según estado y permiso |
| Solicitudes donde `request.departmentId == user.departmentId` | Operativo y de consulta |
| Solicitudes de otro departamento | **Sin acceso** — ni consulta ni operación |
| Historial y auditoría de solicitudes del propio departamento | Acceso departamental (solo solicitudes del área) |

El Personal de Departamento **no** puede:

- Consultar solicitudes de otros departamentos aunque conozca su identificador.
- Consultar datos de solicitudes que nunca estuvieron asignadas a su
  departamento.
- Consultar información interna de otros departamentos.

## Comportamientos especiales

### Usuario sin departamento

| Condición | Efecto |
|---|---|
| Usuario autenticado sin `departmentId` | Puede autenticarse, pero **no puede consultar ni operar** solicitudes departamentales. La API debe responder con error de configuración inválida. |
| Resolución | Administración debe corregir la asignación del usuario. |

### Departamento inactivo

| Condición | Efecto |
|---|---|
| Usuario con `departmentId` de un departamento inactivo | **No puede consultar ni operar** solicitudes departamentales. La API debe denegar el acceso. |
| Resolución | Administración debe reactivar el departamento o reasignar al usuario. |

### Solicitud de otro departamento

| Condición | Efecto |
|---|---|
| `request.departmentId != user.departmentId` | El usuario **no puede consultar ni operar** la solicitud, incluso si conoce su identificador. La API debe responder con 403/404. |
| Excepción | Ninguna durante el MVP, salvo permiso especial aprobado posteriormente. |

### Solicitud reasignada

| Condición | Efecto |
|---|---|
| La solicitud fue reasignada a otro departamento | El departamento anterior **pierde acceso inmediato**. El nuevo departamento adquiere acceso completo según permisos. |
| Historial | El departamento anterior **pierde acceso** aunque haya participado en el historial. |
| Reasignación desde Despacho | Cambia a `assigned_to_department` del nuevo departamento. El nuevo departamento puede iniciar revisión. |

## Relación de permisos con estados

La siguiente tabla define en qué estados del ciclo de vida de la solicitud
puede el Personal de Departamento ejercer cada permiso.

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

### Matriz permiso-estado para DEPARTMENT_STAFF

| Permiso | E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8 | E9 | E10 |
|---|---|---|---|---|---|---|---|---|---|---|
| `requests:view_own_department` | No | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `requests:view_audit` (departamental) | No | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `requests:mark_viewed` | No | Sí | No | No | — | — | Sí | — | — | — |
| `requests:start_review` | No | Sí | No | — | — | — | Sí | — | — | — |
| `requests:approve_department` | No | No | Sí | — | — | — | No | — | — | — |
| `requests:reject_department` | No | No | Sí | — | — | — | No | — | — | — |
| `requests:send_to_mayor_office` | No | No | Sí | — | — | — | No | — | — | — |

**Leyenda:**
- **Sí** — Permiso disponible en ese estado.
- **No** — Permiso bloqueado en ese estado.
- **—** — Estado no aplicable o no alcanzable desde ese permiso.
- Estados terminales (E5, E8, E10): solo lectura del propio departamento, sin
  operaciones.

### Reglas por permiso

#### P8 — `requests:view_own_department`

- Disponible para todas las solicitudes donde `request.departmentId == user.departmentId`,
  independientemente del estado.
- No disponible en E1 (`received`) porque la solicitud aún no tiene departamento
  asignado.
- El permiso por sí solo no permite acciones operativas sobre la solicitud.
- La respuesta debe incluir datos básicos, estado actual, prioridad, fecha
  límite y fechas operativas.

#### P9 — `requests:view_audit` (departamental)

- Disponible para el historial de solicitudes del propio departamento en
  cualquier estado (E2–E10).
- No incluye historial de solicitudes de otros departamentos.
- La respuesta debe incluir todos los eventos del ciclo de vida de la solicitud.
- Las observaciones internas del departamento son visibles para todo el
  personal del mismo departamento.

#### P10 — `requests:mark_viewed`

- Disponible en E2 (`assigned_to_department`) y E7 (`returned_to_department`).
- No cambia el estado de la solicitud.
- Registra `viewed_at` y genera `REQUEST_VIEWED`.
- Marcar como vista después de una devolución (E7) puede generar un nuevo
  evento, pero no cambia el estado.

#### P11 — `requests:start_review`

- Disponible en E2 (`assigned_to_department`) y E7 (`returned_to_department`).
- Transiciona la solicitud a `in_review`.
- Requiere que el usuario pertenezca al departamento asignado.
- Registra `review_started_at` y genera `REQUEST_REVIEW_STARTED`.
- No puede iniciar revisión sobre solicitudes de otro departamento.

#### P12 — `requests:approve_department`

- Disponible solo en E3 (`in_review`).
- Requiere que la solicitud no cumpla un criterio de intervención obligatoria
  del Despacho del Alcalde.
- Requiere que el usuario pertenezca al departamento asignado.
- Transiciona a `approved_by_department`.
- Registra `decision_at` y genera `REQUEST_APPROVED_BY_DEPARTMENT`.
- No puede ejecutarse sin haber iniciado revisión formalmente.

#### P13 — `requests:reject_department`

- Disponible solo en E3 (`in_review`).
- Requiere motivo obligatorio de rechazo.
- Requiere que el usuario pertenezca al departamento asignado.
- Transiciona a `rejected_by_department`.
- Registra `decision_at`, `rejection_reason` y genera
  `REQUEST_REJECTED_BY_DEPARTMENT`.

#### P14 — `requests:send_to_mayor_office`

- Disponible solo en E3 (`in_review`).
- Requiere causa de intervención documentada del Despacho del Alcalde.
- Transiciona a `awaiting_mayor_signature`.
- Genera `REQUEST_SENT_TO_MAYOR_OFFICE`.
- La solicitud no puede enviarse al despacho desde `approved_by_department` o
  `rejected_by_department`.

## Restricciones funcionales

### Restricción de departamento

El Personal de Departamento solo puede operar solicitudes donde
`request.departmentId == user.departmentId`. Ningún permiso por sí solo puede
eludir esta validación.

### Restricción de competencia

El Personal de Departamento no debe modificar solicitudes fuera de su
competencia. Las acciones de edición de datos iniciales, prioridad, fecha
límite y asignación de departamento corresponden a Secretaria o al Despacho,
no al departamento.

### Restricción de estado para decisiones

Aprobar, rechazar o enviar al despacho solo es posible cuando la solicitud está
en `in_review`. No pueden ejecutarse decisiones sin haber iniciado la revisión
formalmente.

### Restricción de motivo para rechazo

El rechazo departamental requiere un motivo obligatorio documentado. La
aprobación y el envío al despacho no lo requieren, aunque se recomienda
registrar una observación.

### Restricción de reapertura

Una vez aprobada (`approved_by_department`), rechazada (`rejected_by_department`)
o escalada (`awaiting_mayor_signature`), la solicitud no puede volver a
revisión departamental sin un proceso de reapertura que queda fuera del MVP.

### Distribución interna de trabajo

La asignación opcional a un usuario específico (`user_assigned_id`) puede
utilizarse para distribuir trabajo interno dentro del departamento, pero **no
reemplaza el alcance departamental**. Todos los usuarios del departamento
pueden operar todas las solicitudes de su área. La permanencia de
`user_assigned_id` debe resolverse en el diseño de datos.

### Visibilidad de observaciones internas

- Las observaciones internas del departamento son visibles para todo el
  personal del mismo departamento.
- Las observaciones registradas por Secretaria son visibles para el
  departamento.
- Las observaciones registradas por el Despacho del Alcalde pueden ser
  visibles o no según el permiso definido en la Issue 5.

## Reglas de validación

El flujo de autorización para una acción del Personal de Departamento debe
seguir este orden:

1. El usuario está autenticado (JWT válido).
2. El usuario tiene rol `DEPARTMENT_STAFF` activo.
3. El rol tiene el permiso requerido para la acción.
4. El usuario tiene un `departmentId` activo y válido.
5. La solicitud está asignada al departamento del usuario
   (`request.departmentId == user.departmentId`).
6. La solicitud está en un estado compatible con el permiso (según la matriz
   permiso-estado de este documento).
7. Los datos obligatorios para la acción están presentes (motivo de rechazo,
   causa de intervención, etc.).
8. Se registra el evento de auditoría correspondiente.

Si cualquiera de las validaciones falla, la operación debe rechazarse con el
código HTTP y mensaje de error definidos en el contrato técnico.

## Errores esperados

| Escenario | Código HTTP | Mensaje |
|---|---|---|
| Acción sin permiso | 403 | `PERMISSION_DENIED` |
| Estado incompatible con la acción | 409 | `INVALID_TRANSITION` |
| Solicitud inexistente | 404 | `REQUEST_NOT_FOUND` |
| Solicitud de otro departamento | 403 | `DEPARTMENT_MISMATCH` |
| Usuario sin departamento | 403 | `USER_HAS_NO_DEPARTMENT` |
| Departamento inactivo | 403 | `DEPARTMENT_INACTIVE` |
| Motivo de rechazo obligatorio ausente | 400 | `REJECTION_REASON_REQUIRED` |
| Intento de decisión sin estar en `in_review` | 409 | `ACTION_NOT_ALLOWED_IN_CURRENT_STATE` |

## Cobertura de criterios de aceptación

- [x] El personal departamental solo puede ver solicitudes de su departamento
  (P8 — `requests:view_own_department`).
- [x] El personal departamental solo puede operar solicitudes de su
  departamento (alcance departamental obligatorio).
- [x] El usuario departamental requiere `departmentId` (obligatorio y activo).
- [x] El permiso por sí solo no evita la validación de `departmentId` (regla
  de validación paso 5).
- [x] Está definido el comportamiento cuando el usuario no tiene departamento
  (error `USER_HAS_NO_DEPARTMENT`).
- [x] Está definido el comportamiento cuando el departamento está inactivo
  (error `DEPARTMENT_INACTIVE`).
- [x] Está definido el comportamiento cuando la solicitud pertenece a otro
  departamento (error `DEPARTMENT_MISMATCH`).
- [x] Está definido el comportamiento cuando la solicitud fue reasignada
  (acceso transferido al nuevo departamento; el anterior pierde acceso).
- [x] Se definió que todos los usuarios del departamento pueden operar todas
  sus solicitudes (distribución interna no reemplaza alcance departamental).
- [x] El personal departamental puede marcar solicitudes como vistas (P10).
- [x] El personal departamental puede iniciar revisión (P11).
- [x] El personal departamental puede aprobar a nivel departamental (P12).
- [x] El personal departamental puede rechazar a nivel departamental (P13).
- [x] El personal departamental puede enviar solicitudes a Alcaldía (P14).
- [x] El personal departamental no puede firmar (acción bloqueada P18).
- [x] El personal departamental no puede administrar usuarios (P20–24
  bloqueados).
- [x] El personal departamental no tiene acceso global (P7 bloqueado).
- [x] Las acciones coinciden con las transiciones departamentales definidas en
  la Issue 3 (V3-3.3 — validado en §10 de las transiciones).

## Historial de cambios

| Fecha | Cambio | Autor |
|---|---|---|
| 2026-06-13 | Creación inicial de la matriz de permisos del Departamento | Anton |
