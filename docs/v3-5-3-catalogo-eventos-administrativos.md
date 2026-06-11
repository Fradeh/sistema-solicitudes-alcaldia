# Catalogo oficial de eventos auditables administrativos

## Contexto

Este documento define el catalogo oficial de eventos auditables relacionados con
operaciones administrativas del sistema.

Su proposito es registrar cambios sobre usuarios, roles, permisos y
departamentos con trazabilidad completa, sin mezclar estos eventos con el
historial operativo de solicitudes.

Este catalogo servira como base para la futura implementacion de
`audit_logs` y para la supervision de actividades administrativas dentro del
sistema.

## Objetivo

- Definir codigos tecnicos unicos para eventos administrativos.
- Separar la auditoria administrativa del historial operativo de solicitudes.
- Establecer que informacion minima debe registrarse por evento.
- Definir reglas de generacion, agrupacion y omision.
- Mantener consistencia con las convenciones tecnicas aprobadas.

## Alcance

- Usuarios.
- Roles.
- Permisos.
- Departamentos.
- Eventos de alta, cambio, asignacion, remocion y desactivacion.

## Fuera de alcance

- Implementar `audit_logs`.
- Crear migraciones.
- Registrar eventos en codigo.
- Implementar consultas administrativas.
- Implementar endpoints de auditoria.
- Implementar filtros de auditoria.
- Modificar `request_history`.
- Implementar logica de persistencia.

## Convenciones

- Los codigos tecnicos usan `UPPER_SNAKE_CASE`.
- Cada evento representa una sola accion administrativa.
- El nombre funcional debe ser claro, estable y no ambiguo.
- Un evento no debe mezclar mas de un recurso principal.
- Los eventos administrativos nunca deben reutilizar codigos del historial de
  solicitudes.

## Informacion minima registrada

Cada evento administrativo debe poder guardar, como minimo:

- Actor responsable.
- Recurso afectado.
- Fecha y hora.
- Valores anteriores cuando aplique.
- Valores nuevos cuando aplique.
- Observaciones cuando aplique.

## Catalogo de eventos relacionados con usuarios

| Codigo tecnico | Descripcion funcional | Recurso auditado | Informacion registrada | Reglas de generacion |
| --- | --- | --- | --- | --- |
| `USER_CREATED` | Se crea un usuario en el sistema. | Usuario | Actor, datos nuevos, fecha, observacion opcional. | Evento obligatorio para toda alta de usuario. No se debe omitir. |
| `USER_UPDATED` | Se modifican datos generales de un usuario. | Usuario | Actor, valores anteriores, valores nuevos, fecha, observacion opcional. | Se registra por toda edicion relevante de datos. Puede agrupar cambios menores en una misma operacion. |
| `USER_ACTIVATED` | Se reactiva un usuario previamente desactivado. | Usuario | Actor, estado anterior, estado nuevo, fecha, observacion opcional. | Debe registrarse siempre que cambie el estado a activo. |
| `USER_DEACTIVATED` | Se desactiva un usuario. | Usuario | Actor, estado anterior, estado nuevo, fecha, motivo u observacion. | Evento obligatorio para suspender acceso. No debe omitirse. |
| `USER_ROLE_ASSIGNED` | Se asigna un rol a un usuario. | Usuario / Rol | Actor, rol anterior si existe, rol nuevo, fecha, observacion opcional. | Se registra cuando un usuario recibe un rol por primera vez o adicionalmente si el modelo lo permite. |
| `USER_ROLE_REMOVED` | Se elimina un rol asignado a un usuario. | Usuario / Rol | Actor, rol removido, fecha, motivo u observacion. | Se registra cuando un rol deja de aplicar al usuario. |
| `USER_DEPARTMENT_ASSIGNED` | Se asigna un departamento a un usuario. | Usuario / Departamento | Actor, departamento anterior si existe, departamento nuevo, fecha, observacion opcional. | Se registra al asignar o cambiar el departamento operativo del usuario. |
| `USER_DEPARTMENT_REMOVED` | Se quita el departamento asignado a un usuario. | Usuario / Departamento | Actor, departamento removido, fecha, motivo u observacion. | Se registra cuando el usuario deja de pertenecer a un departamento. |

## Catalogo de eventos relacionados con roles y permisos

| Codigo tecnico | Descripcion funcional | Recurso auditado | Informacion registrada | Reglas de generacion |
| --- | --- | --- | --- | --- |
| `ROLE_CREATED` | Se crea un rol en el sistema. | Rol | Actor, rol nuevo, fecha, observacion opcional. | Evento obligatorio para toda alta de rol. No se debe omitir. |
| `ROLE_UPDATED` | Se modifican los datos de un rol. | Rol | Actor, valores anteriores, valores nuevos, fecha, observacion opcional. | Se registra por cambios funcionales del rol. Puede agrupar cambios menores. |
| `ROLE_DEACTIVATED` | Se desactiva un rol. | Rol | Actor, estado anterior, estado nuevo, fecha, motivo u observacion. | Debe registrarse cuando un rol deja de estar disponible. |
| `PERMISSION_ASSIGNED` | Se asigna un permiso a un rol o alcance administrativo. | Rol / Permiso | Actor, permiso asignado, fecha, observacion opcional. | Se registra al otorgar una capacidad nueva. |
| `PERMISSION_REMOVED` | Se retira un permiso de un rol o alcance administrativo. | Rol / Permiso | Actor, permiso retirado, fecha, motivo u observacion. | Se registra cuando una capacidad deja de estar disponible. |

## Catalogo de eventos relacionados con departamentos

| Codigo tecnico | Descripcion funcional | Recurso auditado | Informacion registrada | Reglas de generacion |
| --- | --- | --- | --- | --- |
| `DEPARTMENT_CREATED` | Se crea un departamento. | Departamento | Actor, departamento nuevo, fecha, observacion opcional. | Evento obligatorio para toda alta de departamento. No se debe omitir. |
| `DEPARTMENT_UPDATED` | Se modifican datos de un departamento. | Departamento | Actor, valores anteriores, valores nuevos, fecha, observacion opcional. | Se registra por cambios funcionales del departamento. Puede agrupar modificaciones menores. |
| `DEPARTMENT_DEACTIVATED` | Se desactiva un departamento. | Departamento | Actor, estado anterior, estado nuevo, fecha, motivo u observacion. | Debe registrarse cuando el departamento deja de operar. |

## Reglas de auditoria

### Eventos obligatorios

Los siguientes eventos nunca deben omitirse cuando ocurran:

- `USER_CREATED`
- `USER_DEACTIVATED`
- `ROLE_CREATED`
- `ROLE_DEACTIVATED`
- `DEPARTMENT_CREATED`
- `DEPARTMENT_DEACTIVATED`
- `PERMISSION_ASSIGNED`
- `PERMISSION_REMOVED`

### Eventos que pueden agruparse

Se permite agrupar cambios menores en un solo evento cuando pertenecen a la
misma operacion administrativa y afectan al mismo recurso principal.

Ejemplos:

- Cambios de datos generales de un usuario en una sola edicion.
- Cambios de metadatos de un rol en una misma operacion.
- Actualizaciones menores de un departamento en una sola transaccion.

### Eventos que nunca deben omitirse

No deben omitirse los eventos que cambian el acceso, la vigencia o la
existencia administrativa de un recurso:

- Activacion o desactivacion de usuarios.
- Desactivacion de roles.
- Desactivacion de departamentos.
- Asignacion o remocion de permisos.

### Reglas para modificaciones masivas

- Cada recurso afectado debe quedar auditado de forma individual.
- Se debe registrar el actor responsable de la operacion masiva.
- Si la operacion afecta un mismo tipo de recurso con el mismo cambio,
  puede registrarse un evento resumen adicional, pero nunca en lugar de los
  eventos individuales.
- Cuando exista riesgo de ambiguedad, debe priorizarse la trazabilidad
  detallada sobre la agrupacion.

## Reglas de consistencia

- No deben existir codigos duplicados con el catalogo de solicitudes.
- No deben mezclarse eventos administrativos con `request_history`.
- Los eventos deben mantener una sola categoria funcional principal.
- Los nombres tecnicos deben seguir las convenciones aprobadas en la subissue
  5.1.
- Los eventos administrativos deben poder evolucionar hacia `audit_logs`
  sin romper la nomenclatura.

## Relacion entre evento, recurso e informacion minima

| Tipo de evento | Recurso principal | Valores anteriores | Valores nuevos | Observacion |
| --- | --- | --- | --- | --- |
| Creacion | Si | No aplica | Si | Opcional |
| Actualizacion | Si | Si | Si | Opcional |
| Activacion / desactivacion | Si | Si | Si | Recomendable |
| Asignacion / remocion | Si | Segun aplique | Segun aplique | Recomendable |

## Criterios de uso

- Usar `*_CREATED` para altas nuevas.
- Usar `*_UPDATED` para cambios de datos.
- Usar `*_ACTIVATED` y `*_DEACTIVATED` para cambios de disponibilidad.
- Usar `*_ASSIGNED` y `*_REMOVED` para relaciones administrativas.
- Evitar eventos genericos como `UPDATED` sin prefijo de dominio.

## Resultado esperado

Disponer de un catalogo completo y consistente de eventos administrativos
auditables, permitiendo registrar cambios sobre usuarios, roles, permisos y
departamentos con trazabilidad suficiente para supervision, control y futuras
consultas de auditoria.
