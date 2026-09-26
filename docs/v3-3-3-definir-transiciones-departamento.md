# V3-3.3 Definir las transiciones del Departamento

## Metadatos

| Campo | Valor |
| --- | --- |
| **Issue** | #185 |
| **Revisor** | @Fradeh |
| **Tipo** | Diseño funcional |
| **Dependencias** | V3-3.1 — Documentar el catálogo técnico de estados; V3-3.2 — Definir las transiciones de Secretaría; Matriz preliminar de permisos |
| **Fuentes** | `docs/sprint-03-official-roles.md`, `docs/sprint-03-official-states.md`, `docs/sprint-03-permission-matrix.md`, `docs/v3-5-2-consolidar-eventos-flujo-solicitudes.md` |

## Proposito

Este documento define las acciones y transiciones que los usuarios pertenecientes a un Departamento pueden ejecutar sobre una solicitud asignada. Documenta el comportamiento esperado desde que una solicitud es asignada a un departamento hasta que se toma una decision formal sobre ella.

Ademas, establece las condiciones bajo las cuales una solicitud puede ser aprobada, rechazada o enviada al Despacho del Alcalde para revision y firma.

## Fuera de alcance

- Implementar endpoints departamentales.
- Implementar validaciones en codigo.
- Implementar auditoria.
- Implementar permisos.
- Crear migraciones.
- Implementar servicios de transicion.
- Modificar controladores.
- Implementar logica de negocio.

---

## Criterios de aceptacion

- [x] La transicion `assigned_to_department -> in_review` esta documentada.
- [x] La transicion `in_review -> approved_by_department` esta documentada.
- [x] La transicion `in_review -> rejected_by_department` esta documentada.
- [x] La transicion `in_review -> awaiting_mayor_signature` esta documentada.
- [x] La transicion `returned_to_department -> in_review` esta documentada.
- [x] Se definieron actores autorizados para cada transicion.
- [x] Se definieron restricciones para cada transicion.
- [x] Se definieron validaciones minimas para cada transicion.
- [x] El alcance departamental esta claramente documentado.
- [x] Un departamento no puede actuar sobre solicitudes de otro departamento.
- [x] Cada transicion tiene eventos de auditoria asociados.
- [x] El diseno es compatible con la matriz preliminar de permisos.

---

## 1. Alcance departamental

### Principio basico

El alcance se determina comparando:

- `user.departmentId`
- `request.departmentId`

La **coincidencia de departamentos es obligatoria, pero no suficiente**. Tambien deben validarse:

1. El permiso solicitado para la accion.
2. El estado de la solicitud (compatible con la transicion).
3. Los datos obligatorios para la accion.

### Departamento obligatorio

Todo usuario con rol `DEPARTMENT_STAFF` debe tener un `departmentId` activo y valido.

| Condicion | Efecto |
| --- | --- |
| Usuario sin departamento | Puede autenticarse, pero no puede consultar ni operar solicitudes departamentales. |
| Departamento inactivo | No puede consultar ni operar solicitudes departamentales. |
| Solicitud de otro departamento | No puede consultar ni operar la solicitud, aunque conozca su identificador. |

### Respuesta de la API ante acceso invalido

La API debe responder con `acceso denegado` o `configuracion invalida` segun el caso definido en la Issue 4 (permisos y autorizacion). La inconsistencia de configuracion debe ser corregida por Administracion.

### Distribucion interna de trabajo

La asignacion opcional a un usuario especifico (`user_assigned_id`) puede utilizarse para distribuir trabajo interno dentro del departamento, pero **no reemplaza el alcance departamental**. La permanencia de `user_assigned_id` debe resolverse en el diseno de datos.

---

## 2. Transicion: `assigned_to_department -> in_review`

### Accion

**Iniciar revision** (`requests:start_review`).

### Actor autorizado

- **Rol:** `DEPARTMENT_STAFF`
- **Condicion:** El usuario debe pertenecer al departamento asignado (`user.departmentId == request.departmentId`).
- **Permiso:** `requests:start_review`

### Condiciones requeridas

| Condicion | Descripcion |
| --- | --- |
| Estado previo | La solicitud debe estar en `assigned_to_department` o `returned_to_department`. |
| Departamento | El usuario debe pertenecer al departamento responsable de la solicitud. |
| Estado actual | No puede estar ya en `in_review` ni en un estado posterior. |

### Datos que deben actualizarse

| Campo | Valor | Descripcion |
| --- | --- | --- |
| `status` | `in_review` | Nuevo estado de la solicitud. |
| `review_started_at` | Fecha actual | Registro del inicio formal de la revision. |

### Eventos de auditoria asociados

| Evento | Codigo | Descripcion |
| --- | --- | --- |
| Inicio de revision | `REQUEST_REVIEW_STARTED` | Se usa una sola vez por ciclo de revision. |

### Restricciones

- No puede iniciar revision sobre solicitudes de otro departamento.
- No puede iniciar revision si la solicitud no esta en `assigned_to_department` o `returned_to_department`.
- Marcar como vista es una accion separada que no cambia el estado.

---

## 3. Transicion: `in_review -> approved_by_department`

### Accion

**Aprobar solicitud** (`requests:approve_department`).

### Actor autorizado

- **Rol:** `DEPARTMENT_STAFF`
- **Condicion:** El usuario debe pertenecer al departamento asignado.
- **Permiso:** `requests:approve_department`

### Requisitos minimos para aprobar

| Requisito | Descripcion |
| --- | --- |
| Estado previo | La solicitud debe estar en `in_review`. |
| Departamento | El usuario debe pertenecer al departamento responsable. |
| Intervencion del despacho | La solicitud **no** debe cumplir un criterio de intervencion obligatoria del Despacho del Alcalde. |
| Decision | Debe ser tomada por personal autorizado del departamento. |

### Datos que deben actualizarse

| Campo | Valor | Descripcion |
| --- | --- | --- |
| `status` | `approved_by_department` | Nuevo estado de resultado. |
| `decision_at` | Fecha actual | Fecha de la decision departamental. |

### Eventos de auditoria asociados

| Evento | Codigo | Descripcion |
| --- | --- | --- |
| Aprobacion departamental | `REQUEST_APPROVED_BY_DEPARTMENT` | Se usa en la aprobacion oficial. No se acompana con `STATUS_CHANGED`. |

### Restricciones

- **No puede enviarse posteriormente al despacho** por el flujo ordinario.
- **No puede volver a revision** sin una reapertura, que queda fuera del MVP.
- El estado de resultado se mantiene hasta que Secretaria ejecute el cierre administrativo.
- No puede aprobarse una solicitud que ya fue rechazada, devuelta o escalada.

### Decision funcional

`approved_by_department` no cambia automaticamente a `closed`. Se mantiene como estado de resultado hasta que Secretaria confirme que el resultado fue comunicado o que el expediente cumple las condiciones administrativas de cierre.

---

## 4. Transicion: `in_review -> rejected_by_department`

### Accion

**Rechazar solicitud** (`requests:reject_department`).

### Actor autorizado

- **Rol:** `DEPARTMENT_STAFF`
- **Condicion:** El usuario debe pertenecer al departamento asignado.
- **Permiso:** `requests:reject_department`

### Requisitos minimos para rechazar

| Requisito | Descripcion |
| --- | --- |
| Estado previo | La solicitud debe estar en `in_review`. |
| Departamento | El usuario debe pertenecer al departamento responsable. |
| Motivo | **Requisito obligatorio.** Debe existir un motivo documentado de rechazo. |
| Decision | Debe ser tomada por personal autorizado del departamento. |

### Datos que deben actualizarse

| Campo | Valor | Descripcion |
| --- | --- | --- |
| `status` | `rejected_by_department` | Nuevo estado de resultado. |
| `decision_at` | Fecha actual | Fecha de la decision departamental. |
| `rejection_reason` | Motivo documentado | Justificacion obligatoria del rechazo. |

### Eventos de auditoria asociados

| Evento | Codigo | Descripcion |
| --- | --- | --- |
| Rechazo departamental | `REQUEST_REJECTED_BY_DEPARTMENT` | Motivo obligatorio, observacion obligatoria. |

### Restricciones

- **No puede enviarse al despacho** despues del rechazo ordinario.
- **No puede volver a revision** sin una reapertura fuera del MVP.
- El motivo y la decision quedan disponibles en la auditoria interna.
- La informacion publica debe presentar un resultado adecuado sin exponer observaciones confidenciales.

### Decision funcional

El rechazo departamental no cierra automaticamente la solicitud. Secretaria debe completar el paso administrativo de comunicacion o registro de respuesta.

---

## 5. Transicion: `in_review -> awaiting_mayor_signature`

### Accion

**Enviar al despacho del Alcalde** (`requests:send_to_mayor_office`).

### Actor autorizado

- **Rol:** `DEPARTMENT_STAFF`
- **Condicion:** El usuario debe pertenecer al departamento asignado.
- **Permiso:** `requests:send_to_mayor_office`

### Cuando aplica

Una solicitud pasa a `awaiting_mayor_signature` cuando, despues de la revision departamental, se cumple al menos una de estas condiciones:

| Criterio | Descripcion |
| --- | --- |
| Firma logica | Requiere firma logica del alcalde o personal autorizado. |
| Competencia excedida | La decision excede la competencia del departamento. |
| Impacto institucional | Tiene impacto institucional, presupuestal, juridico o interdepartamental que exige decision superior. |
| Politica administrativa | Una politica, categoria o regla administrativa exige revision del despacho. |
| Escalacion excepcional | El departamento justifica una escalacion excepcional. |

### Validaciones requeridas

| Validacion | Descripcion |
| --- | --- |
| Estado previo | La solicitud debe estar en `in_review`. |
| Departamento | El usuario debe pertenecer al departamento responsable. |
| Causa de intervencion | Debe existir una causa de intervencion documentada. |
| Autorizacion | El departamento debe haber autorizado el envio. |

### Datos que deben actualizarse

| Campo | Valor | Descripcion |
| --- | --- | --- |
| `status` | `awaiting_mayor_signature` | Nueva etapa de espera del despacho. |

### Eventos de auditoria asociados

| Evento | Codigo | Descripcion |
| --- | --- | --- |
| Envio a despacho | `REQUEST_SENT_TO_MAYOR_OFFICE` | Observacion recomendada, motivo opcional segun flujo. |

### Restricciones

- No puede enviarse al despacho desde `approved_by_department` o `rejected_by_department`.
- No puede cerrarse sin registrar primero un resultado desde el despacho.
- Devolver, rechazar o reasignar desde el despacho exige motivo.

### Nota sobre la nomenclatura

Aunque el codigo menciona "signature", el estado representa la espera de una **decision del despacho** y no garantiza que el resultado final sea una firma.

---

## 6. Transicion: `returned_to_department -> in_review`

### Accion

**Reiniciar revision** (reinicio de `requests:start_review` tras devolucion).

### Contexto

Esta transicion ocurre cuando el Despacho del Alcalde devuelve una solicitud al departamento mediante la transicion `awaiting_mayor_signature -> returned_to_department`.

### Actor autorizado

- **Rol:** `DEPARTMENT_STAFF`
- **Condicion:** El usuario debe pertenecer al departamento al que fue devuelta.
- **Permiso:** `requests:start_review`

### Condiciones requeridas

| Condicion | Descripcion |
| --- | --- |
| Estado previo | La solicitud debe estar en `returned_to_department`. |
| Departamento | El usuario debe pertenecer al departamento responsable. |
| Motivo de devolucion | El motivo debe ser visible para el personal autorizado. |

### Datos que deben actualizarse

| Campo | Valor | Descripcion |
| --- | --- | --- |
| `status` | `in_review` | Reinicio formal de la revision. |
| `review_started_at` | Fecha actual (nuevo ciclo) | Registro del nuevo inicio de revision. |

### Eventos de auditoria asociados

| Evento | Codigo | Descripcion |
| --- | --- | --- |
| Reinicio de revision | `REQUEST_REVIEW_STARTED` | Se registra un nuevo ciclo de revision. |

### Decision funcional

`returned_to_department` no vuelve automaticamente a `in_review`. Se mantiene como etapa diferenciada hasta que el departamento reconozca la devolucion e inicie una nueva revision. Al reiniciar:

- Se actualiza `review_started_at` con el nuevo ciclo o se registra el nuevo inicio en auditoria.
- Se conserva todo el historial anterior.
- La solicitud puede volver a aprobarse, rechazarse o enviarse al despacho.

### Restricciones

- El despacho no puede firmarla mientras siga devuelta.
- No puede cerrarse ni producir una nueva decision sin reiniciar la revision.
- Marcarla como vista despues de la devolucion puede generar un nuevo evento, pero no cambia el estado.

---

## 7. Acciones sin cambio de estado

### Marcar como vista

| Aspecto | Descripcion |
| --- | --- |
| **Accion** | Marcar solicitud como vista (`requests:mark_viewed`). |
| **Actor** | `DEPARTMENT_STAFF` (del departamento asignado). |
| **Cambia estado** | **No**. |
| **Efecto** | Registra `viewed_at` cuando corresponda; genera `REQUEST_VIEWED`. |
| **Estados donde aplica** | Principalmente `assigned_to_department` y `returned_to_department`. |

### Agregar observacion interna

| Aspecto | Descripcion |
| --- | --- |
| **Accion** | Agregar observacion interna. |
| **Actor** | `DEPARTMENT_STAFF` (del departamento asignado). |
| **Cambia estado** | **No**. |
| **Efecto** | Registra `REQUEST_INTERNAL_OBSERVATION_ADDED` con la observacion como contenido obligatorio. |
| **Estados donde aplica** | `assigned_to_department`, `in_review`, `returned_to_department`. |

### Consultar solicitudes y auditoria

| Aspecto | Descripcion |
| --- | --- |
| **Accion** | Consultar solicitudes del departamento y su historial. |
| **Actor** | `DEPARTMENT_STAFF` (del departamento asignado). |
| **Cambia estado** | **No**. |
| **Permiso** | `requests:view_own_department` (solicitudes del departamento), `requests:view_audit` (historial departamental). |
| **Alcance** | Departamental (`user.departmentId == request.departmentId`). |

---

## 8. Acciones bloqueadas para el Departamento

Un departamento **no puede** realizar las siguientes acciones:

| Accion bloqueada | Actor responsable | Justificacion |
| --- | --- | --- |
| **Crear solicitudes** | Secretaria | La recepcion es funcion de Secretaria. |
| **Asignar departamento inicial** | Secretaria | La asignacion inicial corresponde a Secretaria. |
| **Reasignar departamento** | Despacho del Alcalde | La reasignacion posterior corresponde al Despacho. |
| **Aprobar/rechazar sin estar en `in_review`** | Ninguno | Las decisiones requieren que la solicitud este en revision formal. |
| **Aprobar/rechazar solicitudes de otro departamento** | Ninguno | El alcance departamental lo impide. |
| **Devolver solicitud al departamento** | Despacho del Alcalde | La devolucion es una decision superior. |
| **Rechazar desde el despacho** | Despacho del Alcalde | El rechazo superior corresponde al Despacho. |
| **Firmar solicitud** | Despacho del Alcalde | La firma logica requiere permiso explicito de firma. |
| **Cerrar solicitud** | Secretaria / Despacho (segun permiso) | El cierre administrativo corresponde a otros actores. |
| **Cambiar estado generico** | Ninguno | No se permite enviar `statusId` arbitrario. |
| **Crear usuarios** | Administrador | Funcion administrativa fuera del alcance. |
| **Asignar roles o permisos** | Administrador | Gestion de accesos es funcion del Administrador. |
| **Modificar datos iniciales del ciudadano** | Secretaria | Los datos iniciales son responsabilidad de Secretaria. |

---

## 9. Eventos de auditoria asociados

### Transiciones del Departamento

| Transicion | Accion | Evento | Motivo / Observacion |
| --- | --- | --- | --- |
| `assigned_to_department -> in_review` | Iniciar revision | `REQUEST_REVIEW_STARTED` | Sin motivo; observacion opcional. |
| `returned_to_department -> in_review` | Reiniciar revision | `REQUEST_REVIEW_STARTED` | Nuevo ciclo de revision; observacion opcional. |
| `in_review -> approved_by_department` | Aprobar | `REQUEST_APPROVED_BY_DEPARTMENT` | Motivo opcional; observacion opcional. |
| `in_review -> rejected_by_department` | Rechazar | `REQUEST_REJECTED_BY_DEPARTMENT` | Motivo obligatorio; observacion obligatoria. |
| `in_review -> awaiting_mayor_signature` | Enviar al despacho | `REQUEST_SENT_TO_MAYOR_OFFICE` | Observacion recomendada; motivo opcional. |

### Acciones sin cambio de estado

| Accion | Evento | Motivo / Observacion |
| --- | --- | --- |
| Marcar como vista | `REQUEST_VIEWED` | Sin motivo; observacion opcional. |
| Agregar observacion interna | `REQUEST_INTERNAL_OBSERVATION_ADDED` | Observacion obligatoria (contenido del evento). |

### Eventos que NO genera el Departamento

| Evento | Actor que lo genera | Razon |
| --- | --- | --- |
| `REQUEST_CREATED` | Secretaria | Creacion de la solicitud. |
| `REQUEST_DEPARTMENT_ASSIGNED` | Secretaria | Asignacion inicial. |
| `REQUEST_RETURNED_TO_DEPARTMENT` | Despacho del Alcalde | Devolucion al departamento. |
| `REQUEST_REJECTED_BY_MAYOR_OFFICE` | Despacho del Alcalde | Rechazo desde el despacho. |
| `REQUEST_SIGNED` | Despacho del Alcalde | Firma logica. |
| `REQUEST_CLOSED` | Secretaria / Despacho | Cierre administrativo. |
| `STATUS_CHANGED` | Solo excepciones | Cambio generico no oficial. |

### Regla de no duplicidad

- Si existe un evento especifico para una transicion, **no se debe registrar ademas** `STATUS_CHANGED`.
- `STATUS_CHANGED` solo se usa como respaldo para correcciones manuales fuera del flujo oficial.
- Cada transicion unica debe producir **un solo evento funcional principal**.

---

## 10. Compatibilidad con la matriz de permisos

El diseno es compatible con la matriz oficial de permisos del Sprint 3 (`docs/sprint-03-permission-matrix.md`).

### Permisos asignados a DEPARTMENT_STAFF

| Permiso | Asignado | Alcance | Cubre la accion |
| --- | --- | --- | --- |
| `requests:view_own_department` | **Si** | Departamental | Consultar solicitudes del departamento. |
| `requests:view_audit` | **Departamental** | Departamental | Consultar historial de solicitudes del departamento. |
| `requests:mark_viewed` | **Si** | Departamental | Marcar solicitud como vista. |
| `requests:start_review` | **Si** | Departamental | Iniciar revision (`assigned_to_department -> in_review`). |
| `requests:approve_department` | **Si** | Departamental | Aprobar solicitud (`in_review -> approved_by_department`). |
| `requests:reject_department` | **Si** | Departamental | Rechazar solicitud (`in_review -> rejected_by_department`). |
| `requests:send_to_mayor_office` | **Si** | Departamental | Enviar al despacho (`in_review -> awaiting_mayor_signature`). |

### Permisos bloqueados para DEPARTMENT_STAFF

| Permiso | Asignado | Actor responsable |
| --- | --- | --- |
| `requests:create` | **No** | Secretaria |
| `requests:upload_documents` | **No** | Secretaria |
| `requests:update` | **No** | Secretaria / Despacho |
| `requests:assign_department` | **No** | Secretaria / Despacho |
| `requests:set_priority` | **No** | Secretaria / Despacho |
| `requests:set_deadline` | **No** | Secretaria / Despacho |
| `requests:view_all` | **No** | Secretaria (seguimiento) / Despacho |
| `requests:return_to_department` | **No** | Despacho del Alcalde |
| `requests:reject_mayor_office` | **No** | Despacho del Alcalde |
| `requests:sign` | **No** | Despacho del Alcalde |
| `requests:close` | **No** | Despacho / Secretaria (segun validacion) |
| `users:*` | **No** | Administrador |

### Validacion de compatibilidad

| Criterio | Resultado |
| --- | --- |
| Acciones permitidas tienen permiso | **Si**. `requests:mark_viewed`, `requests:start_review`, `requests:approve_department`, `requests:reject_department`, `requests:send_to_mayor_office` estan asignados a `DEPARTMENT_STAFF`. |
| Acciones bloqueadas no tienen permiso | **Si**. Ninguna de las acciones bloqueadas (crear, asignar, reasignar, firmar, devolver, cerrar) esta asignada a `DEPARTMENT_STAFF`. |
| Alcance apropiado | **Si**. Todas las acciones operativas usan alcance departamental (`user.departmentId == request.departmentId`). |
| Estado compatible | **Si**. Los permisos deben combinarse con validacion de estado: el departamento solo puede ejecutar `requests:start_review` en `assigned_to_department`/`returned_to_department`, y `requests:approve_department`/`requests:reject_department`/`requests:send_to_mayor_office` solo en `in_review`. |

---

## 11. Flujo funcional del Departamento

```text
Departamento
  |
  +-- (Solicitud en assigned_to_department)
  |     +-- Consultar solicitud
  |     +-- Marcar como vista (REQUEST_VIEWED)
  |     +-- Agregar observaciones (REQUEST_INTERNAL_OBSERVATION_ADDED)
  |
  +-- Iniciar revision
  |     +-- Transicion: assigned_to_department -> in_review
  |     +-- Evento: REQUEST_REVIEW_STARTED
  |     +-- Datos: review_started_at
  |
  +-- (Solicitud en in_review)
  |     +-- Consultar documentos e historial
  |     +-- Agregar observaciones internas
  |     +-- Preparar decision
  |
  +-- Decisiones posibles desde in_review
  |     |
  |     +-- Aprobar
  |     |     +-- Transicion: in_review -> approved_by_department
  |     |     +-- Evento: REQUEST_APPROVED_BY_DEPARTMENT
  |     |     +-- Datos: decision_at
  |     |     +-- Restriccion: no requiere intervencion del despacho
  |     |
  |     +-- Rechazar
  |     |     +-- Transicion: in_review -> rejected_by_department
  |     |     +-- Evento: REQUEST_REJECTED_BY_DEPARTMENT
  |     |     +-- Datos: decision_at, rejection_reason (motivo obligatorio)
  |     |
  |     +-- Enviar al despacho
  |     |     +-- Transicion: in_review -> awaiting_mayor_signature
  |     |     +-- Evento: REQUEST_SENT_TO_MAYOR_OFFICE
  |     |     +-- Requisito: causa de intervencion documentada
  |     |
  |     +-- (No puede cerrar, firmar, devolver ni reasignar)
  |
  +-- (Si la solicitud fue devuelta por el Despacho)
  |     +-- (Estado: returned_to_department)
  |     +-- Consultar motivo de devolucion
  |     +-- Marcar como vista (opcional)
  |     +-- Reiniciar revision
  |     |     +-- Transicion: returned_to_department -> in_review
  |     |     +-- Evento: REQUEST_REVIEW_STARTED (nuevo ciclo)
  |     |     +-- Datos: review_started_at (nuevo)
  |     +-- (Desde in_review, puede volver a aprobar, rechazar o enviar)
```

---

## 12. Decisiones resueltas

| Decision | Resolucion |
| --- | --- |
| Inicio de revision | El departamento debe iniciar formalmente la revision desde `assigned_to_department` o `returned_to_department`. No puede decidir sin este paso. |
| Aprobacion | Requiere que la solicitud no cumpla criterios de intervencion del despacho. No cambia automaticamente a `closed`. |
| Rechazo | Requiere motivo obligatorio. No cambia automaticamente a `closed`. |
| Envio al despacho | Requiere causa de intervencion documentada. Solo desde `in_review`. |
| Devolucion | Si el Despacho devuelve la solicitud, el departamento debe reiniciar formalmente la revision (`returned_to_department -> in_review`). |
| Reapertura | Fuera del MVP. Una vez aprobada, rechazada o escalada, no puede volver a revision sin proceso excepcional. |
| Alcance | El departamento solo opera solicitudes asignadas a su `departmentId`. No puede actuar sobre solicitudes de otros departamentos. |

---

## 13. Decisiones pendientes de validacion externa

| Punto | Impacto en el Departamento |
| --- | --- |
| **Quien cierra las solicitudes** | Si el cierre corresponde a Secretaria, el departamento solo produce el resultado. Si corresponde al Despacho, afecta quien puede cerrar resultados escalados. |
| **Categorias que obligan intervencion del despacho** | Define si el departamento puede aprobar automaticamente o si debe escalar segun reglas predefinidas. |
| **Si la asignacion a un usuario especifico limita operaciones** | Define si el departamento puede requerir que un usuario especifico (`user_assigned_id`) sea quien inicie revision o decida. |
| **Plazo maximo para revision** | Define si el departamento tiene un tiempo limite para iniciar revision o tomar decision. |
| **Reapertura de solicitudes** | Si se aprueba posteriormente, debe ser una accion explicita, altamente restringida y auditada, fuera del MVP. |

---

## 14. Referencias

- `docs/v3-3-1-documentar-catalogo-estados.md` — Catalogo tecnico de los 10 estados oficiales.
- `docs/v3-3-2-definir-transiciones-secretaria.md` — Transiciones de Secretaria (recepcion y asignacion).
- `docs/sprint-03-official-roles.md` — Definicion de actores, responsabilidades y restricciones del Personal de Departamento.
- `docs/sprint-03-permission-matrix.md` — Matriz oficial de permisos por rol para validar quien puede actuar.
- `docs/sprint-03-official-states.md` — Comportamiento detallado de cada estado, incluyendo transiciones departamentales.
- `docs/v3-5-2-consolidar-eventos-flujo-solicitudes.md` — Catalogo de eventos auditables y reglas de no duplicidad.

---

## Resultado esperado

Disponer de una definicion clara y validada de las acciones que puede ejecutar un Departamento dentro del flujo de solicitudes, garantizando que las decisiones departamentales respeten los estados oficiales, los permisos definidos y los requisitos de auditoria del Sprint 3.

---

*Documento generado para la subissue V3-3.3 (#185). El detalle funcional completo de cada estado se encuentra en `docs/v3-3-1-documentar-catalogo-estados.md` y `docs/sprint-03-official-states.md`.*
