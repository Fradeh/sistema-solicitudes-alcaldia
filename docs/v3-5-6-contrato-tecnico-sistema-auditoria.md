# V3-5.6 Disenar el contrato tecnico del sistema de auditoria

## Metadatos

| Campo | Valor |
| --- | --- |
| **Revisor** | @Fradeh |
| **Tipo** | Diseno tecnico |
| **Dependencias** | Subissue 5.1 - Definir el catalogo oficial de eventos auditables; Subissue 5.2 - Consolidar eventos del flujo de solicitudes; Subissue 5.3 - Consolidar eventos administrativos; Subissue 5.4 - Definir la informacion registrada en `request_history`; Subissue 5.5 - Definir politicas de almacenamiento y consulta de auditoria; Subissue 3.6 - Disenar el contrato tecnico del `RequestTransitionService`; Subissue 4.6 - Disenar el contrato tecnico de autorizacion |
| **Fuentes** | `docs/sprint-03-gap-analysis.md`, `docs/sprint-03-official-roles.md`, `docs/sprint-03-official-states.md`, `docs/sprint-03-permission-matrix.md`, `docs/v3-5-1-catalogo-eventos-auditables.md`, `docs/v3-5-2-consolidar-eventos-flujo-solicitudes.md`, `docs/v3-5-3-catalogo-eventos-administrativos.md`, `docs/v3-5-4-definir-informacion-request-history.md`, `docs/v3-5-5-politicas-almacenamiento-consulta-auditoria.md` |

## Proposito

Este documento define el contrato tecnico que utilizaran los componentes del sistema para registrar eventos de auditoria e historial de manera consistente y centralizada.

El objetivo es establecer una unica estrategia para registrar eventos en `request_history` y `audit_logs`, evitando duplicacion de logica y garantizando uniformidad en los registros generados.

## Alcance

- Responsabilidades del sistema de auditoria.
- Contrato de entrada para registrar eventos.
- Contrato de salida del registro.
- Reglas de enrutamiento hacia `request_history` y `audit_logs`.
- Manejo de errores.
- Integracion con transiciones, autorizacion y servicios administrativos.

## Fuera de alcance

- Implementar servicios de auditoria.
- Crear migraciones.
- Registrar eventos en codigo.
- Implementar persistencia.
- Implementar consultas.
- Implementar filtros.
- Crear puntos finales.
- Modificar tablas existentes.
- Implementar logica transaccional.

## Criterios de aceptacion

- [x] Existe una estrategia centralizada para registrar auditoria.
- [x] El contrato de entrada esta documentado.
- [x] El contrato de salida esta documentado.
- [x] Las reglas para `request_history` estan documentadas.
- [x] Las reglas para `audit_logs` estan documentadas.
- [x] Se evita duplicidad entre historial y auditoria administrativa.
- [x] Los errores esperados estan documentados.
- [x] La integracion con transiciones esta documentada.
- [x] La integracion con autorizacion esta documentada.
- [x] La integracion con servicios administrativos esta documentada.
- [x] El diseno es compatible con el modelo de datos aprobado.
- [x] El diseno puede implementarse sin redefinir eventos ni contratos.

## Principios del contrato

1. Toda operacion auditable debe entrar por un contrato comun de alto nivel.
2. El contrato comun no debe imponer una sola tabla de destino.
3. El enrutamiento debe decidir si el evento pertenece a `request_history`, `audit_logs` o ambos segun la naturaleza del evento.
4. Los datos estructurados no deben esconderse solo en `metadata`.
5. Los eventos operativos y administrativos comparten formato base, pero no necesariamente el mismo destino.
6. La persistencia debe ser atomica dentro del ambito que corresponda.
7. El contrato debe ser usable por transiciones, permisos y servicios administrativos sin duplicar reglas.

## Responsabilidades del sistema de auditoria

### Registrar eventos operativos

- Registrar acciones del ciclo de vida de una solicitud.
- Conservar el contexto de estado, asignacion, observacion o cambio relevante.
- Mantener secuencia cronologica reconstruible.

### Registrar eventos administrativos

- Registrar cambios sobre usuarios, roles, permisos y departamentos.
- Conservar el actor, recurso y valores anteriores/nuevos.
- Separar estos eventos del historial operativo.

### Registrar cambios de estado

- Capturar el estado anterior y el estado nuevo.
- Asociar el cambio al usuario que ejecuto la transicion.
- Evitar que un cambio de estado se registre sin evento valido.

### Registrar cambios de departamento

- Capturar departamento anterior y nuevo.
- Mantener el evento asociado al recurso correcto.
- Registrar la reasignacion sin ambiguedad funcional.

### Registrar cambios de asignacion

- Capturar usuario asignado anterior y nuevo.
- Separar asignacion de estado cuando aplique.
- Evitar duplicidad entre reasignacion y cambio de estado si el flujo ya define ambos explicitamente.

### Registrar acciones protegidas

- Registrar acciones que requieran permiso explicito.
- Conservar el contexto minimo para auditoria y trazabilidad.
- No asumir que toda accion protegida cambia estado.

### Registrar observaciones asociadas

- Conservar observaciones internas cuando formen parte del evento.
- No usar observacion como sustituto de campos estructurados.
- Respetar las reglas de sensibilidad definidas en la politica de consulta.

## Contrato de entrada

### Contrato base

El sistema de auditoria debe recibir una solicitud de registro con esta estructura funcional minima:

```ts
type AuditEventInput = {
  eventType: string;
  actorUserId: string;
  occurredAt: string;
  resource: {
    type: string;
    id: string;
  };
  observation?: string | null;
  metadata?: Record<string, unknown> | null;
  previousValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  context?: {
    requestId?: string | null;
    departmentId?: string | null;
    roleId?: string | null;
    permissionCode?: string | null;
    correlationId?: string | null;
  } | null;
};
```

### Campos obligatorios

| Campo | Obligatorio | Descripcion |
| --- | --- | --- |
| `eventType` | Si | Codigo tecnico del evento. |
| `actorUserId` | Si | Usuario responsable de la accion. |
| `occurredAt` | Si | Fecha y hora del hecho. |
| `resource.type` | Si | Tipo de recurso afectado. |
| `resource.id` | Si | Identificador del recurso afectado. |

### Campos condicionales

| Campo | Condicion | Uso |
| --- | --- | --- |
| `observation` | Segun evento | Motivo, comentario o detalle complementario. |
| `metadata` | Segun contexto | Correlacion, canal, origen o datos no estructurados. |
| `previousValues` | Cuando exista estado previo | Valores antes del cambio. |
| `newValues` | Cuando exista nuevo estado | Valores despues del cambio. |
| `context.requestId` | Si el evento pertenece a una solicitud | Vinculacion con `request_history`. |
| `context.departmentId` | Si el evento involucra departamento | Vinculacion organizacional. |
| `context.roleId` | Si el evento involucra rol | Vinculacion administrativa. |
| `context.permissionCode` | Si el evento involucra permiso | Vinculacion de autorizacion. |
| `context.correlationId` | Recomendado | Correlacion entre servicios y registros. |

### Reglas de validacion de entrada

- El `eventType` debe existir en el catalogo oficial.
- El `actorUserId` debe corresponder a un usuario existente y activo, salvo excepcion de sistema tecnicamente aprobada.
- `metadata` no puede reemplazar campos estructurados obligatorios.
- `previousValues` y `newValues` deben respetar el tipo de evento.
- El recurso afectado debe ser identificable al momento del registro.

## Contrato de salida

El sistema de auditoria debe responder con una confirmacion estructurada del registro.

```ts
type AuditEventResult = {
  success: boolean;
  eventId?: string;
  storedIn?: 'request_history' | 'audit_logs' | 'both';
  eventType?: string;
  resource?: {
    type: string;
    id: string;
  };
  persistedAt?: string;
  message: string;
};
```

### Salida esperada

| Campo | Descripcion |
| --- | --- |
| `success` | Indica si el registro fue persistido correctamente. |
| `eventId` | Identificador tecnico del evento registrado. |
| `storedIn` | Indica el destino de persistencia aplicado. |
| `eventType` | Codigo tecnico confirmado. |
| `resource` | Recurso auditado confirmado. |
| `persistedAt` | Marca temporal efectiva de persistencia. |
| `message` | Resultado legible de la operacion. |

### Confirmaciones minimas

- Confirmacion de persistencia.
- Identificador del evento registrado.
- Resultado de la operacion.
- Destino de almacenamiento aplicado.

## Reglas de enrutamiento

### Cuando registrar en `request_history`

Registrar en `request_history` cuando el evento pertenezca al ciclo de vida de una solicitud:

- Creacion de solicitud.
- Cambio de estado.
- Cambio de departamento de la solicitud.
- Cambio de asignacion de la solicitud.
- Observacion interna de solicitud.
- Accion operativa directamente vinculada al expediente.

### Cuando registrar en `audit_logs`

Registrar en `audit_logs` cuando el evento pertenezca a actividad administrativa o de supervision no ligada exclusivamente a una solicitud:

- Creacion, edicion o desactivacion de usuarios.
- Asignacion o remocion de roles.
- Asignacion o remocion de permisos.
- Creacion, edicion o desactivacion de departamentos.
- Acciones administrativas de configuracion.

### Cuando registrar en ambos

Solo deberia registrarse en ambos mecanismos cuando exista una operacion compuesta que:

- Tenga un efecto operativo sobre una solicitud.
- Y simultaneamente produzca una huella administrativa necesaria para supervision.

En ese caso:

- `request_history` conserva la trazabilidad del expediente.
- `audit_logs` conserva la huella administrativa o de supervision.
- Ambos registros deben compartir `correlationId`.

### Reglas para evitar duplicidad

1. Un mismo hecho funcional no debe registrarse dos veces en el mismo mecanismo.
2. No se debe crear un duplicado textual de `request_history` dentro de `audit_logs` solo por conveniencia tecnica.
3. Si un evento ya pertenece a `request_history`, `audit_logs` solo debe recibir una copia cuando haya una justificacion de supervision o control adicional.
4. Si un evento solo es administrativo, no debe entrar a `request_history`.
5. Si una accion produce un evento principal y un evento derivado, ambos deben estar claramente diferenciados por el contrato y por el catalogo.

## Manejo de errores

### Errores esperados

| Codigo sugerido | Condicion | Respuesta esperada |
| --- | --- | --- |
| `AUDIT_EVENT_INVALID` | El evento no existe o no esta permitido. | Rechazar el registro. |
| `AUDIT_PAYLOAD_INCOMPLETE` | Faltan campos obligatorios. | Rechazar el registro. |
| `AUDIT_USER_NOT_FOUND` | No se encontro el usuario responsable. | Rechazar el registro. |
| `AUDIT_RESOURCE_NOT_FOUND` | No se encontro el recurso afectado. | Rechazar el registro. |
| `AUDIT_METADATA_INVALID` | La metadata no cumple la estructura permitida. | Rechazar el registro. |
| `AUDIT_PERSISTENCE_ERROR` | Error al guardar el evento. | Reportar fallo de persistencia. |
| `AUDIT_EVENT_DUPLICATED` | Se intento registrar dos veces el mismo hecho en el mismo flujo. | Rechazar o ignorar segun politica. |

### Criterios de error

- Los errores de validacion deben ocurrir antes de persistir.
- Los errores de persistencia deben conservar contexto tecnico sin exponer datos sensibles.
- El contrato debe diferenciar error de validacion, error de negocio y error tecnico.
- Si falta un recurso critico, el sistema no debe intentar persistir un evento incompleto.

### Sobre la referencia a "apelacion"

Cuando un requerimiento mencione un recurso no encontrado o una solicitud de auditoria inexistente, el contrato debe tratarlo como:

- recurso no encontrado,
- operacion no encontrada, o
- contexto no disponible,

segun el caso concreto. El contrato no depende de una entidad de "apelacion" como concepto funcional del sistema.

## Integracion futura

### Servicio de transicion de solicitud

- Debe invocar el contrato comun de auditoria cuando ejecute una transicion.
- Debe enviar `previousValues`, `newValues` y `context.requestId`.
- No debe duplicar reglas que ya pertenezcan al sistema de auditoria.

### Guards de autorizacion

- Deben decidir si la accion es permitida.
- El sistema de auditoria no reemplaza la autorizacion.
- Los guards pueden aportar contexto al evento, pero no definir el catalogo.

### Servicios administrativos

- Deben registrar eventos administrativos mediante el mismo contrato base.
- Deben asignar correctamente el destino `audit_logs`.
- Deben proveer recurso, actor y cambios anteriores/nuevos.

### Historial de solicitudes

- `request_history` es el destino para eventos del expediente.
- Debe integrarse con el contrato comun sin redefinir la estructura funcional.
- Debe conservar la cronologia y los campos estructurados definidos en la Subissue 5.4.

### Auditoria administrativa

- `audit_logs` es el destino para eventos administrativos y de supervision.
- Debe compartir el mismo lenguaje de evento, pero no la misma finalidad que `request_history`.
- Debe poder evolucionar sin romper la nomenclatura oficial.

## Resultado esperado

Disponer de una especificacion tecnica completa para el sistema de auditoria, permitiendo implementar posteriormente el registro de eventos operativos y administrativos de forma consistente, reutilizable y alineada con las reglas de trazabilidad definidas para el Sprint 3.
