# Consolidacion de eventos del flujo de solicitudes

## Contexto

Este documento define el catalogo funcional de eventos auditables para el flujo
operativo de solicitudes.

Su proposito es evitar duplicidad entre eventos especificos y eventos genericos
como `STATUS_CHANGED`, de modo que cada accion relevante del ciclo de vida de
una solicitud pueda reconstruirse de forma clara y consistente.

Este documento complementa el catalogo oficial definido en la subissue 5.1.

## Objetivo

- Relacionar cada accion importante con un evento auditable.
- Definir cuando corresponde usar un evento especifico.
- Definir cuando corresponde usar `STATUS_CHANGED`.
- Establecer reglas de motivo y observacion.
- Mantener consistencia con la maquina de estados y el catalogo tecnico de
  estados.

## Alcance

- Flujo de solicitudes ciudadanas.
- Transiciones oficiales de estado.
- Acciones operativas relevantes.
- Reglas de uso del catalogo de eventos.

## Fuera de alcance

- Implementar eventos.
- Registrar eventos en codigo.
- Modificar `request_history`.
- Crear migraciones.
- Implementar servicios de auditoria.
- Implementar puntos finales.
- Implementar logica transaccional.
- Modificar controladores.

## Criterios de nomenclatura

- Los codigos tecnicos usan `UPPER_SNAKE_CASE`.
- Cada evento representa una accion unica.
- El nombre funcional debe ser estable y sin ambiguedad.
- El evento generico `STATUS_CHANGED` solo se usa como respaldo o correccion
  fuera del flujo oficial.
- Los eventos especificos tienen prioridad sobre el evento generico.

## Catalogo consolidado de eventos

La siguiente tabla define el significado funcional, la accion asociada, la
transicion relacionada y las reglas de uso.

| Codigo tecnico | Significado funcional | Accion asociada | Transicion asociada | Reglas de uso | Motivo u observacion |
| --- | --- | --- | --- | --- | --- |
| `REQUEST_CREATED` | La solicitud ingresa al sistema | Creacion de solicitud | `received` | Se registra una sola vez al crear la solicitud. No se duplica con eventos de estado. | Observacion opcional. |
| `DOCUMENT_UPLOADED` | Se adjunta un documento a la solicitud | Carga de documento | Sin cambio de estado obligatorio | Se registra por cada carga real de documento. | Observacion opcional. |
| `REQUEST_DEPARTMENT_ASSIGNED` | Se asigna el departamento responsable | Asignacion de departamento | `assigned_to_department` | Se usa en la asignacion inicial. No debe duplicarse con `STATUS_CHANGED`. | Observacion opcional. |
| `REQUEST_DEPARTMENT_REASSIGNED` | Se cambia el departamento responsable | Reasignacion de departamento | `assigned_to_department` u otra transicion definida por flujo | Se usa solo cuando ya existia un departamento previo. | Observacion recomendada. |
| `REQUEST_PRIORITY_CHANGED` | Se modifica la prioridad | Cambio de prioridad | Sin cambio de estado obligatorio | Se registra cada vez que la prioridad cambia realmente. | Observacion opcional, recomendada si existe justificacion. |
| `REQUEST_DEADLINE_SET` | Se define la fecha limite por primera vez | Definicion de fecha limite | Sin cambio de estado obligatorio | Se usa cuando la solicitud aun no tenia fecha limite. | Motivo u observacion opcional. |
| `REQUEST_DEADLINE_CHANGED` | Se modifica una fecha limite existente | Actualizacion de fecha limite | Sin cambio de estado obligatorio | Se usa cuando ya existia una fecha limite previa. | Motivo u observacion recomendada. |
| `REQUEST_VIEWED` | La solicitud fue vista por el area responsable | Visualizacion operativa | Normalmente `received` o `assigned_to_department` segun el punto del flujo | Se registra solo cuando la vista tiene valor operativo; no por cada apertura repetida. | Sin motivo; observacion opcional. |
| `REQUEST_REVIEW_STARTED` | La revision formal comienza | Inicio de revision | `in_review` | Se usa una sola vez por ciclo de revision. | Sin motivo; observacion opcional. |
| `REQUEST_INTERNAL_OBSERVATION_ADDED` | Se agrega una observacion interna | Registro de observacion | Sin cambio de estado obligatorio | Cada observacion valida genera su propio evento. | Observacion obligatoria porque es el contenido del evento. |
| `STATUS_CHANGED` | Cambio generico de estado | Transicion tecnica o correccion excepcional | Cualquier estado autorizado | Solo se usa si no existe un evento especifico del flujo o si se trata de una correccion fuera del flujo oficial. No debe coexistir con un evento especifico para la misma accion. | Motivo u observacion obligatorios. |
| `REQUEST_APPROVED_BY_DEPARTMENT` | El departamento aprueba la solicitud | Aprobacion departamental | `approved_by_department` | Se usa en la aprobacion oficial del departamento. No se acompana con `STATUS_CHANGED`. | Motivo opcional, observacion opcional. |
| `REQUEST_REJECTED_BY_DEPARTMENT` | El departamento rechaza la solicitud | Rechazo departamental | `rejected_by_department` | Se usa en el rechazo oficial del departamento. | Motivo obligatorio, observacion obligatoria. |
| `REQUEST_SENT_TO_MAYOR_OFFICE` | La solicitud sube al despacho del alcalde | Envio a Alcaldia | `awaiting_mayor_signature` o la transicion definida por la maquina de estados | Se usa cuando la solicitud pasa a una decision superior. | Observacion recomendada, motivo opcional segun flujo. |
| `REQUEST_RETURNED_TO_DEPARTMENT` | La solicitud regresa al departamento | Devolucion al departamento | `returned_to_department` | Se usa solo si la solicitud vuelve a revision departamental. | Motivo obligatorio, observacion obligatoria. |
| `REQUEST_REJECTED_BY_MAYOR_OFFICE` | El despacho rechaza la solicitud | Rechazo desde Alcaldia | `rejected_by_mayor_office` | Se usa en la decision negativa del despacho. | Motivo obligatorio, observacion obligatoria. |
| `REQUEST_SIGNED` | La solicitud queda firmada | Firma final | `signed` | Se usa cuando la firma oficial completa el proceso. | Sin motivo; observacion opcional. |
| `REQUEST_CLOSED` | La solicitud se cierra formalmente | Cierre de solicitud | `closed` | Se usa al finalizar el caso. | Motivo recomendado si el cierre no deriva de una aprobacion natural. |

## Relacion accion-evento

### Acciones que siempre deben tener evento especifico

- Creacion de solicitudes.
- Carga de documentos.
- Asignacion de departamento.
- Reasignacion de departamento.
- Cambio de prioridad.
- Definicion o cambio de fecha limite.
- Visualizacion operativa.
- Inicio de revision.
- Observaciones internas.
- Aprobacion departamental.
- Rechazo departamental.
- Envio al despacho del alcalde.
- Devolucion al departamento.
- Rechazo desde Alcaldia.
- Firma.
- Cierre.

### Cuando usar `STATUS_CHANGED`

Usar `STATUS_CHANGED` solo en estos casos:

- Correcciones manuales de estado fuera del flujo oficial.
- Ajustes tecnicos o administrativos que no representan una accion funcional
  especifica.
- Compatibilidad temporal mientras una transicion oficial no tenga evento
  propio en el catalogo.

No usar `STATUS_CHANGED` cuando ya exista un evento especifico para la misma
accion. Ejemplos:

- `REQUEST_REVIEW_STARTED` no debe duplicarse con `STATUS_CHANGED`.
- `REQUEST_APPROVED_BY_DEPARTMENT` no debe duplicarse con `STATUS_CHANGED`.
- `REQUEST_REJECTED_BY_DEPARTMENT` no debe duplicarse con `STATUS_CHANGED`.
- `REQUEST_RETURNED_TO_DEPARTMENT` no debe duplicarse con `STATUS_CHANGED`.
- `REQUEST_SIGNED` no debe duplicarse con `STATUS_CHANGED`.

## Reglas para motivo y observacion

### Requieren motivo y observacion

- `STATUS_CHANGED`
- `REQUEST_REJECTED_BY_DEPARTMENT`
- `REQUEST_REJECTED_BY_MAYOR_OFFICE`
- `REQUEST_RETURNED_TO_DEPARTMENT`
- `REQUEST_DEPARTMENT_REASSIGNED`

### Requieren al menos observacion

- `REQUEST_INTERNAL_OBSERVATION_ADDED`
- `REQUEST_DEADLINE_CHANGED`
- `REQUEST_PRIORITY_CHANGED`
- `REQUEST_SENT_TO_MAYOR_OFFICE` si el flujo funcional exige aclaracion
- `REQUEST_CLOSED` si el cierre requiere justificacion operativa

### Pueden registrarse sin motivo ni observacion

- `REQUEST_CREATED`
- `DOCUMENT_UPLOADED`
- `REQUEST_DEPARTMENT_ASSIGNED`
- `REQUEST_VIEWED`
- `REQUEST_REVIEW_STARTED`
- `REQUEST_APPROVED_BY_DEPARTMENT`
- `REQUEST_SIGNED`

## Reglas contra duplicidad

1. En una misma operacion no se deben registrar dos eventos con el mismo
   significado.
2. Si existe un evento especifico, no se debe registrar ademas `STATUS_CHANGED`
   para la misma accion.
3. El evento generico solo es valido como respaldo o correccion excepcional.
4. Una accion unica debe producir un solo evento funcional principal.
5. Si una operacion incluye una accion de negocio y una correccion tecnica,
   ambas deben quedar claramente separadas.

## Compatibilidad con la maquina de estados

Este catalogo debe coincidir con el flujo oficial de estados:

- `received`
- `assigned_to_department`
- `in_review`
- `approved_by_department`
- `rejected_by_department`
- `awaiting_mayor_signature`
- `signed`
- `returned_to_department`
- `rejected_by_mayor_office`
- `closed`

La correlacion esperada es:

- `REQUEST_CREATED` -> `received`
- `REQUEST_DEPARTMENT_ASSIGNED` -> `assigned_to_department`
- `REQUEST_REVIEW_STARTED` -> `in_review`
- `REQUEST_APPROVED_BY_DEPARTMENT` -> `approved_by_department`
- `REQUEST_REJECTED_BY_DEPARTMENT` -> `rejected_by_department`
- `REQUEST_SENT_TO_MAYOR_OFFICE` -> `awaiting_mayor_signature`
- `REQUEST_SIGNED` -> `signed`
- `REQUEST_RETURNED_TO_DEPARTMENT` -> `returned_to_department`
- `REQUEST_REJECTED_BY_MAYOR_OFFICE` -> `rejected_by_mayor_office`
- `REQUEST_CLOSED` -> `closed`

## Casos pendientes de validacion

- Definir si `REQUEST_VIEWED` se registra por usuario, por departamento o una
  sola vez por solicitud.
- Confirmar si `REQUEST_DEADLINE_SET` aplica solo en creacion o tambien en
  asignaciones posteriores.
- Confirmar si `REQUEST_SENT_TO_MAYOR_OFFICE` debe reflejar una sola transicion
  o una secuencia de validacion y envio.
- Confirmar el tratamiento funcional de un posible evento de "negocio" si se
  requiere separar una accion administrativa de una accion operativa.
- Confirmar si `STATUS_CHANGED` debe mantenerse solo para excepciones o si
  tambien convivira con eventos de transicion internos en escenarios heredados.

## Resultado esperado

Disponer de un catalogo oficial y consistente de eventos auditables para
solicitudes, garantizando que cada accion relevante del flujo pueda registrarse
correctamente sin duplicidades ni ambiguedades durante la implementacion
posterior.
