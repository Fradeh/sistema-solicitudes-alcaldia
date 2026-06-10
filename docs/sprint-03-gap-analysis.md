# Analisis de brecha del backend para el Sprint 3

## Proposito

Este documento compara el backend disponible en la rama `develop` con el flujo
funcional objetivo del Sprint 3. Su finalidad es identificar que componentes se
conservan, cuales requieren modificacion, cuales deben reemplazarse y cuales
deben eliminarse o retirarse del flujo oficial.

El documento sirve como referencia para las Subissues 1.2, 1.3, 1.4 y 1.5, y
como entrada para el trabajo de modelo de datos, maquina de estados,
autorizacion, auditoria y contrato API de las Issues 2, 3, 4, 5 y 6.

Este analisis no modifica codigo, migraciones, endpoints ni datos.

## Fuentes revisadas

### Documentos del nuevo alcance

- `Alcaldia nuevo sprint.md`.
- `Descripcion de Estados.pdf`.
- `Semana 1 SPRINT 3.pdf`.

### Documentacion existente en el repositorio

- `README.md`.
- `docs/architecture.md`.
- `docs/sprint-scope.md`.
- `docs/api-contract-sprint-01.md`.
- `docs/sprint-01-validation-checklist.md`.
- `docs/demo-users.md`.

### Codigo y configuracion

- Modulos y controladores bajo `backend/src`.
- Entidades y DTOs de solicitudes, usuarios, roles, departamentos, estados e
  historial.
- Guards, estrategia JWT y normalizacion de roles.
- Migraciones y seeds bajo `backend/src/database/migrations`.
- Configuracion de PostgreSQL, MongoDB y Docker Compose.

## Convencion de clasificacion

| Clasificacion | Significado |
| --- | --- |
| Se conserva | El componente sigue siendo valido con cambios menores o sin cambios. |
| Se modifica | La responsabilidad sigue vigente, pero su contrato o reglas deben adaptarse. |
| Se reemplaza | El enfoque actual no representa el nuevo flujo y necesita otra solucion. |
| Se elimina | La funcionalidad no debe continuar en el flujo oficial. |

## Resumen ejecutivo

El backend actual ofrece una base reutilizable en NestJS y PostgreSQL. Ya
dispone de autenticacion JWT, usuarios, roles, departamentos, categorias,
solicitudes, estados, tracking publico e historial basico. La creacion y la
asignacion registran historial dentro de transacciones, y el tracking publico
consulta PostgreSQL.

Sin embargo, el comportamiento implementado representa el sprint anterior:

- La autorizacion depende principalmente de roles rigidos.
- No existe un modelo persistente de permisos.
- La recepcion obliga a seleccionar departamento desde la creacion.
- La asignacion se enfoca en un usuario y no en el departamento responsable.
- No existe una maquina de estados centralizada.
- El cambio de estado generico permite omitir reglas del proceso.
- El acceso del personal operativo se limita por usuario asignado, no por
  departamento.
- El historial no cubre los eventos ni los datos requeridos por el Sprint 3.
- Los seeds contienen roles, estados y prioridades incompatibles o duplicados.
- Los endpoints administrativos solo exigen autenticacion, no autorizacion
  administrativa.
- Parte del modulo documental sigue consultando informacion oficial desde
  MongoDB.

Por lo tanto, la arquitectura tecnica general se conserva, pero el modelo de
autorizacion, el flujo de solicitudes, los estados, la auditoria y varios
contratos API deben modificarse o reemplazarse.

## Arquitectura y estructura general

| Componente actual | Estado objetivo | Clasificacion | Impacto tecnico |
| --- | --- | --- | --- |
| NestJS con modulos por dominio | Mantener separacion por autenticacion, usuarios, solicitudes, catalogos e historial | Se conserva | Permite implementar el nuevo flujo sin reconstruir la aplicacion. |
| TypeORM y PostgreSQL | Fuente de verdad para solicitudes, estados, historial, usuarios, roles, permisos y departamentos | Se conserva | Las nuevas tablas y columnas deben implementarse mediante migraciones adicionales. |
| MongoDB | Uso limitado a checklist documental futuro | Se modifica | Debe retirarse del acceso a solicitudes oficiales y revisarse el alcance actual de documentos. |
| Docker Compose | Entorno local con backend, PostgreSQL y MongoDB | Se conserva | Puede mantenerse mientras MongoDB tenga una responsabilidad futura documentada. |
| Swagger | Documentacion de contratos HTTP | Se modifica | Debe alinearse con permisos, transiciones y DTOs del Sprint 3. |
| Frontend existente | Estructura minima, fuera del analisis de backend | Se conserva | Los contratos nuevos deben permitir integracion posterior, pero no se implementa frontend en esta subissue. |

## Inventario de modulos actuales

| Modulo | Responsabilidad actual | Clasificacion | Observacion para Sprint 3 |
| --- | --- | --- | --- |
| `AuthModule` | Login, refresh, usuario autenticado y JWT | Se modifica | La autenticacion se conserva; la sesion debe integrarse con permisos y estado vigente del usuario. |
| `UsersModule` | CRUD y autenticacion de usuarios | Se modifica | Debe restringirse a permisos administrativos y generar auditoria. |
| `RolesModule` | Registro de la entidad de roles | Se modifica | Debe normalizar roles e integrarse con permisos persistentes. |
| `DepartmentsModule` | CRUD basico de departamentos | Se modifica | Requiere permisos, desactivacion y reglas de integridad. |
| `CategoriesModule` | CRUD de categorias ligadas a departamentos | Se modifica | La lectura y administracion necesitan autorizacion diferenciada. |
| `RequestStatusesModule` | Consulta y gestion del catalogo de estados | Se modifica | Debe exponer exclusivamente el catalogo oficial normalizado. |
| `RequestsModule` | Creacion, consulta, asignacion, documentos y cambio de estado | Se modifica ampliamente | Debe separar acciones y delegar transiciones a un servicio central. |
| `RequestHistoryModule` | Registro y consulta de cuatro eventos | Se modifica ampliamente | Debe soportar eventos, departamentos, metadata y respuestas extendidas. |
| `TrackingModule` | Seguimiento publico desde PostgreSQL | Se conserva | Solo requiere alineacion con etiquetas publicas de los estados nuevos. |
| `DocumentsModule` | Metadata documental en MongoDB | Se modifica | No debe consultar solicitudes oficiales desde MongoDB. |
| `AcademicMongoModule` | Checklist academico/documental en MongoDB | Se conserva fuera del flujo actual | Debe mantenerse separado del estado oficial de solicitudes. |
| `DatabaseModule` | Conexion a PostgreSQL y MongoDB | Se conserva | Las responsabilidades de cada almacenamiento deben seguir documentadas. |

La compilacion actual del backend mediante `npm run build` finaliza
correctamente. Esto confirma que las brechas descritas son principalmente de
modelo, reglas y contrato, no errores actuales de compilacion.

## Solicitudes

### Estado actual

La entidad `Request` contiene:

- Datos basicos de la solicitud y del ciudadano.
- Categoria.
- Departamento obligatorio.
- Estado.
- Prioridad.
- Usuario receptor.
- Usuario asignado opcional.
- Codigo de seguimiento.
- Indicador de actividad.
- Fechas de creacion y actualizacion.

La creacion:

- Esta restringida al rol `RECEPTIONIST`.
- Genera el codigo de seguimiento en backend.
- Obtiene `receivedById` del usuario autenticado.
- Busca el estado `received` cuando no se envia `statusId`.
- Registra `REQUEST_CREATED` dentro de una transaccion.

### Brechas

| Diferencia | Clasificacion | Impacto tecnico |
| --- | --- | --- |
| `departmentId` es obligatorio al crear | Se modifica | `requests.department_id`, la entidad y el DTO deben aceptar `null` mientras la solicitud este en `received`. |
| El DTO acepta `statusId` | Se elimina | El cliente puede escoger el estado inicial y omitir la regla de inicio obligatorio en `received`. |
| El DTO acepta `userAssignedId` | Se elimina del registro inicial | Mezcla recepcion con asignacion operativa y dificulta auditar acciones separadas. |
| No existe `dueDate` | Se modifica | No se puede definir ni filtrar la fecha limite requerida. |
| Faltan fechas operativas | Se modifica | No se puede reconstruir cuando fue delegada, vista, revisada, decidida o firmada. |
| No existe `signedById` | Se modifica | La firma logica no puede identificar de forma relacional al responsable. |
| La asignacion actual se realiza a un usuario | Se reemplaza como operacion principal | El nuevo flujo requiere asignar primero un departamento y cambiar a `assigned_to_department`. |
| La asignacion intenta usar `in_progress` | Se reemplaza | Ese estado no pertenece al catalogo oficial del Sprint 3. |
| El listado global solo se permite a `SUPERVISOR` y `ADMIN` | Se modifica | La consulta debe depender de permisos y alcance: global, propio o departamento propio. |
| El acceso de `OFFICER` compara `userAssignedId` | Se reemplaza | El alcance principal del personal departamental debe validarse por `departmentId`. |
| Existe cambio generico de estado | Se elimina o restringe a uso interno | Permite saltar estados, no valida actor, departamento, motivo ni registra auditoria atomica. |

### Elementos que se conservan

- Entidad base y relaciones con categoria, estado, departamento y usuarios.
- Generacion del codigo de seguimiento en backend.
- Obtencion del usuario receptor desde JWT.
- Estado inicial buscado por codigo tecnico.
- Uso de transacciones para solicitud e historial.
- Consultas mediante repositorios TypeORM.
- Tracking publico separado de las consultas internas.

### Elementos que deben agregarse

- `due_date`.
- `delegated_at`.
- `viewed_at`.
- `review_started_at`.
- `decision_at`.
- `signed_at`.
- `signed_by_id`.
- Indices por departamento, estado, fecha limite y tracking.
- Endpoints de acciones explicitas del flujo.
- Servicio central de transiciones.
- Validacion adicional por departamento.

## Usuarios y administracion

### Estado actual

El modulo de usuarios permite:

- Crear usuarios.
- Listar usuarios activos.
- Consultar un usuario.
- Actualizarlo.
- Desactivarlo mediante soft delete.
- Asignar `roleId`.
- Asignar opcionalmente `departmentId`.

### Brechas

| Diferencia | Clasificacion | Impacto tecnico |
| --- | --- | --- |
| Todo el controlador usa solo `JwtAuthGuard` | Se reemplaza | Cualquier usuario autenticado puede administrar usuarios. Los endpoints deben exigir permisos administrativos. |
| No se auditan altas, cambios o desactivaciones | Se modifica | Se necesita auditoria administrativa independiente de `request_history`. |
| No se valida que un rol departamental tenga departamento | Se modifica | Podrian existir usuarios operativos sin alcance valido. |
| No se define tratamiento de departamentos inactivos | Se modifica | Debe impedirse asignar o mantener accesos operativos inconsistentes. |
| La asignacion de rol y departamento ocurre dentro de actualizaciones generales | Se modifica | Deben quedar reglas y eventos auditables claros para estas acciones. |
| No existe reactivacion explicita | Se modifica | El nuevo alcance contempla activar y desactivar usuarios. |

### Elementos que se conservan

- Entidad `User`.
- Hash de contrasenas con bcrypt.
- Relaciones con rol y departamento.
- Soft delete mediante `isActive`.
- Servicios de busqueda de usuarios activos.
- Validacion de usuario activo durante autenticacion y `/auth/me`.

## Roles

### Estado actual

El codigo utiliza:

- `RECEPTIONIST`.
- `OFFICER`.
- `SUPERVISOR`.
- `ADMIN`.
- `MAYOR`.

Tambien existen aliases y seeds en minusculas:

- `recepcionista`.
- `revisor`.
- `supervisor`.
- `admin`.
- `alcalde`.

Adicionalmente, otro seed crea los nombres en mayusculas. Esto permite que
coexistan roles funcionalmente equivalentes con identificadores distintos.

### Brechas

| Diferencia | Clasificacion | Impacto tecnico |
| --- | --- | --- |
| Roles tecnicos anteriores no coinciden con los cuatro actores oficiales | Se modifica o reemplaza | La Subissue 1.2 debe definir equivalencias y migracion de datos. |
| `OFFICER` representa usuario asignado individual | Se reemplaza conceptualmente | El nuevo actor Departamento opera bajo alcance departamental. |
| `SUPERVISOR` no aparece como actor oficial | Pendiente de decision | Debe clasificarse como migrado, rol adicional aprobado u obsoleto. |
| `MAYOR` puede ser demasiado limitado para representar un despacho | Pendiente de decision | Debe decidirse entre `MAYOR`, `MAYOR_OFFICE` o permisos diferenciados dentro del despacho. |
| Existen roles duplicados por idioma y mayusculas | Se elimina mediante normalizacion futura | Puede generar asignaciones y permisos inconsistentes entre entornos. |
| Un usuario tiene un solo `roleId` | Se conserva para el MVP, sujeto a confirmacion | El alcance no exige permisos individuales ni multiples roles, pero debe confirmarse como decision oficial. |

## Permisos y autorizacion

### Estado actual

La autenticacion JWT incluye identificador, email y nombre del rol. La
autorizacion de solicitudes usa:

- `@Roles()`.
- `RolesGuard`.
- Normalizacion de aliases de rol.

No existen entidades, tablas, seeds, servicios ni guards de permisos.

### Brechas

| Diferencia | Clasificacion | Impacto tecnico |
| --- | --- | --- |
| Autorizacion basada solo en roles | Se reemplaza | No puede expresar capacidades granulares ni separar visibilidad de acciones. |
| No existen `permissions` y `role_permissions` | Se agrega | Requiere entidades, migraciones, seeds e integracion con roles. |
| No existe `@RequirePermissions()` | Se agrega | Los controladores no pueden declarar capacidades tecnicas requeridas. |
| No existe `PermissionsGuard` | Se agrega | JWT autentica, pero no resuelve la autorizacion objetivo. |
| El JWT conserva el rol hasta expirar | Se modifica | Debe definirse como reaccionar ante desactivacion o cambios de permisos durante la sesion. |
| No existe politica de acceso departamental reutilizable | Se agrega | El permiso no sustituye la validacion de pertenencia del recurso al departamento. |
| Varios endpoints sensibles no tienen `@Roles()` | Se reemplaza con permisos explicitos | Usuarios, departamentos, documentos y cambio de estado tienen acceso excesivo. |

La autorizacion objetivo debe separar:

1. Autenticacion del usuario.
2. Permiso para ejecutar la accion.
3. Alcance sobre el recurso por departamento.
4. Validez de la transicion segun el estado actual.

## Estados y transiciones

### Estado actual

Las migraciones pueden sembrar simultaneamente:

- `Pendiente`.
- `En Proceso`.
- `Resuelto`.
- `Cerrado`.
- `received`.
- `in_review`.
- `approved_by_officer`.
- `awaiting_mayor_signature`.
- `signed`.

No existe una matriz de transiciones. El servicio de solicitudes contiene
cambios directos de `statusId`.

### Catalogo objetivo

1. `received`.
2. `assigned_to_department`.
3. `in_review`.
4. `approved_by_department`.
5. `rejected_by_department`.
6. `awaiting_mayor_signature`.
7. `returned_to_department`.
8. `rejected_by_mayor_office`.
9. `signed`.
10. `closed`.

### Brechas

| Diferencia | Clasificacion | Impacto tecnico |
| --- | --- | --- |
| Estados antiguos en espanol conviven con codigos nuevos | Se elimina mediante normalizacion futura | Las consultas y transiciones no tienen una fuente unica. |
| `approved_by_officer` no coincide con el objetivo | Se reemplaza | Debe migrarse a `approved_by_department` cuando corresponda. |
| Faltan cinco estados oficiales | Se agrega | No puede representarse asignacion, rechazo, devolucion ni cierre completo. |
| No hay matriz de transiciones | Se agrega | Cualquier estado valido puede convertirse directamente en otro. |
| El endpoint acepta `statusId` arbitrario | Se elimina o internaliza | Expone detalles de persistencia y permite saltarse reglas de negocio. |
| No se exigen motivos | Se modifica | Rechazo, devolucion y otras decisiones no quedan justificadas. |
| No se actualizan fechas operativas | Se modifica | El estado y la trazabilidad temporal pueden divergir. |

### Decisiones funcionales pendientes

- Si `approved_by_department` pasa a `closed` de forma manual o automatica.
- Si `rejected_by_department` requiere una accion posterior de cierre.
- Si `signed` pasa a `closed` de forma manual o automatica.
- Quien tiene permiso para cerrar.
- Si Secretaria participa en el cierre despues de responder al ciudadano.
- Si una solicitud cerrada puede reabrirse.
- Si una reasignacion desde Alcaldia vuelve a `assigned_to_department`.
- Quien puede realizar la firma logica dentro del despacho.

Estas decisiones bloquean el contrato definitivo del futuro
`RequestTransitionService`.

## Prioridades

La migracion inicial crea el enum PostgreSQL con:

- `Low`.
- `Medium`.
- `High`.
- `Urgent`.

El enum TypeScript utiliza:

- `Baja`.
- `Media`.
- `Alta`.
- `Urgente`.

### Clasificacion

Se reemplaza por una convencion tecnica unica.

### Impacto tecnico

La entidad y la base de datos pueden enviar valores incompatibles. Antes de
crear nuevas migraciones debe definirse:

- Codigo persistido.
- Etiqueta presentada al usuario.
- Estrategia de normalizacion de datos existentes.
- Valor por defecto.

## Historial y auditoria

### Estado actual

`request_history` registra:

- Solicitud.
- Usuario responsable.
- Evento.
- Estado anterior y nuevo.
- Usuario asignado anterior y nuevo.
- Observacion.
- Fecha.

Los eventos implementados son:

- `REQUEST_CREATED`.
- `ASSIGNED`.
- `STATUS_CHANGED`.
- `INTERNAL_OBSERVATION`.

La creacion y asignacion usan transacciones. La consulta de historial devuelve
solamente identificador, tipo de evento, observacion, identificador de usuario
y fecha.

### Brechas

| Diferencia | Clasificacion | Impacto tecnico |
| --- | --- | --- |
| Faltan eventos operativos del Sprint 3 | Se modifica | No puede reconstruirse el proceso completo. |
| `ASSIGNED` no diferencia departamento y usuario | Se reemplaza o especializa | El evento no representa `DEPARTMENT_ASSIGNED` ni reasignaciones. |
| No existen departamento anterior y nuevo | Se agrega | Las reasignaciones departamentales no pueden auditarse estructuradamente. |
| No existe `metadata` | Se agrega con alcance definido | Cambios de prioridad, fecha, firma y documentos requieren datos complementarios. |
| La respuesta no incluye usuario legible ni valores relacionados | Se modifica | Frontend no puede construir una linea de tiempo util sin consultas adicionales. |
| El orden actual es descendente | Pendiente de decision | El contrato debe definir orden cronologico y posible paginacion. |
| El cambio generico de estado no registra historial | Se reemplaza | Estado e historial pueden quedar inconsistentes. |
| No existe auditoria administrativa | Se agrega como `audit_logs` o solucion equivalente | Eventos de usuarios, roles y departamentos no pertenecen obligatoriamente a una solicitud. |

### Eventos objetivo de solicitudes

- `REQUEST_CREATED`.
- `DOCUMENT_UPLOADED`.
- `DEPARTMENT_ASSIGNED`.
- `DEPARTMENT_REASSIGNED`.
- `PRIORITY_CHANGED`.
- `DEADLINE_SET`.
- `DEADLINE_CHANGED`.
- `REQUEST_VIEWED`.
- `REVIEW_STARTED`.
- `INTERNAL_OBSERVATION`.
- `STATUS_CHANGED`.
- `APPROVED_BY_DEPARTMENT`.
- `REJECTED_BY_DEPARTMENT`.
- `SENT_TO_MAYOR_OFFICE`.
- `RETURNED_TO_DEPARTMENT`.
- `REJECTED_BY_MAYOR_OFFICE`.
- `SIGNED`.
- `CLOSED`.

### Eventos administrativos objetivo

- `USER_CREATED`.
- `USER_UPDATED`.
- `USER_ENABLED`.
- `USER_DISABLED`.
- `ROLE_ASSIGNED`.
- `DEPARTMENT_ASSIGNED_TO_USER`.
- `DEPARTMENT_CREATED`.
- `DEPARTMENT_UPDATED`.
- `DEPARTMENT_ENABLED`.
- `DEPARTMENT_DISABLED`.

## Departamentos y categorias

### Estado actual

- Los usuarios pueden tener un departamento opcional.
- Las solicitudes tienen un departamento obligatorio.
- Las categorias pertenecen a un departamento.
- Los controladores de departamentos y categorias usan autenticacion JWT.

### Brechas

| Diferencia | Clasificacion | Impacto tecnico |
| --- | --- | --- |
| Solicitud siempre ligada a departamento | Se modifica | La etapa `received` requiere permitir ausencia de departamento. |
| Usuario departamental puede no tener departamento | Se modifica | No puede determinarse su alcance operativo. |
| No se valida departamento del usuario al consultar solicitudes | Se reemplaza | Existe riesgo de acceso entre departamentos. |
| CRUD de departamentos no exige permisos administrativos | Se modifica | Cualquier usuario autenticado puede alterar catalogos sensibles. |
| No existe desactivacion de departamentos en el controlador | Se modifica | El alcance requiere gestion del estado activo. |
| Categoria ya referencia departamento | Se conserva, sujeto a regla funcional | Puede ayudar a sugerir departamento, pero no debe sustituir la asignacion explicita sin decision aprobada. |

## Documentos y MongoDB

### Estado actual

El modulo de documentos persiste metadata en MongoDB. Al consultar el detalle
de un documento intenta buscar la solicitud asociada en una coleccion MongoDB
llamada `requests`.

### Clasificacion

- Asociacion de documentos a solicitudes: se modifica.
- Consulta de solicitudes oficiales desde MongoDB: se elimina.
- MongoDB para checklist futuro del alcalde: se conserva fuera del flujo
  oficial actual.

### Impacto tecnico

PostgreSQL es la fuente oficial de solicitudes. El detalle documental debe
resolver la solicitud desde PostgreSQL, independientemente de donde se conserve
la metadata o el archivo. Antes de implementar la subida documental debe
definirse:

- Donde se almacena el archivo.
- Donde se almacena su metadata.
- Como se vincula con `requests`.
- Que evento registra la asociacion.
- Que roles y permisos pueden cargar, consultar o desactivar documentos.

## Tracking publico

### Estado actual

`GET /api/v1/tracking/:trackingCode`:

- Es publico.
- Valida y normaliza el codigo.
- Consulta la solicitud y su estado en PostgreSQL.
- Usa el historial para resolver la fecha de ultima actualizacion.
- No devuelve datos directos de contacto del ciudadano.

### Clasificacion

Se conserva con modificaciones menores.

### Impacto tecnico

El endpoint debe mapear los estados oficiales a mensajes publicos y mantener
una respuesta que no exponga observaciones internas, datos personales ni
detalles administrativos. La documentacion arquitectonica que afirma que el
tracking aun usa MongoDB quedo desactualizada y debe corregirse en una subissue
documental posterior.

## Inventario resumido de endpoints

| Area | Endpoint actual | Clasificacion | Motivo |
| --- | --- | --- | --- |
| Auth | `POST /auth/login` | Se conserva | Sigue siendo el punto de autenticacion. |
| Auth | `POST /auth/refresh` | Se modifica | Debe definirse como actualizar permisos y estado activo. |
| Auth | `GET /auth/me` | Se conserva | Permite obtener rol y departamento actuales. |
| Requests | `POST /requests` | Se modifica | Debe crear siempre en `received` y aceptar departamento nulo. |
| Requests | `POST /requests/register` | Se elimina posteriormente | Ruta heredada duplicada. |
| Requests | `GET /requests` | Se modifica | Requiere paginacion, filtros y alcance por permisos. |
| Requests | `GET /requests/list` | Se elimina posteriormente | Ruta heredada duplicada. |
| Requests | `GET /requests/:id` | Se modifica | Requiere permisos y validacion de departamento. |
| Requests | `PATCH /requests/:id/assign` | Se reemplaza | El flujo principal asigna departamento, no solo usuario. |
| Requests | `PATCH /requests/:id/status` | Se elimina o internaliza | Permite transiciones arbitrarias. |
| Requests | `POST /requests/:id/internal-observations` | Se modifica | Debe autorizar por permiso y alcance departamental. |
| Requests | `GET /requests/:id/history` | Se modifica | Requiere contrato ampliado y permisos de auditoria. |
| Documents | `POST /requests/documents` | Se reemplaza | La ruta no expresa la solicitud en el recurso. |
| Documents | `GET /requests/documents/detail/:id` | Se modifica | No debe buscar solicitudes en MongoDB. |
| Documents | `DELETE /requests/documents/:id` | Se modifica | Requiere permiso, alcance y evento de auditoria. |
| Tracking | `GET /tracking/:trackingCode` | Se conserva | Ya consulta PostgreSQL y expone informacion publica limitada. |
| Users | CRUD `/users` | Se modifica | Solo Administrador o permisos equivalentes deben gestionarlo. |
| Departments | CRUD `/departments` | Se modifica | Requiere permisos administrativos y desactivacion controlada. |
| Categories | CRUD `/categories` | Se modifica | Lectura y administracion deben tener permisos diferenciados. |
| Statuses | `GET /request-statuses` | Se modifica | Debe devolver exclusivamente el catalogo oficial normalizado. |

Los endpoints de acciones operativas del Sprint 3 se disenaran en la Issue 6
despues de aprobar estados, transiciones y permisos.

## Funcionalidades obsoletas o incompatibles

Las siguientes funcionalidades no deben usarse como base del nuevo flujo:

- Seleccionar `statusId` al crear una solicitud.
- Asignar `userAssignedId` durante el registro inicial.
- Exigir departamento durante la recepcion.
- Cambiar estados mediante un endpoint generico expuesto al cliente.
- Usar `in_progress` como estado posterior a la asignacion.
- Usar `approved_by_officer` como decision departamental oficial.
- Limitar el acceso departamental solamente por usuario asignado.
- Considerar que JWT autenticado equivale a usuario autorizado.
- Consultar solicitudes oficiales desde MongoDB.
- Mantener rutas heredadas duplicadas como contrato definitivo.
- Continuar desarrollando sobre estados `Pendiente`, `En Proceso`,
  `Resuelto` y `Cerrado`.

No deben eliminarse fisicamente antes de definir compatibilidad, migracion de
datos y despliegue. En la Subissue 1.5 deben clasificarse las issues y rutas
anteriores como adaptadas, reemplazadas, pausadas u obsoletas.

## Inconsistencias tecnicas identificadas

1. Las migraciones de estados contienen dos catalogos incompatibles.
2. Los roles pueden duplicarse por idioma y uso de mayusculas.
3. Las prioridades TypeScript no coinciden con el enum PostgreSQL.
4. Existen migraciones diferentes con el mismo timestamp
   `1779138600000`.
5. Existen migraciones diferentes con el mismo timestamp
   `1779138700000`.
6. La creacion permite campos que el backend debe controlar.
7. La asignacion usa el nombre de estado inexistente `in_progress`.
8. El cambio de estado no usa transaccion ni registra historial.
9. El historial de creacion no guarda `newStatusId = received`, aunque la
   validacion anterior lo esperaba.
10. La respuesta del historial omite relaciones y valores anteriores/nuevos.
11. Los endpoints de usuarios y departamentos carecen de autorizacion
    administrativa.
12. Las rutas de documentos no tienen permisos especificos.
13. El detalle documental busca solicitudes en MongoDB.
14. Existen DTOs con nombres duplicados y convenciones distintas, por ejemplo
    `AssignRequestDto` y `AssignRequestDTO`.
15. Hay imports absolutos con `src/...` mezclados con imports relativos.
16. La documentacion del Sprint 1 no coincide completamente con los DTOs y
    respuestas reales.
17. No existen pruebas automatizadas identificadas en el backend.
18. La documentacion de arquitectura conserva observaciones ya resueltas sobre
    el tracking PostgreSQL.

## Riesgos para las siguientes semanas

| Riesgo | Nivel | Consecuencia | Mitigacion recomendada |
| --- | --- | --- | --- |
| Implementar endpoints antes de aprobar transiciones | Critico | Reglas duplicadas o contradictorias | Congelar implementacion operativa hasta cerrar Issues 1, 3 y 4. |
| Modificar migraciones ya ejecutadas | Critico | Entornos imposibles de reproducir | Crear migraciones nuevas de normalizacion y documentar tratamiento de datos existentes. |
| No normalizar roles y estados | Critico | Permisos y consultas dependen de registros distintos | Definir codigos oficiales y estrategia de migracion antes de seeds nuevos. |
| Mantener cambio generico de estado | Critico | Saltos de flujo y auditoria incompleta | Reemplazarlo por acciones explicitas y servicio central de transiciones. |
| Confundir permiso con alcance departamental | Alto | Exposicion de solicitudes entre departamentos | Validar permiso y `departmentId` de forma independiente. |
| Guardar permisos solo en JWT | Alto | Acceso obsoleto tras desactivar usuarios o cambiar permisos | Definir estrategia de consulta o invalidacion de sesiones. |
| Implementar auditoria fuera de transacciones | Alto | Solicitudes actualizadas sin evento asociado | Reutilizar `EntityManager` y hacer obligatoria la atomicidad. |
| No resolver reglas de cierre | Alto | Estados terminales sin continuacion definida | Obtener decision funcional antes del contrato final. |
| No decidir almacenamiento documental | Medio | Integracion provisional incompatible con arquitectura | Resolver responsabilidad de archivos y metadata antes de Semana 3. |
| Ausencia de pruebas automatizadas | Alto | Regresiones en permisos y transiciones | Disenar pruebas unitarias e integracion desde Semana 2. |
| Contratos y nombres inconsistentes | Medio | Retrabajo entre backend y frontend | Aprobar convenciones tecnicas en la Subissue 1.4. |

## Bloqueos y decisiones requeridas

### Funcionales

- Equivalencia oficial entre roles anteriores y actores nuevos.
- Tratamiento de `SUPERVISOR`.
- Nombre y alcance del rol del Despacho del Alcalde.
- Usuarios departamentales por departamento completo o por asignacion
  individual adicional.
- Condiciones y actor responsable del cierre.
- Cierre manual o automatico para cada resultado.
- Posibilidad de reapertura.
- Condiciones para requerir intervencion del despacho.
- Alcance de consulta de Secretaria.
- Campos que Secretaria y Alcaldia pueden editar segun el estado.

### Tecnicas

- Codigos persistidos para roles, estados y prioridades.
- Estrategia para normalizar datos existentes.
- Permanencia o retiro futuro de `user_assigned_id`.
- Fuente de permisos en cada peticion o inclusion en JWT.
- Modelo de `audit_logs`.
- Uso y limites de `metadata` en auditoria.
- Contrato y paginacion del historial.
- Almacenamiento de documentos y metadata.
- Periodo de compatibilidad para rutas heredadas.

## Dependencias para las siguientes subissues

### Subissue 1.2: roles y responsabilidades

Debe resolver:

- Equivalencia de `RECEPTIONIST`, `OFFICER`, `SUPERVISOR`, `ADMIN` y
  `MAYOR`.
- Roles que requieren `departmentId`.
- Diferencia entre rol, permiso y alcance departamental.
- Si el MVP conserva un solo rol por usuario.

### Subissue 1.3: estados y decisiones funcionales

Debe resolver:

- Catalogo unico de diez estados.
- Estados iniciales, operativos y terminales.
- Reglas de cierre.
- Flujo posterior a devolucion.
- Criterios de intervencion del despacho.

### Subissue 1.4: convenciones tecnicas

Debe resolver:

- Idioma y formato de codigos.
- Nombres de roles, permisos, estados y eventos.
- Convenciones de DTOs y rutas.
- Convenciones entre `trackingCode` y radicado.
- Codigos persistidos y etiquetas visibles.

### Subissue 1.5: clasificacion y especificacion base

Debe:

- Clasificar issues y contratos del Sprint 1.
- Marcar rutas heredadas y cambio generico de estado.
- Establecer una fuente oficial para Sprint 3.
- Registrar responsables y fecha para decisiones pendientes.

## Conclusion

El backend actual no debe descartarse. La estructura modular, PostgreSQL,
TypeORM, autenticacion, catalogos, tracking y base transaccional del historial
son aprovechables.

La brecha principal no es tecnologica sino funcional y de control: el sistema
actual modela recepcion, asignacion y revision mediante roles y estados del
sprint anterior. El Sprint 3 requiere autorizacion por permisos, alcance por
departamento, acciones explicitas, una maquina de estados centralizada y
auditoria suficiente para reconstruir el proceso.

La implementacion segura debe seguir este orden:

1. Aprobar roles, estados, transiciones y convenciones.
2. Disenar normalizacion y nuevas migraciones.
3. Implementar permisos y alcance departamental.
4. Ampliar solicitudes e historial.
5. Implementar el servicio central de transiciones.
6. Exponer endpoints de acciones especificas.
7. Validar el flujo completo con pruebas y documentacion actualizada.

## Cobertura de criterios de aceptacion

- Solicitudes, usuarios, roles, permisos, estados y auditoria fueron
  analizados.
- Las diferencias principales incluyen clasificacion e impacto tecnico.
- Las funcionalidades incompatibles u obsoletas estan identificadas.
- Los riesgos tecnicos para las siguientes semanas estan documentados.
- Los bloqueos funcionales y tecnicos estan documentados.
- Las dependencias y decisiones requeridas por las Subissues 1.2, 1.3, 1.4 y
  1.5 estan identificadas.
- No se modifico codigo, migraciones, endpoints ni base de datos.
