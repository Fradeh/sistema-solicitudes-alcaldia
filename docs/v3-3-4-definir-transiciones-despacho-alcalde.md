# V3-3.4 Definir las transiciones del Despacho del Alcalde

## Metadatos

| Campo | Valor |
| --- | --- |
| **Revisor** | @Fradeh |
| **Tipo** | Diseno funcional |
| **Dependencias** | V3-3.1 — Documentar el catalogo tecnico de estados; V3-3.3 — Definir las transiciones del Departamento; Matriz preliminar de permisos |
| **Fuentes** | `docs/sprint-03-official-roles.md`, `docs/sprint-03-official-states.md`, `docs/sprint-03-permission-matrix.md`, `docs/v3-5-2-consolidar-eventos-flujo-solicitudes.md` |

## Proposito

Este documento define las acciones y transiciones que pueden ejecutarse desde el Despacho del Alcalde sobre solicitudes que requieren revision o firma. Documenta el comportamiento esperado cuando una solicitud llega al estado `awaiting_mayor_signature`, incluyendo los escenarios de firma, rechazo y devolucion al departamento.

Ademas, establece las condiciones necesarias para cada decision y los eventos de auditoria asociados.

## Fuera de alcance

- Implementar endpoints.
- Implementar validaciones.
- Implementar auditoria.
- Implementar firma digital.
- Implementar permisos.
- Crear migraciones.
- Implementar servicios de transicion.
- Modificar controladores.
- Implementar logica de negocio.

---

## Criterios de aceptacion

- [x] La transicion `awaiting_mayor_signature -> signed` esta documentada.
- [x] La transicion `awaiting_mayor_signature -> returned_to_department` esta documentada.
- [x] La transicion `awaiting_mayor_signature -> rejected_by_mayor_office` esta documentada.
- [x] Se definieron actores autorizados para cada transicion.
- [x] Se definieron validaciones para cada transicion.
- [x] Se definieron restricciones para cada transicion.
- [x] Los motivos requeridos estan documentados cuando aplica.
- [x] Cada transicion tiene eventos de auditoria asociados.
- [x] La informacion minima a registrar esta definida.
- [x] El diseno es compatible con la matriz preliminar de permisos.

---

## 1. Alcance del Despacho del Alcalde

### Visibilidad global

El Despacho del Alcalde tiene **alcance global** sobre solicitudes y **no requiere un departamento asociado**.

El alcance global permite consultar recursos de todos los departamentos, pero cada accion sigue necesitando:

1. **Permiso especifico** para la accion.
2. **Estado compatible** con la transicion.
3. **Datos obligatorios** para la accion.
4. **Registro de auditoria** correspondiente.

### Actor autorizado

- **Rol:** `MAYOR_OFFICE`
- **Permiso explicito:** La visibilidad global no permite ejecutar cualquier transicion. Cada accion requiere su permiso correspondiente.

### Restricciones generales

| Restriccion | Descripcion |
| --- | --- |
| No decide sobre estados incompatibles | Solo puede actuar sobre solicitudes en `awaiting_mayor_signature` (salvo cierre en estados de resultado). |
| No omite revision departamental | Salvo excepcion funcional aprobada, no puede saltar la revision departamental. |
| No administra usuarios | La gestion de usuarios, roles y permisos corresponde al Administrador. |
| No reemplaza recepcion | No crea solicitudes iniciales como Secretaria. |
| Motivo obligatorio | No puede devolver, rechazar o reasignar sin registrar el motivo requerido. |
| Firma restringida | No puede firmar sin una solicitud en el estado autorizado. |

---

## 2. Transicion: `awaiting_mayor_signature -> signed`

### Accion

**Firmar solicitud** (`requests:sign`).

### Actor autorizado

- **Rol:** `MAYOR_OFFICE`
- **Condicion:** El usuario debe tener permiso explicito de firma.
- **Permiso:** `requests:sign`

### Descripcion funcional

El Despacho del Alcalde aprueba la solicitud escalada y un usuario autorizado realiza la firma logica. Dentro del MVP, la firma representa una actuacion logica, no una integracion de firma digital certificada.

### Validaciones requeridas

| Validacion | Descripcion |
| --- | --- |
| Estado previo | La solicitud debe estar en `awaiting_mayor_signature`. |
| Permiso de firma | El usuario debe tener permiso explicito `requests:sign`. |
| Usuario autorizado | Debe identificarse al usuario que realiza la firma. |

### Informacion obligatoria

| Campo | Descripcion |
| --- | --- |
| `signed_at` | Fecha y hora de la firma. |
| `signed_by_id` | Identificador del usuario que firmo. |

### Datos que deben actualizarse

| Campo | Valor | Descripcion |
| --- | --- | --- |
| `status` | `signed` | Nuevo estado de resultado. |
| `signed_at` | Fecha actual | Registro de la firma. |
| `signed_by_id` | ID del usuario | Identificacion del firmante. |

### Eventos de auditoria asociados

| Evento | Codigo | Descripcion |
| --- | --- | --- |
| Firma | `REQUEST_SIGNED` | Se usa cuando la firma oficial completa el proceso. Sin motivo; observacion opcional. |

### Restricciones

- No puede firmarse una segunda vez por el flujo ordinario.
- No puede volver a revision sin una reapertura fuera del MVP.
- No puede cerrarse automaticamente; requiere accion explicita de cierre.
- La firma es un resultado relevante que debe permanecer identificable hasta que Secretaria complete la comunicacion o cierre del expediente.

### Decision funcional

`signed` no cambia automaticamente a `closed`. La firma es un resultado relevante que debe permanecer identificable hasta que Secretaria (o el Despacho, segun permisos) complete la comunicacion o cierre del expediente.

---

## 3. Transicion: `awaiting_mayor_signature -> returned_to_department`

### Accion

**Devolver al departamento** (`requests:return_to_department`).

### Actor autorizado

- **Rol:** `MAYOR_OFFICE`
- **Permiso:** `requests:return_to_department`

### Descripcion funcional

El Despacho del Alcalde devuelve la solicitud al departamento responsable para corregir, ampliar informacion o realizar una revision adicional.

### Validaciones requeridas

| Validacion | Descripcion |
| --- | --- |
| Estado previo | La solicitud debe estar en `awaiting_mayor_signature`. |
| Motivo | **Requisito obligatorio.** Debe existir un motivo documentado de devolucion. |

### Informacion obligatoria

| Campo | Descripcion |
| --- | --- |
| Motivo de devolucion | Justificacion obligatoria del porque se devuelve la solicitud. |
| Observacion | Recomendada para detallar que correcciones o ampliaciones se requieren. |

### Datos que deben actualizarse

| Campo | Valor | Descripcion |
| --- | --- | --- |
| `status` | `returned_to_department` | Nueva etapa de devolucion. |

### Eventos de auditoria asociados

| Evento | Codigo | Descripcion |
| --- | --- | --- |
| Devolucion | `REQUEST_RETURNED_TO_DEPARTMENT` | Motivo obligatorio, observacion obligatoria. |

### Restricciones

- El despacho no puede firmarla mientras siga devuelta.
- No puede cerrarse ni producir una nueva decision sin reiniciar la revision.
- El motivo de devolucion debe ser visible para el personal autorizado del departamento y conservarse en la auditoria.
- Marcarla como vista despues de la devolucion puede generar un nuevo evento, pero no cambia el estado.

### Decision funcional

`returned_to_department` no vuelve automaticamente a `in_review`. Se mantiene como etapa diferenciada hasta que el departamento reconozca la devolucion e inicie una nueva revision. Al reiniciar:

- Se actualiza `review_started_at` con el nuevo ciclo o se registra el nuevo inicio en auditoria.
- Se conserva todo el historial anterior.
- La solicitud puede volver a aprobarse, rechazarse o enviarse al despacho.

---

## 4. Transicion: `awaiting_mayor_signature -> rejected_by_mayor_office`

### Accion

**Rechazar desde el despacho** (`requests:reject_mayor_office`).

### Actor autorizado

- **Rol:** `MAYOR_OFFICE`
- **Permiso:** `requests:reject_mayor_office`

### Descripcion funcional

El Despacho del Alcalde rechaza la solicitud despues de revisar el expediente escalado.

### Validaciones requeridas

| Validacion | Descripcion |
| --- | --- |
| Estado previo | La solicitud debe estar en `awaiting_mayor_signature`. |
| Motivo | **Requisito obligatorio.** Debe existir un motivo documentado de rechazo. |
| Decision | Debe ser tomada por un usuario autorizado del despacho. |

### Informacion obligatoria

| Campo | Descripcion |
| --- | --- |
| Motivo de rechazo | Justificacion obligatoria del rechazo. |
| Observacion | Recomendada para detallar el fundamento de la decision. |

### Datos que deben actualizarse

| Campo | Valor | Descripcion |
| --- | --- | --- |
| `status` | `rejected_by_mayor_office` | Nuevo estado de resultado. |
| `decision_at` | Fecha actual | Fecha de la decision del despacho. |

### Eventos de auditoria asociados

| Evento | Codigo | Descripcion |
| --- | --- | --- |
| Rechazo desde despacho | `REQUEST_REJECTED_BY_MAYOR_OFFICE` | Motivo obligatorio, observacion obligatoria. |

### Restricciones

- No vuelve al departamento mediante el flujo ordinario.
- No puede firmarse despues del rechazo.
- Una reapertura queda fuera del MVP.
- La decision superior queda preservada antes del cierre. Secretaria puede consultar el resultado para responder al ciudadano.

---

## 5. Transicion: `awaiting_mayor_signature -> assigned_to_department`

### Accion

**Reasignar a otro departamento** (`requests:assign_department`).

### Actor autorizado

- **Rol:** `MAYOR_OFFICE`
- **Permiso:** `requests:assign_department`

### Descripcion funcional

El Despacho del Alcalde puede reasignar una solicitud a otro departamento cuando determina que el departamento actual no es el competente o cuando requiere una revision diferente.

### Validaciones requeridas

| Validacion | Descripcion |
| --- | --- |
| Estado previo | La solicitud debe estar en `awaiting_mayor_signature`. |
| Nuevo departamento | Debe ser un departamento activo y valido. |
| Motivo | **Requisito obligatorio.** Debe existir un motivo documentado de reasignacion. |

### Informacion obligatoria

| Campo | Descripcion |
| --- | --- |
| Nuevo `department_id` | Identificador del nuevo departamento asignado. |
| Motivo de reasignacion | Justificacion obligatoria del cambio de departamento. |

### Datos que deben actualizarse

| Campo | Valor | Descripcion |
| --- | --- | --- |
| `status` | `assigned_to_department` | Nueva etapa para el departamento asignado. |
| `department_id` | Nuevo departamento | Identificador del nuevo departamento. |

### Eventos de auditoria asociados

| Evento | Codigo | Descripcion |
| --- | --- | --- |
| Reasignacion | `REQUEST_DEPARTMENT_REASSIGNED` | Se usa solo cuando ya existia un departamento previo. Observacion recomendada. |

### Restricciones

- El nuevo departamento debe estar activo.
- La solicitud vuelve a `assigned_to_department`, no a `in_review` directamente. El nuevo departamento debe iniciar formalmente la revision.
- No puede reasignarse al mismo departamento.

---

## 6. Cierre desde el Despacho del Alcalde

### Accion

**Cerrar solicitud** (`requests:close`).

### Actor autorizado

- **Rol:** `MAYOR_OFFICE`
- **Permiso:** `requests:close`

### Descripcion funcional

El Despacho del Alcalde puede cerrar solicitudes cuando las reglas de cierre lo permitan. Durante el MVP, el cierre ordinario corresponde a Secretaria, pero el Despacho puede cerrar bajo ciertas condiciones de contingencia o segun reglas especiales.

### Condiciones para cerrar desde el Despacho

| Condicion | Descripcion |
| --- | --- |
| Estado previo | La solicitud debe estar en uno de los estados de resultado: `signed` o `rejected_by_mayor_office`. |
| Permiso | El usuario debe tener permiso `requests:close`. |
| Resultado completo | El resultado debe estar completo y documentado. |
| Motivos obligatorios | Los motivos obligatorios deben existir (si aplica). |

### Estados desde los cuales puede cerrar

| Estado origen | Aplica cierre desde Despacho | Notas |
| --- | --- | --- |
| `approved_by_department` | No | Cierre ordinario por Secretaria. |
| `rejected_by_department` | No | Cierre ordinario por Secretaria. |
| `signed` | **Si** (con permiso) | Firma completada; puede cerrarse por Despacho en contingencia. |
| `rejected_by_mayor_office` | **Si** (con permiso) | Rechazo del despacho; puede cerrarse directamente. |

### Eventos de auditoria asociados

| Evento | Codigo | Descripcion |
| --- | --- | --- |
| Cierre | `REQUEST_CLOSED` | Motivo recomendado si el cierre no deriva de una aprobacion natural. |

### Decision funcional

El cierre es manual durante el MVP. Esta decision separa:

- La autoridad que toma la decision (Despacho, Departamento).
- La responsabilidad de comunicar y cerrar administrativamente el expediente (Secretaria).

El Despacho del Alcalde no obtiene permiso de cierre automaticamente como funcion ordinaria. La matriz de permisos asigna `requests:close` a `MAYOR_OFFICE`, pero su uso debe estar restringido a:

- Contingencias operativas.
- Reglas especiales aprobadas.
- Solicitudes que el Despacho rechazo o firmo y requiere cierre inmediato.

**Nota:** La Issue 4 puede definir un permiso excepcional de contingencia sin cambiar al actor responsable ordinario (Secretaria).

---

## 7. Acciones sin cambio de estado

El Despacho del Alcalde puede realizar las siguientes acciones sobre solicitudes sin cambiar su estado:

| Accion | Permiso | Estados donde aplica | Efecto | Evento de auditoria |
| --- | --- | --- | --- | --- |
| Consultar solicitudes | `requests:view_all` | Todos | Alcance global. | No genera evento (lectura). |
| Consultar auditoria | `requests:view_audit` | Todos | Alcance global. | No genera evento (lectura). |
| Editar campos autorizados | `requests:update` | `awaiting_mayor_signature` | Modifica campos permitidos. | Segun el campo modificado. |
| Cambiar prioridad | `requests:set_priority` | `awaiting_mayor_signature` | Actualiza prioridad. | `REQUEST_PRIORITY_CHANGED`. |
| Cambiar fecha limite | `requests:set_deadline` | `awaiting_mayor_signature` | Actualiza fecha limite. | `REQUEST_DEADLINE_CHANGED`. |
| Agregar observacion interna | Permiso futuro / `requests:update` | `awaiting_mayor_signature` | Registra observacion. | `REQUEST_INTERNAL_OBSERVATION_ADDED`. |

### Restricciones

- No puede editar campos departamentales o de decision sin permiso.
- No puede modificar datos iniciales del ciudadano sin autorizacion.
- La edicion debe respetar el estado vigente de la solicitud.

---

## 8. Acciones bloqueadas para el Despacho

El Despacho del Alcalde **no puede** realizar las siguientes acciones:

| Accion bloqueada | Actor responsable | Justificacion |
| --- | --- | --- |
| **Crear solicitudes** | Secretaria | La recepcion es funcion de Secretaria. |
| **Asignar departamento inicial** | Secretaria | La asignacion inicial corresponde a Secretaria. |
| **Aprobar a nivel departamental** | Personal de Departamento | La aprobacion departamental corresponde al Departamento. |
| **Rechazar a nivel departamental** | Personal de Departamento | El rechazo departamental corresponde al Departamento. |
| **Iniciar revision** | Personal de Departamento | La revision formal corresponde al Departamento. |
| **Marcar como vista** | Personal de Departamento | Marcar como vista es una accion departamental. |
| **Enviar al despacho** | Personal de Departamento | El escalamiento es una decision departamental. |
| **Cambiar estado generico** | Ninguno | No se permite enviar `statusId` arbitrario. |
| **Administrar usuarios** | Administrador | Gestion de usuarios es funcion del Administrador. |

---

## 9. Eventos de auditoria asociados

### Transiciones del Despacho

| Transicion | Accion | Evento | Motivo / Observacion |
| --- | --- | --- | --- |
| `awaiting_mayor_signature -> signed` | Firmar | `REQUEST_SIGNED` | Sin motivo; observacion opcional. |
| `awaiting_mayor_signature -> returned_to_department` | Devolver | `REQUEST_RETURNED_TO_DEPARTMENT` | Motivo obligatorio, observacion obligatoria. |
| `awaiting_mayor_signature -> rejected_by_mayor_office` | Rechazar | `REQUEST_REJECTED_BY_MAYOR_OFFICE` | Motivo obligatorio, observacion obligatoria. |
| `awaiting_mayor_signature -> assigned_to_department` | Reasignar | `REQUEST_DEPARTMENT_REASSIGNED` | Motivo obligatorio, observacion recomendada. |
| `signed -> closed` | Cerrar | `REQUEST_CLOSED` | Motivo recomendado. |
| `rejected_by_mayor_office -> closed` | Cerrar | `REQUEST_CLOSED` | Motivo recomendado. |

### Acciones sin cambio de estado

| Accion | Evento | Motivo / Observacion |
| --- | --- | --- |
| Cambiar prioridad | `REQUEST_PRIORITY_CHANGED` | Observacion opcional, recomendada si existe justificacion. |
| Cambiar fecha limite | `REQUEST_DEADLINE_CHANGED` | Motivo u observacion recomendada. |
| Agregar observacion interna | `REQUEST_INTERNAL_OBSERVATION_ADDED` | Observacion obligatoria. |

### Eventos que NO genera el Despacho

| Evento | Actor que lo genera | Razon |
| --- | --- | --- |
| `REQUEST_CREATED` | Secretaria | Creacion de la solicitud. |
| `REQUEST_DEPARTMENT_ASSIGNED` | Secretaria | Asignacion inicial. |
| `REQUEST_REVIEW_STARTED` | Personal de Departamento | Inicio de revision. |
| `REQUEST_APPROVED_BY_DEPARTMENT` | Personal de Departamento | Aprobacion departamental. |
| `REQUEST_REJECTED_BY_DEPARTMENT` | Personal de Departamento | Rechazo departamental. |
| `REQUEST_SENT_TO_MAYOR_OFFICE` | Personal de Departamento | Envio al despacho. |
| `STATUS_CHANGED` | Solo excepciones | Cambio generico no oficial. |

### Regla de no duplicidad

- Si existe un evento especifico para una transicion, **no se debe registrar ademas** `STATUS_CHANGED`.
- `STATUS_CHANGED` solo se usa como respaldo para correcciones manuales fuera del flujo oficial.
- Cada transicion unica debe producir **un solo evento funcional principal**.

### Informacion minima a registrar en cada transicion

| Transicion | Informacion minima |
| --- | --- |
| Firma | `previousStatus`, `newStatus`, `signed_at`, `signed_by_id`, usuario que ejecuto la accion. |
| Devolucion | `previousStatus`, `newStatus`, motivo de devolucion, observacion, usuario que ejecuto la accion. |
| Rechazo desde despacho | `previousStatus`, `newStatus`, motivo de rechazo, `decision_at`, usuario que ejecuto la accion. |
| Reasignacion | `previousStatus`, `newStatus`, departamento anterior, departamento nuevo, motivo, usuario que ejecuto la accion. |
| Cierre | `previousStatus`, `newStatus`, motivo (si aplica), usuario que ejecuto la accion. |

---

## 10. Compatibilidad con la matriz de permisos

El diseno es compatible con la matriz oficial de permisos del Sprint 3 (`docs/sprint-03-permission-matrix.md`).

### Permisos asignados a MAYOR_OFFICE

| Permiso | Asignado | Alcance | Cubre la accion |
| --- | --- | --- | --- |
| `requests:view_all` | **Si** | Global | Consultar todas las solicitudes. |
| `requests:view_audit` | **Si** | Global | Consultar auditoria completa. |
| `requests:update` | **Si** | Global | Editar campos autorizados. |
| `requests:assign_department` | **Si** | Global | Reasignar a otro departamento. |
| `requests:set_priority` | **Si** | Global | Cambiar prioridad. |
| `requests:set_deadline` | **Si** | Global | Cambiar fecha limite. |
| `requests:return_to_department` | **Si** | Global | Devolver al departamento. |
| `requests:reject_mayor_office` | **Si** | Global | Rechazar desde el despacho. |
| `requests:sign` | **Si** | Global | Firmar solicitud. |
| `requests:close` | **Si** | Global | Cerrar solicitud (bajo ciertas condiciones). |

### Permisos bloqueados para MAYOR_OFFICE

| Permiso | Asignado | Actor responsable |
| --- | --- | --- |
| `requests:create` | **No** | Secretaria |
| `requests:upload_documents` | **No** | Secretaria |
| `requests:mark_viewed` | **No** | Personal de Departamento |
| `requests:start_review` | **No** | Personal de Departamento |
| `requests:approve_department` | **No** | Personal de Departamento |
| `requests:reject_department` | **No** | Personal de Departamento |
| `requests:send_to_mayor_office` | **No** | Personal de Departamento |
| `requests:approve_mayor_office` | **No** | No aplica (firma representa aprobacion) |
| `users:*` | **No** | Administrador |

### Validacion de compatibilidad

| Criterio | Resultado |
| --- | --- |
| Acciones permitidas tienen permiso | **Si**. Todas las transiciones del Despacho (`sign`, `return_to_department`, `reject_mayor_office`, `assign_department`, `close`) estan asignadas a `MAYOR_OFFICE`. |
| Acciones bloqueadas no tienen permiso | **Si**. Ninguna de las acciones bloqueadas (crear, iniciar revision, aprobar/rechazar a nivel departamental) esta asignada a `MAYOR_OFFICE`. |
| Alcance apropiado | **Si**. El Despacho tiene alcance global, pero cada accion sigue requiriendo estado compatible y datos obligatorios. |
| Estado compatible | **Si**. El Despacho solo puede ejecutar sus transiciones desde `awaiting_mayor_signature` (y cierre desde estados de resultado). |

---

## 11. Flujo funcional del Despacho del Alcalde

```text
Despacho del Alcalde
  |
  +-- (Solicitud en awaiting_mayor_signature)
  |     +-- Consultar solicitud y documentos
  |     +-- Consultar auditoria completa
  |     +-- Editar campos autorizados (si aplica)
  |     +-- Cambiar prioridad o fecha limite (si aplica)
  |     +-- Agregar observaciones internas
  |
  +-- Decisiones posibles desde awaiting_mayor_signature
  |     |
  |     +-- Firmar (aprobar)
  |     |     +-- Transicion: awaiting_mayor_signature -> signed
  |     |     +-- Evento: REQUEST_SIGNED
  |     |     +-- Datos: signed_at, signed_by_id
  |     |     +-- Restriccion: requiere permiso explicito de firma
  |     |
  |     +-- Devolver al departamento
  |     |     +-- Transicion: awaiting_mayor_signature -> returned_to_department
  |     |     +-- Evento: REQUEST_RETURNED_TO_DEPARTMENT
  |     |     +-- Datos: motivo obligatorio
  |     |     +-- Restriccion: el departamento debe reiniciar revision
  |     |
  |     +-- Rechazar desde despacho
  |     |     +-- Transicion: awaiting_mayor_signature -> rejected_by_mayor_office
  |     |     +-- Evento: REQUEST_REJECTED_BY_MAYOR_OFFICE
  |     |     +-- Datos: decision_at, motivo obligatorio
  |     |     +-- Restriccion: no vuelve al departamento
  |     |
  |     +-- Reasignar a otro departamento
  |     |     +-- Transicion: awaiting_mayor_signature -> assigned_to_department
  |     |     +-- Evento: REQUEST_DEPARTMENT_REASSIGNED
  |     |     +-- Datos: nuevo department_id, motivo obligatorio
  |     |     +-- Restriccion: nuevo departamento debe estar activo
  |     |
  |     +-- (No puede: crear, iniciar revision, aprobar/rechazar a nivel depto)
  |
  +-- Cierre desde el Despacho (condicional)
  |     +-- Desde signed -> closed
  |     |     +-- Evento: REQUEST_CLOSED
  |     |     +-- Requiere permiso requests:close
  |     +-- Desde rejected_by_mayor_office -> closed
  |     |     +-- Evento: REQUEST_CLOSED
  |     |     +-- Requiere permiso requests:close
  |     +-- Nota: cierre ordinario corresponde a Secretaria
  ```

---

## 12. Decisiones resueltas

| Decision | Resolucion |
| --- | --- |
| Firma | El Despacho puede firmar (`awaiting_mayor_signature -> signed`) con permiso explicito `requests:sign`. La firma es logica, no digital certificada. |
| Devolucion | El Despacho puede devolver (`awaiting_mayor_signature -> returned_to_department`) con motivo obligatorio. El departamento debe reiniciar revision. |
| Rechazo desde despacho | El Despacho puede rechazar (`awaiting_mayor_signature -> rejected_by_mayor_office`) con motivo obligatorio. No vuelve al departamento. |
| Reasignacion | El Despacho puede reasignar a otro departamento con motivo obligatorio. |
| Cierre desde despacho | El Despacho puede cerrar desde `signed` o `rejected_by_mayor_office` con permiso `requests:close`, pero el cierre ordinario corresponde a Secretaria. |
| Aprobacion del despacho | No existe transicion `approve_mayor_office`. La aprobacion del despacho se representa como firma (`requests:sign`). |
| Alcance | El Despacho tiene visibilidad global, pero cada accion requiere permiso + estado compatible + datos obligatorios. |

---

## 13. Decisiones pendientes de validacion externa

| Punto | Impacto en el Despacho |
| --- | --- |
| **Si todos los usuarios de MAYOR_OFFICE pueden firmar** | La matriz de permisos asigna `requests:sign` a todo el rol, pero puede requerirse una separacion adicional dentro del despacho (ej. solo el alcalde o subrogante). |
| **Si el Despacho debe poder cerrar solicitudes aprobadas por departamento** | Actualmente el cierre de `approved_by_department` y `rejected_by_department` corresponde a Secretaria. El Despacho solo puede cerrar sus propios resultados (`signed`, `rejected_by_mayor_office`). |
| **Si existe permiso excepcional de cierre para contingencias** | Define si el Despacho puede cerrar cualquier solicitud en caso de emergencia operativa. |
| **Formato de la firma logica** | Define si la firma requiere un token, contrasena o solo confirmacion en el sistema. |

---

## 14. Referencias

- `docs/v3-3-1-documentar-catalogo-estados.md` — Catalogo tecnico de los 10 estados oficiales.
- `docs/v3-3-3-definir-transiciones-departamento.md` — Transiciones del Departamento (incluye envio al despacho).
- `docs/sprint-03-official-roles.md` — Definicion de actores, responsabilidades y restricciones del Despacho del Alcalde.
- `docs/sprint-03-permission-matrix.md` — Matriz oficial de permisos por rol para validar quien puede actuar.
- `docs/sprint-03-official-states.md` — Comportamiento detallado de cada estado, incluyendo `awaiting_mayor_signature`, `signed`, `returned_to_department` y `rejected_by_mayor_office`.
- `docs/v3-5-2-consolidar-eventos-flujo-solicitudes.md` — Catalogo de eventos auditables y reglas de no duplicidad.

---

## Resultado esperado

Disponer de una definicion clara y validada de las acciones que puede ejecutar el Despacho del Alcalde dentro del flujo de solicitudes, garantizando que los procesos de firma, rechazo y devolucion respeten los estados oficiales, los permisos definidos y los requisitos de auditoria establecidos para el Sprint 3.

---

*Documento generado para la subissue V3-3.4. El detalle funcional completo de cada estado se encuentra en `docs/v3-3-1-documentar-catalogo-estados.md` y `docs/sprint-03-official-states.md`.*
