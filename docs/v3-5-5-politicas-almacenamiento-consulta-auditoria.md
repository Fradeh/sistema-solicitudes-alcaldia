# V3-5.5 Definir politicas de almacenamiento y consulta de auditoria

## Metadatos

| Campo | Valor |
| --- | --- |
| **Revisor** | @Fradeh, @Lucas-Santamaria-Create |
| **Tipo** | Diseno funcional |
| **Dependencias** | Subissue 5.2 - Consolidar eventos del flujo de solicitudes; Subissue 5.3 - Consolidar eventos administrativos; Subissue 5.4 - Definir la informacion registrada en `request_history` |
| **Fuentes** | `docs/sprint-03-gap-analysis.md`, `docs/sprint-03-official-roles.md`, `docs/sprint-03-official-states.md`, `docs/sprint-03-permission-matrix.md`, `docs/v3-3-1-documentar-catalogo-estados.md`, `docs/v3-3-2-definir-transiciones-secretaria.md`, `docs/v3-4-3-permisos-departamento.md`, `docs/v3-4-4-permisos-desapacho-alcalde.md`, `docs/v3-5-1-catalogo-eventos-auditables.md`, `docs/v3-5-2-consolidar-eventos-flujo-solicitudes.md`, `docs/v3-5-3-catalogo-eventos-administrativos.md`, `docs/v3-5-4-definir-informacion-request-history.md` |

## Proposito

Este documento define las politicas de almacenamiento, consulta y conservacion de la informacion de auditoria e historial del sistema.

El objetivo es garantizar trazabilidad, supervision y control sin comprometer seguridad, rendimiento ni confidencialidad.

## Alcance

- Conservacion de registros historicos y administrativos.
- Consulta de historial de solicitudes.
- Consulta de auditoria administrativa.
- Restricciones por rol, departamento, permiso y sensibilidad.
- Criterios de busqueda.
- Proteccion de informacion.
- Recomendaciones de rendimiento.

## Fuera de alcance

- Implementar consultas.
- Implementar filtros.
- Crear puntos finales.
- Crear migraciones.
- Implementar retencion automatica.
- Implementar archivado.
- Modificar tablas.
- Implementar auditoria.
- Implementar control de acceso.

## Criterios de aceptacion

- [x] Las reglas de conservacion estan documentadas.
- [x] Esta definido si los registros pueden eliminarse.
- [x] Esta definido quien puede consultar historial.
- [x] Esta definido quien puede consultar auditoria administrativa.
- [x] Las restricciones departamentales estan documentadas.
- [x] Las restricciones por permisos estan documentadas.
- [x] Los criterios de busqueda estan documentados.
- [x] La informacion sensible esta identificada.
- [x] Las reglas para metadata estan documentadas.
- [x] Las reglas para observaciones internas estan documentadas.
- [x] Existen recomendaciones para consultas futuras.
- [x] El diseno es compatible con el modelo de permisos definido en la Issue 4.

## Principios

1. La trazabilidad no debe depender de consultas ad hoc sobre tablas externas.
2. El historial operativo y la auditoria administrativa se mantienen separados.
3. Los registros auditables no se eliminan en el flujo normal del sistema.
4. La consulta siempre debe respetar permiso, alcance y sensibilidad.
5. La informacion estructurada no debe esconderse solo en `metadata`.
6. Las observaciones internas se protegen como informacion sensible.
7. La consulta debe permitir trazabilidad sin exponer mas informacion de la necesaria.

## Politicas de conservacion

### Regla general

- Los registros de historial y auditoria no deben eliminarse por operacion normal.
- No se permite borrado fisico de registros historicos o administrativos como parte del flujo ordinario.
- El sistema debe conservar la trazabilidad completa mientras el dato siga siendo relevante para supervision, control o revision interna.

### Historial de solicitudes

- `request_history` se considera fuente de trazabilidad permanente.
- No debe limpiarse por estados finales, reasignaciones o cierres.
- La consulta historica debe permanecer disponible para la vida util del sistema.
- Si en el futuro se requiere optimizacion por volumen, debe hacerse mediante archivado, particionado o almacenamiento frio, no por eliminacion del registro fuente.

### Auditoria administrativa

- Los registros administrativos deben conservarse de forma permanente por defecto.
- No deben eliminarse por tareas de soporte comun.
- Si el sistema adopta archivado, el archivo debe seguir siendo consultable por roles autorizados y conservar la integridad del registro.

### Archivado

- El archivado no es obligatorio en el MVP.
- Si se implementa mas adelante, debe ser transparente para la consulta autorizada.
- El archivado no puede romper la linea temporal ni la relacion entre evento, actor y recurso.
- El archivo debe seguir siendo inmutable.

### Eliminacion

- Los registros historicos y administrativos no deben eliminarse por interfaz funcional.
- Solo podria contemplarse eliminacion en escenarios excepcionales definidos por politica legal o tecnica externa, nunca por operacion normal del sistema.
- Cualquier excepcion futura debe conservar traza de quien autorizo la excepcion y por que motivo.

## Acceso al historial de solicitudes

### Roles que pueden consultar

| Rol | Acceso | Alcance |
| --- | --- | --- |
| `SECRETARY` | Si | Global de seguimiento |
| `DEPARTMENT_STAFF` | Si | Solo solicitudes de su departamento |
| `MAYOR_OFFICE` | Si | Global |
| `ADMIN` | No por defecto | Solo si una politica futura le asigna un permiso explicito de lectura |

### Restricciones por departamento

- `DEPARTMENT_STAFF` solo puede consultar historial de solicitudes de su propio departamento.
- Si el usuario no tiene `departmentId`, no debe acceder a historial departamental.
- Si el departamento esta inactivo, el acceso debe denegarse.
- Si la solicitud pertenece a otro departamento, el sistema debe impedir la consulta aunque el usuario conozca el identificador.

### Restricciones por estado

- El historial puede consultarse en cualquier estado de la solicitud, incluyendo estados finales.
- El estado no debe bloquear la consulta historica, salvo que una regla de proteccion temporal futura lo exija.
- La consulta historica no debe cambiar el estado de la solicitud.

### Restricciones por permisos

- El permiso base de consulta debe ser `requests:view_audit`.
- El permiso no elimina las restricciones por alcance.
- El rol debe tener permiso y tambien estar autorizado por alcance.
- Secretaria obtiene acceso de seguimiento; no recibe por ello capacidad operativa adicional.

### Niveles de acceso

| Nivel | Descripcion |
| --- | --- |
| Seguimiento global | Puede consultar historial para responder o auditar sin operar la solicitud. |
| Seguimiento departamental | Puede consultar solo lo que pertenece a su departamento. |
| Acceso global de control | Puede consultar historial de todas las solicitudes por necesidad funcional aprobada. |

## Acceso a auditoria administrativa

### Roles que pueden consultar

| Rol | Acceso | Nivel |
| --- | --- | --- |
| `ADMIN` | Si | Acceso administrativo completo |
| `MAYOR_OFFICE` | Si, si la politica de supervision lo habilita | Acceso de supervision, solo lectura |
| `SECRETARY` | No por defecto | Solo si una politica futura lo autoriza expresamente |
| `DEPARTMENT_STAFF` | No | Sin acceso por defecto |

### Restricciones para informacion sensible

- La auditoria administrativa no debe exponer datos que revelen credenciales, secretos, tokens o contrasenas.
- No debe exponer observaciones internas completas si contienen informacion sensible sin control de permisos.
- Los registros deben poder mostrar solo el nivel de detalle permitido por el rol.
- La visibilidad de una accion administrativa no otorga acceso a configuraciones no relacionadas.

### Niveles de acceso

| Nivel | Descripcion |
| --- | --- |
| Completo | Consulta total de eventos, filtros y detalle de auditoria. |
| Limitado de supervision | Consulta de eventos administrativos con visibilidad reducida de datos sensibles. |
| Restringido | Sin acceso por defecto. |

## Criterios de busqueda

### Búsqueda sobre historial de solicitudes

Los criterios minimos deben permitir consulta por:

- Solicitud.
- Usuario.
- Departamento.
- Estado.
- Evento.
- Fecha.

### Búsqueda sobre auditoria administrativa

Los criterios minimos deben permitir consulta por:

- Usuario afectado o actor.
- Rol.
- Permiso.
- Departamento.
- Evento.
- Fecha.

### Reglas de consulta

- La busqueda por fecha debe soportar rango.
- La busqueda por solicitud debe devolver la linea temporal completa.
- La busqueda por usuario debe incluir los eventos en los que actuo como responsable.
- La busqueda por evento debe respetar la separacion entre historial operativo y auditoria administrativa.
- El sistema debe definir paginacion en consultas con alto volumen.

## Proteccion de informacion

### Informacion sensible

Los siguientes datos deben tratarse con especial proteccion:

- Observaciones internas.
- Motivos de rechazo.
- Motivos de devolucion.
- Metadata tecnica con identificadores de correlacion o integracion.
- Datos personales no necesarios para la consulta solicitada.
- Informacion administrativa que revele configuracion interna o seguridad.

### Reglas de exposicion

- No se deben exponer observaciones internas a roles sin permiso de lectura autorizado.
- La metadata solo debe mostrarse si es necesaria para la trazabilidad o si el rol la puede consultar.
- Los campos estructurados necesarios para reconstruir el flujo pueden mostrarse, pero no los secretos ni datos innecesarios.
- La informacion sensible debe redactarse o limitarse segun el rol y el tipo de consulta.

### Reglas para observaciones internas

- Las observaciones internas pertenecen al contexto interno de operacion o control.
- No deben exponerse como texto libre a consultas no autorizadas.
- Si el sistema necesita mostrar un resumen, este debe respetar la politica de acceso.

### Reglas para metadata

- `metadata` no debe usarse para esconder datos que deberian ser estructurados y controlados.
- La metadata tecnica puede consultarse solo si no expone secretos o informacion sensible.
- Los datos importantes para trazabilidad no deben existir unicamente en metadata.

## Lineamientos de rendimiento

### Consultas frecuentes

Las consultas que deben considerarse de uso frecuente son:

- Historial de una solicitud puntual.
- Auditoria de un usuario puntual.
- Auditoria de un departamento puntual.
- Bqueda por evento y rango de fechas.
- Revision de ultimos eventos recientes.

### Filtros obligatorios recomendados

- Rango de fechas.
- Tipo de evento.
- Identificador del recurso principal.
- Paginacion en consultas generales.

### Riesgos por volumen

- El volumen de historial crecera mas rapido que el de operaciones activas.
- Las consultas sin filtros pueden degradar el rendimiento.
- La auditoria administrativa puede convertirse en un punto de alto consumo si no se pagina.
- Las observaciones largas y metadata extensa pueden aumentar el tamano de respuesta.

### Recomendaciones

- Indexar por fecha, evento, usuario y recurso principal cuando se implemente persistencia futura.
- Paginar por defecto en auditoria administrativa.
- Mantener un orden cronologico estable para reconstruccion.
- Separar vistas de consulta operativa y vistas de supervision.
- Limitar el payload segun rol para evitar respuestas excesivas.

## Reglas de compatibilidad con permisos

- La consulta de historial debe respetar `requests:view_audit`.
- El acceso administrativo no debe confundirse con el acceso operativo.
- Un permiso de configuracion no implica lectura de historial operativo.
- El acceso del despacho y del administrador debe seguir las reglas definidas en la Issue 4.
- La consulta nunca debe substituir la verificacion de alcance por departamento.

## Resultado esperado

Disponer de un conjunto de politicas claras para almacenamiento, acceso y consulta de auditoria, garantizando trazabilidad, seguridad y consistencia en el manejo de informacion historica y administrativa del sistema.
