# V3-5.4 Definir la informacion registrada en `request_history`

## Metadatos

| Campo | Valor |
| --- | --- |
| **Revisor** | @Fradeh, @Set-RxGg |
| **Tipo** | Diseño funcional |
| **Dependencias** | Subissue 2.3 - Diseñar la ampliación de `request_history`; Subissue 3.6 - Diseñar el contrato técnico del `RequestTransitionService`; Subissue 5.2 - Consolidar eventos del flujo de solicitudes |
| **Fuentes** | `docs/sprint-03-gap-analysis.md`, `docs/sprint-03-official-states.md`, `docs/v3-5-2-consolidar-eventos-flujo-solicitudes.md`, `docs/v3-5-3-catalogo-eventos-administrativos.md` |

## Proposito

Este documento define formalmente qué información debe almacenarse en `request_history` para garantizar trazabilidad completa del ciclo de vida de una solicitud.

El objetivo es que cualquier solicitud pueda reconstruirse cronológicamente a partir de su historial, sin depender de consultas externas para entender qué pasó, cuándo pasó y quién lo ejecutó.

## Alcance

- Información obligatoria por registro histórico.
- Representación funcional de cambios de estado.
- Representación funcional de cambios organizacionales.
- Uso permitido de metadata.
- Reglas de observación.
- Reglas de orden cronológico y reconstrucción histórica.

## Fuera de alcance

- Modificar la tabla `request_history`.
- Crear migraciones.
- Implementar historial.
- Registrar eventos en código.
- Implementar consultas históricas.
- Implementar puntos finales.
- Modificar datos existentes.
- Implementar lógica transaccional.

## Criterios de aceptacion

- [x] Cada registro posee solicitud asociada.
- [x] Cada registro posee evento asociado.
- [x] Cada registro posee usuario responsable.
- [x] Cada registro posee fecha y hora.
- [x] Los cambios de estado quedan documentados.
- [x] Los cambios de departamento quedan documentados.
- [x] Los cambios de asignación quedan documentados.
- [x] El uso de `metadata` está claramente definido.
- [x] La información estructurada no depende únicamente de `metadata`.
- [x] Las reglas para observaciones están documentadas.
- [x] El historial permite reconstruir completamente el flujo de una solicitud.
- [x] Las reglas son compatibles con el diseño de la Issue 2.

## Principios funcionales

1. `request_history` debe comportarse como un registro append-only.
2. Cada evento histórico representa una acción funcional única.
3. La información estructurada principal no debe esconderse solo en `metadata`.
4. El actor responsable siempre debe poder identificarse.
5. La reconstrucción histórica debe poder hacerse en orden cronológico.
6. Los eventos deben ser interpretables sin consultar información externa para conocer su significado básico.
7. Las observaciones complementan el evento, pero no reemplazan campos estructurados.

## Informacion obligatoria por registro

Todo registro histórico debe almacenar como mínimo:

| Dato | Obligatorio | Descripcion |
| --- | --- | --- |
| Solicitud asociada | Si | Identifica la solicitud a la que pertenece el evento. |
| Evento generado | Si | Código técnico del evento auditable. |
| Usuario responsable | Si | Usuario que ejecutó o produjo la acción. |
| Fecha y hora | Si | Marca temporal del momento de registro. |
| Observacion | Depende del evento | Texto libre o motivo complementario cuando aplique. |

## Representacion de cambios de estado

Los cambios de estado deben quedar expresados con información anterior y nueva para permitir reconstrucción del flujo.

| Dato | Obligatorio | Descripcion |
| --- | --- | --- |
| Estado anterior | Si cuando exista estado previo | Estado que tenía la solicitud antes de la transición. |
| Estado nuevo | Si | Estado resultante de la transición. |
| Fecha de transición | Si | Momento exacto en que se ejecutó la transición. |
| Usuario que ejecutó la transición | Si | Actor que originó el cambio. |

### Reglas funcionales para cambios de estado

- Una transición válida debe registrar al menos el estado anterior y el nuevo.
- Si la solicitud nace en `received`, el estado anterior puede ser nulo solo en el evento de creación.
- Los cambios de estado no deben registrarse sin usuario responsable.
- Si la acción implica una decisión formal, la observación o el motivo deben quedar disponibles según el evento.
- Un cambio de estado no debe depender solo de `metadata` para entenderse.

### Ejemplos de uso

- `REQUEST_CREATED`:
  - Estado nuevo: `received`.
  - Estado anterior: nulo.
- `REQUEST_REVIEW_STARTED`:
  - Estado anterior: `assigned_to_department`.
  - Estado nuevo: `in_review`.
- `REQUEST_APPROVED_BY_DEPARTMENT`:
  - Estado anterior: `in_review`.
  - Estado nuevo: `approved_by_department`.
- `STATUS_CHANGED`:
  - Estado anterior y nuevo definidos, más observación obligatoria cuando sea una corrección excepcional.

## Representacion de cambios organizacionales

Los cambios organizacionales deben conservar la relación entre recursos anteriores y nuevos.

| Dato | Obligatorio | Descripcion |
| --- | --- | --- |
| Departamento anterior | Depende del evento | Departamento que tenía la solicitud antes del cambio. |
| Departamento nuevo | Depende del evento | Departamento que recibe o asume la solicitud. |
| Usuario asignado anterior | Depende del evento | Usuario responsable previo, cuando exista. |
| Usuario asignado nuevo | Depende del evento | Nuevo usuario responsable, cuando exista. |

### Reglas funcionales para cambios organizacionales

- Las reasignaciones deben conservar el valor anterior y el nuevo.
- Las asignaciones iniciales pueden tener valor anterior nulo.
- Los cambios de departamento no deben resumirse solo en una nota textual.
- Si la reasignación incluye cambio de usuario asignado, ambos cambios deben quedar visibles.
- El historial debe permitir distinguir entre asignación inicial, reasignación y retirada.

### Ejemplos de uso

- Asignación inicial:
  - Departamento anterior: nulo.
  - Departamento nuevo: departamento responsable.
  - Usuario asignado anterior: nulo.
  - Usuario asignado nuevo: usuario responsable.
- Reasignación:
  - Departamento anterior: departamento anterior.
  - Departamento nuevo: departamento nuevo.
  - Usuario asignado anterior: usuario anterior.
  - Usuario asignado nuevo: usuario nuevo.
- Remoción:
  - Departamento anterior o usuario anterior: valor existente.
  - Nuevo valor: nulo o vacío según el caso funcional definido por la implementación futura.

## Uso de metadata

`metadata` puede almacenar información complementaria, contextual o de integración, pero no debe ser la única fuente para datos estructurados esenciales.

### Uso permitido de metadata

- Origen del evento.
- Canal desde el que se ejecutó la acción.
- Identificador de correlación o trazabilidad externa.
- Motivo extendido cuando el texto libre no basta.
- Datos contextuales de una integración futura.
- Indicadores técnicos no persistentes como `batchId`, `source` o `correlationId`.

### Uso no permitido de metadata como fuente única

- Identificador de la solicitud.
- Código del evento.
- Usuario responsable.
- Estado anterior o nuevo.
- Departamento anterior o nuevo.
- Usuario asignado anterior o nuevo.

### Regla funcional

Si un dato es necesario para reconstruir el flujo de una solicitud, debe existir como información estructurada y no depender únicamente de `metadata`.

## Reglas de observacion

### Eventos que requieren observacion

- Rechazos.
- Devoluciones.
- Correcciones excepcionales.
- Reasignaciones administrativas que necesiten justificación.
- Cualquier evento definido por el flujo o catálogo como de motivo obligatorio.

### Eventos que permiten observacion opcional

- Creación de solicitud.
- Carga de documento.
- Asignaciones ordinarias.
- Cambios de prioridad.
- Cambios de fecha límite.
- Inicios de revisión.
- Aprobaciones.
- Firma.

### Reglas para observaciones internas

- La observación debe conservarse como parte del historial del evento.
- Una observación interna no debe reemplazar un cambio de estado o un cambio organizacional estructurado.
- Si el evento ya tiene observación obligatoria, no debe quedar vacía.
- Una observación sensible no debe duplicarse en metadata si ya está representada por un campo estructurado.
- La observación debe poder ser mostrada sin romper la trazabilidad cronológica.

## Consistencia cronologica

### Orden cronológico

- La consulta histórica debe ordenarse por fecha de creación ascendente.
- Si dos eventos comparten la misma marca temporal, el sistema debe conservar el orden de inserción o el orden transaccional disponible.
- El orden cronológico debe permitir reconstruir la secuencia del flujo sin ambiguedad.

### Comportamiento ante eventos simultaneos

- Si varias acciones se registran dentro de una misma operación, cada evento debe conservar su propia entrada.
- Cuando existan eventos simultáneos, la reconstrucción histórica debe priorizar:
  1. fecha y hora.
  2. orden transaccional.
  3. orden de persistencia.
- La simultaneidad no debe borrar el orden lógico de los hechos.

### Criterios para reconstruccion historica

- El historial debe poder leerse como una linea de tiempo.
- Los eventos de creación, cambio de estado, asignación y observación deben formar una secuencia coherente.
- La reconstrucción no debe requerir consultar otras tablas para entender el flujo principal.
- Si un dato complementario vive en metadata, debe ser solo un refuerzo, no la única prueba del hecho.

## Estructura funcional objetivo

La estructura funcional de `request_history` debe permitir representar, como mínimo:

| Categoria | Campos funcionales esperados |
| --- | --- |
| Creacion | solicitud asociada, evento, usuario responsable, fecha y hora, observacion opcional |
| Cambio de estado | solicitud asociada, evento, usuario responsable, fecha y hora, estado anterior, estado nuevo, observacion cuando aplique |
| Cambio organizacional | solicitud asociada, evento, usuario responsable, fecha y hora, departamento anterior/nuevo, usuario asignado anterior/nuevo, observacion cuando aplique |
| Observacion | solicitud asociada, evento, usuario responsable, fecha y hora, observacion obligatoria o contextual |
| Metadata | informacion auxiliar no estructurada que complementa el evento, sin reemplazar campos principales |

## Resultado esperado

Disponer de una definición clara y consistente de la información que debe almacenarse en `request_history`, garantizando trazabilidad completa, reconstrucción cronológica del flujo y compatibilidad con las futuras implementaciones de auditoría e historial.
