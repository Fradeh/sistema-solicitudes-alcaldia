# V3-4.2 Matriz de permisos de Secretaria — Sprint 3

## Proposito

Este documento define los permisos, restricciones, alcance de consulta y
comportamiento por estado del actor **Secretaria** (`SECRETARY`) dentro del
Sprint 3.

Complementa la matriz oficial de permisos (`docs/sprint-03-permission-matrix.md`)
y define con mayor granularidad como se aplica cada permiso a las operaciones
de Secretaria.

Este documento es funcional. No implementa tablas, migraciones, guards,
decoradores ni logica de autorizacion.

## Fuentes

- `docs/sprint-03-permission-matrix.md` — Catalogo de 24 permisos y matriz
  rol-permiso.
- `docs/sprint-03-official-roles.md` — Responsabilidades y restricciones de
  Secretaria.
- `docs/sprint-03-gap-analysis.md` — Analisis de brecha del backend actual.
- Catalogo de estados oficiales del Sprint 3 (Issue 3).

## Rol: SECRETARY

| Atributo | Valor |
|---|---|
| Codigo tecnico | `SECRETARY` |
| Actor funcional | Secretaria |
| Departamento requerido | No |
| Alcance principal | Recepcion, registro y seguimiento autorizado |

Secretaria funciona como **ventanilla unica**: es el unico punto de contacto
inicial con el ciudadano y la responsable del registro, documentos y asignacion
inicial.

Secretaria no requiere departamento asociado. Su alcance de consulta es global
limitado a seguimiento, sin capacidad de decision operativa sobre solicitudes
de otros departamentos.

## Permisos asignados

Secretaria recibe los siguientes permisos del catalogo oficial:

| # | Codigo tecnico | Descripcion | Accion protegida |
|---|---|---|---|
| P1 | `requests:create` | Crear una solicitud ciudadana | POST /requests |
| P2 | `requests:upload_documents` | Subir documentos asociados a una solicitud | POST /requests/:id/documents |
| P3 | `requests:update` | Editar campos autorizados de una solicitud | PATCH /requests/:id |
| P4 | `requests:assign_department` | Asignar o reasignar departamento responsable | PATCH /requests/:id/assign-department |
| P5 | `requests:set_priority` | Definir o cambiar la prioridad | PATCH /requests/:id/priority |
| P6 | `requests:set_deadline` | Definir o cambiar la fecha limite | PATCH /requests/:id/deadline |
| P7 | `requests:view_all` | Consultar solicitudes de todos los departamentos | GET /requests |
| P9 | `requests:view_audit` | Consultar el historial y auditoria de una solicitud | GET /requests/:id/history |

### Notas sobre permisos de seguimiento

Los permisos `requests:view_all` y `requests:view_audit` estan asignados a
Secretaria con la modalidad **Seguimiento**. Esto significa que:

- Secretaria puede consultar solicitudes de cualquier departamento.
- Secretaria puede consultar el historial y auditoria de cualquier solicitud.
- Esta visibilidad no otorga permisos operativos ni de decision.
- El proposito es permitir que Secretaria responda al ciudadano sobre el
  estado de su solicitud, sin necesidad de conocer a que departamento fue
  asignada ni depender del departamento del usuario.

## Acciones bloqueadas

Secretaria no puede ejecutar las siguientes acciones bajo ninguna
circunstancia:

| # | Codigo tecnico | Motivo del bloqueo |
|---|---|---|
| P8 | `requests:view_own_department` | No aplica porque Secretaria no tiene `departmentId` como restriccion |
| P10 | `requests:mark_viewed` | Marcar como vista es responsabilidad del Departamento |
| P11 | `requests:start_review` | Iniciar revision es responsabilidad del Departamento |
| P12 | `requests:approve_department` | Decision departamental exclusiva del Departamento |
| P13 | `requests:reject_department` | Decision departamental exclusiva del Departamento |
| P14 | `requests:send_to_mayor_office` | Escalamiento al despacho exclusivo del Departamento |
| P15 | `requests:return_to_department` | Decision del Despacho del Alcalde |
| P16 | `requests:approve_mayor_office` | No existe como permiso activo en el catalogo |
| P17 | `requests:reject_mayor_office` | Decision del Despacho del Alcalde |
| P18 | `requests:sign` | Firma exclusiva del Despacho del Alcalde |
| P19 | `requests:close` | Cierre exclusivo del Despacho del Alcalde (por definir en Issue 3) |
| P20-24 | `users:*` | Administracion de usuarios exclusiva de ADMIN |

## Alcance de consulta

| Tipo de consulta | Alcance de Secretaria |
|---|---|
| Solicitudes creadas por ella misma | Acceso completo (lectura y edicion segun estado) |
| Solicitudes creadas por otra Secretaria | Acceso de seguimiento (lectura, sin edicion) |
| Solicitudes de cualquier departamento | Acceso de seguimiento (lectura) |
| Historial y auditoria de cualquier solicitud | Acceso de seguimiento (lectura) |

Secretaria **no** puede:

- Consultar datos internos no necesarios para el seguimiento al ciudadano.
- Consultar observaciones internas del Departamento o del Despacho.
- Consultar datos de contacto del ciudadano si no fue ella quien registro la
  solicitud.

### Regla de visibilidad de observaciones internas

Secretaria puede ver observaciones internas que ella misma haya registrado.
Las observaciones internas registradas por Departamento o Despacho no son
visibles para Secretaria, a menos que un permiso adicional se lo conceda.

## Relacion de permisos con estados

La siguiente tabla define en que estados del ciclo de vida de la solicitud
puede Secretaria ejercer cada permiso.

### Estados del catalogo oficial

| # | Codigo tecnico | Etiqueta | Tipo |
|---|---|---|---|
| E1 | `received` | Recibida | Inicial |
| E2 | `assigned_to_department` | Asignada a departamento | Operativo |
| E3 | `in_review` | En revision | Operativo |
| E4 | `approved_by_department` | Aprobada por departamento | Operativo |
| E5 | `rejected_by_department` | Rechazada por departamento | Terminal |
| E6 | `awaiting_mayor_signature` | Pendiente de firma del alcalde | Operativo |
| E7 | `returned_to_department` | Devuelta al departamento | Operativo |
| E8 | `rejected_by_mayor_office` | Rechazada por alcaldia | Terminal |
| E9 | `signed` | Firmada | Operativo |
| E10 | `closed` | Cerrada | Terminal |

### Matriz permiso-estado para Secretaria

| Permiso | E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8 | E9 | E10 |
|---|---|---|---|---|---|---|---|---|---|---|
| `requests:create` | Si | - | - | - | - | - | - | - | - | - |
| `requests:upload_documents` | Si | Si | Si | No | No | No | Si | No | No | No |
| `requests:update` | Si | Si | No | No | No | No | Si | No | No | No |
| `requests:assign_department` | Si | Si | No | No | - | No | Si | - | No | - |
| `requests:set_priority` | Si | Si | No | No | - | No | Si | - | No | - |
| `requests:set_deadline` | Si | Si | No | No | - | No | Si | - | No | - |
| `requests:view_all` | Si | Si | Si | Si | Si | Si | Si | Si | Si | Si |
| `requests:view_audit` | Si | Si | Si | Si | Si | Si | Si | Si | Si | Si |

**Leyenda:**
- **Si** — Permiso disponible en ese estado.
- **No** — Permiso bloqueado en ese estado.
- **—** — Estado no aplicable o no alcanzable desde ese permiso.
- Estados terminales (E5, E8, E10): solo lectura, sin modificaciones.

### Reglas por permiso

#### P1 — `requests:create`

- Solo disponible en el momento de creacion de la solicitud.
- No existe solicitud previa sobre la cual aplicar este permiso.
- La solicitud se crea siempre en estado `received`.
- No se permite seleccionar un `statusId` inicial.
- El `departmentId` no es obligatorio al crear.
- `received` es un estado transitorio: si Secretaria asigna departamento
  durante el registro, la solicitud pasa directamente a
  `assigned_to_department` como parte de una sola transaccion.

#### P2 — `requests:upload_documents`

- Disponible mientras la solicitud este en estados editables por Secretaria.
- Bloqueado cuando el Departamento inicio revision (E3) o la solicitud esta
  en estados donde solo el Despacho interviene (E4, E6, E9).
- Reactivado si la solicitud es devuelta al departamento (E7), permitiendo
  que Secretaria adjunte documentos adicionales si la politica lo permite.

#### P3 — `requests:update`

- Permite editar datos iniciales de la solicitud: nombre del ciudadano,
  descripcion, categoria, datos de contacto y documento de identidad.
- No permite editar campos que hayan sido modificados por otros actores.
- Bloqueado cuando la solicitud esta `in_review` o en adelante (E3-E10),
  salvo devolucion (E7) donde se rehabilita parcialmente.

#### P4 — `requests:assign_department`

- Asigna el departamento responsable por primera vez.
- Si se asigna departamento durante el mismo flujo de creacion, la solicitud
  transiciona de `received` a `assigned_to_department` en una sola
  transaccion, registrando los eventos `REQUEST_CREATED` y
  `DEPARTMENT_ASSIGNED` atomicamente.
- La reasignacion solo esta permitida si la solicitud esta en `received` (E1)
  o `assigned_to_department` (E2), o si fue devuelta al departamento (E7).
- No permite reasignar si el Departamento ya inicio revision (E3).
- No permite reasignar si la solicitud esta en el Despacho (E6, E8, E9).
- La reasignacion desde Secretaria cambia inmediatamente el departamento
  responsable y registra el evento `DEPARTMENT_REASSIGNED` en auditoria.

#### P5 — `requests:set_priority`

- Disponible en los mismos estados que `requests:assign_department`.
- Secretaria puede definir o modificar la prioridad de la solicitud.
- Una vez que el Departamento inicia revision (E3), Secretaria no puede
  modificar la prioridad.
- Si la solicitud es devuelta (E7), Secretaria puede redefinir la prioridad.

#### P6 — `requests:set_deadline`

- Mismas reglas que `requests:set_priority`.
- Secretaria define la fecha limite para la resolucion de la solicitud.
- La fecha limite debe ser igual o posterior a la fecha actual.

#### P7 — `requests:view_all`

- Permite consultar cualquier solicitud independientemente del departamento.
- La respuesta debe excluir observaciones internas del Departamento y del
  Despacho si Secretaria no tiene un permiso adicional.
- La respuesta debe incluir datos basicos de la solicitud, estado actual,
  departamento asignado, prioridad, fecha limite y fechas operativas.

#### P9 — `requests:view_audit`

- Permite consultar el historial completo de eventos de cualquier solicitud
para responder al ciudadano.
- La respuesta debe incluir todos los eventos del ciclo de vida, incluyendo
  decisiones departamentales, firmas y cierre.
- No debe exponer datos de contacto directo del ciudadano, observaciones
  internas no propias ni metadata interna del Departamento o Despacho que
  no sea relevante para el seguimiento ciudadano.

## Restricciones funcionales

### Restriccion de edicion por estado

Secretaria no puede editar datos iniciales, prioridad, fecha limite ni
departamento de una solicitud que se encuentre en `in_review` (E3) o
estados posteriores, salvo `returned_to_department` (E7).

### Restriccion de reasignacion

Secretaria puede reasignar una solicitud a otro departamento unicamente si:

1. La solicitud esta en estado `received`, `assigned_to_department` o
   `returned_to_department`.
2. El departamento destino existe y esta activo.
3. Se registra el evento `DEPARTMENT_REASSIGNED` con el departamento
   anterior y nuevo.
4. No se requiere motivo obligatorio para la reasignacion desde Secretaria,
   aunque puede registrarse una observacion opcional.

### Restriccion de observaciones internas

Secretaria puede agregar observaciones internas mediante el permiso
implicito de `requests:update` o un endpoint especifico. Las observaciones
de Secretaria:

- Son visibles para Departamento y Despacho.
- No son visibles para otras Secretarias a menos que compartan seguimiento.
- Quedan registradas en auditoria con el evento `INTERNAL_OBSERVATION` y
  el identificador de la Secretaria autora.

### Restriccion de documentos

Secretaria puede subir documentos en los estados permitidos (E1, E2, E3,
E7). Los documentos:

- Se asocian a la solicitud.
- Quedan registrados con el evento `DOCUMENT_UPLOADED`.
- Secretaria puede consultar los documentos que ella misma subio.
- Secretaria puede consultar documentos subidos por otros actores si tiene
  permiso de lectura sobre la solicitud.

## Reglas de validacion

El flujo de autorizacion para una accion de Secretaria debe seguir este
orden:

1. El usuario esta autenticado (JWT valido).
2. El usuario tiene rol `SECRETARY` activo.
3. El rol tiene el permiso requerido para la accion.
4. La solicitud esta en un estado compatible con el permiso (segun la matriz
   permiso-estado de este documento).
5. Si la accion modifica la solicitud, se verifica que Secretaria sea la
   creadora de la solicitud o que el estado permita la edicion por
   seguimiento.
6. Los datos obligatorios para la accion estan presentes.
7. Se registra el evento de auditoria correspondiente.

Si cualquiera de las validaciones falla, la operacion debe rechazarse con
el codigo HTTP y mensaje de error definidos en el contrato tecnico.

## Errores esperados

| Escenario | Codigo HTTP | Mensaje |
|---|---|---|
| Accion sin permiso | 403 | `PERMISSION_DENIED` |
| Estado incompatible con la accion | 409 | `INVALID_TRANSITION` |
| Solicitud inexistente | 404 | `REQUEST_NOT_FOUND` |
| Departamento destino invalido o inactivo | 400 | `INVALID_DEPARTMENT` |
| Fecha limite en el pasado | 400 | `INVALID_DEADLINE` |
| Edicion bloqueada por estado | 409 | `ACTION_NOT_ALLOWED_IN_CURRENT_STATE` |

## Cobertura de criterios de aceptacion

- [x] Secretaria puede registrar solicitudes (P1).
- [x] Secretaria puede dar seguimiento a solicitudes (P7, P9).
- [x] Secretaria puede subir documentos cuando corresponda (P2).
- [x] Secretaria puede asignar departamento bajo las reglas aprobadas (P4).
- [x] Secretaria puede reasignar departamento bajo las reglas aprobadas (P4).
- [x] Secretaria puede definir prioridad (P5).
- [x] Secretaria puede definir fecha limite (P6).
- [x] Secretaria puede agregar observaciones internas.
- [x] Las acciones de edicion tienen estados limite definidos (matriz
      permiso-estado).
- [x] El alcance de consulta de Secretaria esta documentado.
- [x] Secretaria no puede ejecutar aprobacion departamental.
- [x] Secretaria no puede ejecutar rechazo departamental.
- [x] Secretaria no puede ejecutar decisiones de Alcaldia.
- [x] Secretaria no puede firmar solicitudes.
- [x] Secretaria no puede administrar usuarios.
- [ ] La matriz coincide con el flujo definido en la Issue 3 (actividad de
      verificacion posterior, cuando las transiciones esten documentadas por
      la Issue 3).

## Historial de cambios

| Fecha | Cambio | Autor |
|---|---|---|
| 2026-06-10 | Creacion inicial de la matriz de permisos de Secretaria | Lucas-Santamaria-Create |
