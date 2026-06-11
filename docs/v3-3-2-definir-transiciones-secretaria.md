# V3-3.2 Definir las transiciones de Secretaría

## Metadatos

| Campo | Valor |
| --- | --- |
| **Revisor** | @Fradeh |
| **Tipo** | Diseño funcional |
| **Dependencias** | V3-3.1 — Documentar el catálogo técnico de estados; Matriz preliminar de permisos |
| **Fuentes** | `Alcaldía nuevo sprint.md`, `docs/sprint-03-official-roles.md`, `docs/sprint-03-permission-matrix.md`, `docs/sprint-03-official-states.md`, `docs/v3-5-2-consolidar-eventos-flujo-solicitudes.md` |

## Proposito

Este documento define las acciones que Secretaria puede realizar sobre una solicitud dentro del nuevo flujo operativo del Sprint 3. Documenta como se crea una solicitud, como se asigna a un departamento y que modificaciones iniciales puede realizar Secretaria antes de que la solicitud avance a etapas posteriores.

Deja claramente establecido que Secretaria no puede aprobar, rechazar ni firmar solicitudes, ya que esas acciones pertenecen a otros actores del flujo.

## Fuera de alcance

- Implementar endpoints de Secretaria.
- Implementar validaciones en codigo.
- Implementar eventos de auditoria.
- Implementar permisos.
- Implementar guardas de autorizacion.
- Crear migraciones.
- Modificar controladores.
- Implementar logica de transicion.

---

## Criterios de aceptacion

- [x] Secretaria no puede escoger el estado inicial de una solicitud.
- [x] Toda solicitud nueva inicia en `received`.
- [x] La transicion `received -> assigned_to_department` esta documentada.
- [x] La asignacion requiere departamento valido.
- [x] La asignacion requiere prioridad valida.
- [x] La asignacion requiere fecha limite valida.
- [x] Las modificaciones permitidas tienen limites definidos.
- [x] Secretaria no puede aprobar solicitudes.
- [x] Secretaria no puede rechazar solicitudes.
- [x] Secretaria no puede firmar solicitudes.
- [x] Cada accion permitida tiene un evento de auditoria asociado.
- [x] El diseno es compatible con la matriz preliminar de permisos.

---

## 1. Creacion de solicitudes

### Estado inicial obligatorio

Toda solicitud nueva debe crearse inicialmente en el estado `received`.

| Aspecto | Regla |
| --- | --- |
| **Estado inicial** | `received` (asignado automaticamente por el backend) |
| **Actor que crea** | Secretaria |
| **Puede escoger estado inicial** | **No**. Secretaria no puede seleccionar manualmente el estado. |
| **Puede enviar `statusId`** | **No**. El cliente no puede sustituir este estado durante la creacion. |

### Datos minimos requeridos al registrar

Para crear una solicitud, Secretaria debe registrar:

| Campo | Requerido | Observacion |
| --- | --- | --- |
| Datos del ciudadano | Si | Nombre, identificacion, contacto. |
| Datos de la solicitud | Si | Categoria, descripcion. |
| `departmentId` | No | Puede ser `null` en `received`. Se define al asignar. |
| Prioridad | No | Se define al asignar. Puede ser `null` en `received`. |
| Fecha limite | No | Se define al asignar. Puede ser `null` en `received`. |
| Documentos | No | Asociacion opcional de documentos recibidos o escaneados. |

### Datos generados automaticamente por el backend

| Campo | Generado por | Descripcion |
| --- | --- | --- |
| `tracking_code` | Backend | Codigo unico de seguimiento (ej. `TRK-XXXX-YYYY`). |
| `received_by_id` | Backend | Identificador del usuario Secretaria autenticado (del JWT). |
| `status` | Backend | Estado inicial `received`, no enviado por el cliente. |
| `created_at` | Backend | Fecha de creacion. |

### Comportamiento esperado

Mientras permanece en `received`, Secretaria puede:

- Completar o corregir los datos iniciales permitidos.
- Asociar documentos recibidos o escaneados.
- Preparar la delegacion definiendo departamento, prioridad y fecha limite.

La solicitud puede existir temporalmente sin `departmentId`, prioridad definitiva o fecha limite. Estos datos deben ser validos antes de ejecutar la asignacion formal.

---

## 2. Transicion principal: `received -> assigned_to_department`

### Accion

**Asignar departamento** (`requests:assign_department`).

Esta es la unica transicion de estado que Secretaria puede ejecutar desde `received`.

### Datos obligatorios para la asignacion

| Dato | Requisito | Validacion |
| --- | --- | --- |
| **Departamento** | Obligatorio | Debe ser un departamento activo y valido en el sistema. |
| **Prioridad** | Obligatorio | Debe corresponder a un valor valido del catalogo oficial (Baja, Media, Alta, Urgente). |
| **Fecha limite** | Obligatorio | Debe ser una fecha futura y valida. |

### Efecto de la transicion

- La solicitud pasa al estado `assigned_to_department`.
- Se registra `department_id` asignado.
- Se registra `priority` y `due_date` (fecha limite).
- Se registra `delegated_at` (fecha de delegacion).
- Se genera el evento de auditoria `REQUEST_DEPARTMENT_ASSIGNED`.
- El personal del departamento asignado queda habilitado para consultar y operar la solicitud.

### Restricciones de la transicion

- No puede ejecutarse si la solicitud ya fue asignada (salvo reasignacion desde el Despacho).
- No puede asignarse un departamento inactivo.
- No puede asignarse sin prioridad ni fecha limite.
- El cliente no puede enviar un `statusId` arbitrario para forzar la transicion.

---

## 3. Modificaciones permitidas por Secretaria

### Resumen de acciones permitidas

| Accion | Permiso tecnico | Estado(s) donde aplica | Alcance | Notas |
| --- | --- | --- | --- | --- |
| Crear solicitud | `requests:create` | Creacion | Ninguno | Siempre inicia en `received`. |
| Subir documentos | `requests:upload_documents` | `received` | Propio | Asociacion de documentos iniciales. |
| Editar campos autorizados | `requests:update` | `received` | Propio | Datos del ciudadano, descripcion, categoria. |
| Asignar departamento | `requests:assign_department` | `received` | Global | Transicion principal `received -> assigned_to_department`. |
| Definir prioridad | `requests:set_priority` | `received` | Propio | Tambien puede aplicarse durante la asignacion. |
| Definir fecha limite | `requests:set_deadline` | `received` | Propio | Tambien puede aplicarse durante la asignacion. |
| Consultar solicitudes | `requests:view_all` | Todos | Seguimiento | Alcance global para seguimiento. |
| Consultar auditoria | `requests:view_audit` | Todos | Seguimiento | Historial completo para responder al ciudadano. |
| Agregar observacion interna | `requests:update` / permiso futuro | `received` | Propio | Si la politica lo permite. |

### Limites de las modificaciones

| Regla | Descripcion |
| --- | --- |
| **Solo en `received`** | Secretaria puede editar datos iniciales libremente mientras la solicitud este en `received`. |
| **Restriccion post-asignacion** | Una vez asignada a un departamento (`assigned_to_department` o posterior), Secretaria no puede editar libremente la solicitud. |
| **Restriccion post-revision** | Si el departamento inicio formalmente la revision (`in_review` o posterior), Secretaria no puede modificar datos departamentales ni de decision. |
| **Reasignacion** | Secretaria puede reasignar departamento **solo si la solicitud aun no ha salido de `received`**. Reasignaciones posteriores corresponden al Despacho del Alcalde. |
| **Prioridad y fecha limite** | Pueden definirse en `received` o durante la asignacion. Si la solicitud ya avanzo, su modificacion queda restringida al actor responsable del estado actual (Departamento o Despacho). |

### Acciones que no cambian estado pero generan auditoria

| Accion | Cambia estado | Efecto esperado |
| --- | --- | --- |
| Asociar documento | No | Registra documento y genera `DOCUMENT_UPLOADED`. |
| Cambiar prioridad | No | Actualiza valor y genera `REQUEST_PRIORITY_CHANGED`. |
| Definir o cambiar fecha limite | No | Actualiza valor y genera `REQUEST_DEADLINE_SET` / `REQUEST_DEADLINE_CHANGED`. |
| Agregar observacion interna | No | Registra `REQUEST_INTERNAL_OBSERVATION_ADDED`. |
| Marcar como vista | No | Genera `REQUEST_VIEWED` (si aplica, aunque es principalmente del Departamento). |

---

## 4. Acciones bloqueadas explicitamente

Secretaria **no puede** realizar las siguientes acciones, independientemente del estado:

| Accion bloqueada | Actor responsable | Justificacion |
| --- | --- | --- |
| **Aprobar solicitud** | Personal de Departamento | La aprobacion es una decision departamental. |
| **Rechazar solicitud** | Personal de Departamento | El rechazo es una decision departamental que requiere motivo. |
| **Enviar al despacho del Alcalde** | Personal de Departamento | El escalamiento es una decision departamental sobre competencia. |
| **Devolver solicitud al departamento** | Despacho del Alcalde | La devolucion corresponde al actor superior que revisa. |
| **Rechazar desde el despacho** | Despacho del Alcalde | El rechazo superior corresponde al Despacho. |
| **Firmar solicitud** | Despacho del Alcalde | La firma logica requiere permiso explicito de firma. |
| **Cerrar solicitud** | Secretaria (con permiso) / Despacho (segun regla) | **Pendiente de validacion**. En el MVP, el cierre ordinario corresponde a Secretaria para estados de resultado, pero requiere permiso explicito y estado compatible. |
| **Cambiar estado generico** | Ninguno | No se permite enviar `statusId` arbitrario. |
| **Crear usuarios** | Administrador | Funcion administrativa fuera del alcance de Secretaria. |
| **Asignar roles o permisos** | Administrador | Gestion de accesos es funcion del Administrador. |

**Nota importante:** El actor responsable de una etapa no obtiene automaticamente permiso para ejecutar todas las salidas posibles. Las restricciones deben validarse mediante permisos + estado + alcance.

---

## 5. Eventos de auditoria asociados

Cada accion permitida de Secretaria tiene un evento de auditoria correspondiente. Los eventos se registran en `request_history` (o equivalente) dentro de la misma transaccion de la accion.

### Acciones de Secretaria y sus eventos

| Accion | Evento de auditoria | Transicion de estado | Motivo / Observacion |
| --- | --- | --- | --- |
| Crear solicitud | `REQUEST_CREATED` | `received` | Observacion opcional. |
| Asignar departamento | `REQUEST_DEPARTMENT_ASSIGNED` | `assigned_to_department` | Observacion opcional. |
| Reasignar departamento (desde `received`) | `REQUEST_DEPARTMENT_REASSIGNED` | `assigned_to_department` (si cambia depto) | Observacion recomendada. |
| Subir documento | `DOCUMENT_UPLOADED` | Sin cambio | Observacion opcional. |
| Definir prioridad | `REQUEST_PRIORITY_CHANGED` | Sin cambio | Observacion opcional, recomendada si existe justificacion. |
| Definir fecha limite | `REQUEST_DEADLINE_SET` | Sin cambio | Motivo u observacion opcional. |
| Modificar fecha limite | `REQUEST_DEADLINE_CHANGED` | Sin cambio | Motivo u observacion recomendada. |
| Agregar observacion interna | `REQUEST_INTERNAL_OBSERVATION_ADDED` | Sin cambio | Observacion obligatoria (es el contenido del evento). |
| Consultar auditoria | No genera evento (lectura) | Sin cambio | Solo consulta. |
| Consultar solicitud | No genera evento (lectura) | Sin cambio | Solo consulta de seguimiento. |

### Eventos que NO genera Secretaria

| Evento | Actor que lo genera | Razon |
| --- | --- | --- |
| `REQUEST_REVIEW_STARTED` | Personal de Departamento | Inicio de revision. |
| `REQUEST_APPROVED_BY_DEPARTMENT` | Personal de Departamento | Aprobacion departamental. |
| `REQUEST_REJECTED_BY_DEPARTMENT` | Personal de Departamento | Rechazo departamental. |
| `REQUEST_SENT_TO_MAYOR_OFFICE` | Personal de Departamento | Escalamiento al Despacho. |
| `REQUEST_RETURNED_TO_DEPARTMENT` | Despacho del Alcalde | Devolucion al departamento. |
| `REQUEST_REJECTED_BY_MAYOR_OFFICE` | Despacho del Alcalde | Rechazo desde el Despacho. |
| `REQUEST_SIGNED` | Despacho del Alcalde | Firma logica. |
| `REQUEST_CLOSED` | Secretaria / Despacho (segun permiso) | Cierre administrativo. |
| `STATUS_CHANGED` | Solo para correcciones excepcionales | Cambio generico no oficial. |

### Regla de no duplicidad

- Si existe un evento especifico para una accion, **no se debe registrar ademas** `STATUS_CHANGED` para la misma accion.
- `STATUS_CHANGED` solo se usa como respaldo para correcciones manuales fuera del flujo oficial.
- Cada accion unica debe producir **un solo evento funcional principal**.

---

## 6. Compatibilidad con la matriz de permisos

El diseno de transiciones de Secretaria es compatible con la matriz oficial de permisos del Sprint 3 (`docs/sprint-03-permission-matrix.md`).

### Permisos asignados a SECRETARY

| Permiso | Asignado | Alcance | Cubre la accion |
| --- | --- | --- | --- |
| `requests:create` | **Si** | Ninguno (creacion) | Crear solicitud en `received`. |
| `requests:upload_documents` | **Si** | Propio | Subir documentos asociados. |
| `requests:update` | **Si** | Propio / Global | Editar campos autorizados. |
| `requests:assign_department` | **Si** | Global | Asignar / reasignar departamento (desde `received`). |
| `requests:set_priority` | **Si** | Propio / Global | Definir / cambiar prioridad. |
| `requests:set_deadline` | **Si** | Propio / Global | Definir / cambiar fecha limite. |
| `requests:view_all` | **Seguimiento** | Global | Consultar todas las solicitudes (seguimiento). |
| `requests:view_audit` | **Seguimiento** | Global | Consultar historial y auditoria. |
| `requests:close` | **No** | Global | **Bloqueado** para Secretaria en la matriz preliminar. |

### Permisos bloqueados para SECRETARY

| Permiso | Asignado | Actor responsable |
| --- | --- | --- |
| `requests:mark_viewed` | **No** | Personal de Departamento |
| `requests:start_review` | **No** | Personal de Departamento |
| `requests:approve_department` | **No** | Personal de Departamento |
| `requests:reject_department` | **No** | Personal de Departamento |
| `requests:send_to_mayor_office` | **No** | Personal de Departamento |
| `requests:return_to_department` | **No** | Despacho del Alcalde |
| `requests:reject_mayor_office` | **No** | Despacho del Alcalde |
| `requests:sign` | **No** | Despacho del Alcalde |
| `requests:close` | **No** | Despacho del Alcalde / Secretaria (segun validacion externa) |

### Validacion de compatibilidad

| Criterio | Resultado |
| --- | --- |
| Acciones permitidas tienen permiso | **Si**. `requests:create`, `requests:assign_department`, `requests:set_priority`, `requests:set_deadline`, `requests:update` y `requests:upload_documents` estan asignados a `SECRETARY`. |
| Acciones bloqueadas no tienen permiso | **Si**. Ninguna de las acciones bloqueadas (aprobar, rechazar, firmar, escalar, devolver) esta asignada a `SECRETARY`. |
| Alcance apropiado | **Si**. Las acciones de modificacion usan alcance propio; la asignacion usa alcance global; la consulta usa seguimiento global. |
| Estado compatible | **Si**. Los permisos deben combinarse con validacion de estado: Secretaria solo puede ejecutar `requests:assign_department` en `received`, y `requests:update` en `received` (o segun reglas de edicion). |

---

## 7. Flujo funcional de Secretaria

```text
Secretaria
  |
  +-- Crear solicitud
  |     +-- Estado: received (automatico)
  |     +-- Datos: ciudadano, categoria, descripcion
  |     +-- Datos opcionales: documentos
  |     +-- Evento: REQUEST_CREATED
  |
  +-- (En estado received)
  |     +-- Editar datos iniciales
  |     +-- Definir prioridad (si no se hizo en asignacion)
  |     +-- Definir fecha limite (si no se hizo en asignacion)
  |     +-- Subir documentos
  |     +-- Eventos: REQUEST_PRIORITY_CHANGED, REQUEST_DEADLINE_SET,
  |     |            DOCUMENT_UPLOADED
  |
  +-- Asignar departamento
  |     +-- Transicion: received -> assigned_to_department
  |     +-- Datos obligatorios: departamento activo, prioridad, fecha limite
  |     +-- Evento: REQUEST_DEPARTMENT_ASSIGNED
  |
  +-- Post-asignacion
  |     +-- Consultar solicitud (seguimiento)
  |     +-- Consultar auditoria
  |     +-- No puede editar datos departamentales
  |     +-- No puede aprobar, rechazar, firmar
  |
  +-- Estados de resultado (si aplica)
  |     +-- Consultar resultado para responder al ciudadano
  |     +-- Cerrar solicitud (si tiene permiso, pendiente de validacion)
  |     +-- Evento: REQUEST_CLOSED (si se autoriza)
```

---

## 8. Decisiones resueltas

| Decision | Resolucion |
| --- | --- |
| Estado inicial | Siempre `received`. Secretaria no puede escogerlo. |
| Asignacion | Requiere departamento, prioridad y fecha limite validos. |
| Edicion post-asignacion | Secretaria no puede editar libremente una solicitud cuando el departamento ya inicio su revision. |
| Reasignacion | Secretaria solo puede reasignar en `received`. Reasignaciones posteriores corresponden al Despacho. |
| Aprobacion | Secretaria **no** aprueba. |
| Rechazo | Secretaria **no** rechaza. |
| Firma | Secretaria **no** firma. |
| Cierre | Pendiente de validacion externa. En el MVP, el cierre ordinario de estados de resultado puede corresponder a Secretaria, pero requiere permiso explicito y estado compatible. |

---

## 9. Decisiones pendientes de validacion externa

| Punto | Impacto en Secretaria |
| --- | --- |
| **Quien cierra las solicitudes** | Si Secretaria recibe permiso de cierre, puede ejecutar `REQUEST_CLOSED` desde estados de resultado. Si no, el cierre queda en el Despacho o en un actor diferente. |
| **Que evidencia representa la comunicacion al ciudadano** | Define si Secretaria necesita registrar un documento o respuesta antes del cierre. |
| **Si una solicitud aprobada por departamento necesita un documento de respuesta antes del cierre** | Afecta los datos que Secretaria debe completar antes de cerrar. |
| **Plazo maximo entre estado de resultado y `closed`** | Define si Secretaria tiene un tiempo limite para completar el cierre administrativo. |

---

## 10. Referencias

- `docs/v3-3-1-documentar-catalogo-estados.md` — Catalogo tecnico de los 10 estados oficiales.
- `docs/sprint-03-official-roles.md` — Definicion de actores, responsabilidades y restricciones de Secretaria.
- `docs/sprint-03-permission-matrix.md` — Matriz oficial de permisos por rol para validar quien puede actuar.
- `docs/sprint-03-official-states.md` — Comportamiento detallado de cada estado, incluyendo `received` y `assigned_to_department`.
- `docs/v3-5-2-consolidar-eventos-flujo-solicitudes.md` — Catalogo de eventos auditables y reglas de no duplicidad.
- `Alcaldia nuevo sprint.md` — Documento fuente del cliente con el flujo funcional objetivo.

---

## Resultado esperado

Disponer de una definicion clara de las acciones y transiciones que Secretaria puede ejecutar dentro del flujo, garantizando que la recepcion, asignacion y modificaciones iniciales de solicitudes respeten los estados oficiales, los permisos y los eventos de auditoria definidos para el Sprint 3.

---

*Documento generado para la subissue V3-3.2. El detalle funcional completo de cada estado se encuentra en `docs/v3-3-1-documentar-catalogo-estados.md` y `docs/sprint-03-official-states.md`.*
