# Matriz oficial de permisos — Sprint 3

## Proposito

Este documento define la matriz oficial de permisos del sistema de solicitudes
de la alcaldia para el Sprint 3. Establece que acciones protegidas existen,
que codigo tecnico identifica cada permiso, que roles pueden ejecutarlas y bajo
que alcance.

La matriz debe utilizarse como referencia para:

- El diseno del modelo persistente de permisos (Issue 2).
- El contrato tecnico de autorizacion (Subissue 4.6).
- La implementacion de guards y decoradores.
- La validacion de transiciones en la maquina de estados (Issue 3).
- La auditoria de acciones protegidas (Issue 5).

Este documento es funcional. No implementa tablas, migraciones, guards,
decoradores ni logica de autorizacion.

## Fuentes

- `docs/sprint-03-official-roles.md`.
- `docs/sprint-03-gap-analysis.md`.
- Codigo actual: controladores, guards y servicio de autorizacion en
  `backend/src/auth/`.

## Principios

1. Todo permiso representa una accion concreta que el sistema puede autorizar.
2. Tener un permiso no elimina validaciones de estado, departamento o
   propiedad del recurso.
3. La visibilidad de una solicitud y la capacidad de modificarla son
   autorizaciones diferentes y deben tener permisos separados.
4. Los permisos se asignan a roles, no a usuarios individuales, durante el MVP.
5. El alcance de acceso (propio, departamental, global, administrativo) se
   valida ademas del permiso.
6. El actor autenticado se obtiene del JWT. Nunca se confia en el body de la
   solicitud para determinar el autor de una accion.

## Catalogo de permisos

Codigo tecnico basado en el formato `dominio:accion` con nomenclatura
`snake_case`. Este catalogo debe validarse contra la guia de convenciones de la
Subissue 1.4 antes de implementarse.

### Permisos de solicitudes

| # | Codigo tecnico | Descripcion | Accion protegida |
|---|---|---|---|
| 1 | `requests:create` | Crear una solicitud ciudadana | POST /requests |
| 2 | `requests:upload_documents` | Subir documentos asociados a una solicitud | POST /requests/:id/documents |
| 3 | `requests:update` | Editar campos autorizados de una solicitud | PATCH /requests/:id |
| 4 | `requests:assign_department` | Asignar o reasignar departamento responsable | PATCH /requests/:id/assign-department |
| 5 | `requests:set_priority` | Definir o cambiar la prioridad | PATCH /requests/:id/priority |
| 6 | `requests:set_deadline` | Definir o cambiar la fecha limite | PATCH /requests/:id/deadline |
| 7 | `requests:view_all` | Consultar solicitudes de todos los departamentos | GET /requests |
| 8 | `requests:view_own_department` | Consultar solicitudes del propio departamento | GET /requests (departamental) |
| 9 | `requests:view_audit` | Consultar el historial y auditoria de una solicitud | GET /requests/:id/history |
| 10 | `requests:mark_viewed` | Marcar una solicitud como vista | POST /requests/:id/viewed |
| 11 | `requests:start_review` | Iniciar la revision de una solicitud | POST /requests/:id/start-review |
| 12 | `requests:approve_department` | Aprobar una solicitud a nivel departamental | POST /requests/:id/approve |
| 13 | `requests:reject_department` | Rechazar una solicitud a nivel departamental | POST /requests/:id/reject |
| 14 | `requests:send_to_mayor_office` | Enviar una solicitud al despacho del alcalde | POST /requests/:id/send-to-mayor |
| 15 | `requests:return_to_department` | Devolver una solicitud al departamento desde despacho | POST /requests/:id/return-to-department |
| 16 | `requests:approve_mayor_office` | Aprobar una solicitud desde el despacho del alcalde | POST /requests/:id/approve-mayor |
| 17 | `requests:reject_mayor_office` | Rechazar una solicitud desde el despacho del alcalde | POST /requests/:id/reject-mayor |
| 18 | `requests:sign` | Firmar logicamente una solicitud | POST /requests/:id/sign |
| 19 | `requests:close` | Cerrar una solicitud | POST /requests/:id/close |

### Permisos de usuarios

| # | Codigo tecnico | Descripcion | Accion protegida |
|---|---|---|---|
| 20 | `users:create` | Crear un nuevo usuario | POST /users |
| 21 | `users:update` | Actualizar datos de un usuario | PATCH /users/:id |
| 22 | `users:disable` | Activar o desactivar un usuario | PATCH /users/:id/status |
| 23 | `users:assign_role` | Asignar o cambiar el rol de un usuario | PATCH /users/:id/role |
| 24 | `users:assign_department` | Asignar o cambiar el departamento de un usuario | PATCH /users/:id/department |

## Matriz rol-permiso

| # | Permiso | SECRETARY | DEPARTMENT_STAFF | MAYOR_OFFICE | ADMIN |
|---|---|---|---|---|---|
| 1 | `requests:create` | SI | No | No | No |
| 2 | `requests:upload_documents` | SI | No | No | No |
| 3 | `requests:update` | SI | No | SI | No |
| 4 | `requests:assign_department` | SI | No | SI | No |
| 5 | `requests:set_priority` | SI | No | SI | No |
| 6 | `requests:set_deadline` | SI | No | SI | No |
| 7 | `requests:view_all` | Seguimiento | No | SI | No |
| 8 | `requests:view_own_department` | No | SI | No | No |
| 9 | `requests:view_audit` | Seguimiento | Departamental | SI | No |
| 10 | `requests:mark_viewed` | No | SI | No | No |
| 11 | `requests:start_review` | No | SI | No | No |
| 12 | `requests:approve_department` | No | SI | No | No |
| 13 | `requests:reject_department` | No | SI | No | No |
| 14 | `requests:send_to_mayor_office` | No | SI | No | No |
| 15 | `requests:return_to_department` | No | No | SI | No |
| 16 | `requests:approve_mayor_office` | No | No | No | No |
| 17 | `requests:reject_mayor_office` | No | No | SI | No |
| 18 | `requests:sign` | No | No | SI | No |
| 19 | `requests:close` | No | No | SI | No |
| 20 | `users:create` | No | No | No | SI |
| 21 | `users:update` | No | No | No | SI |
| 22 | `users:disable` | No | No | No | SI |
| 23 | `users:assign_role` | No | No | No | SI |
| 24 | `users:assign_department` | No | No | No | SI |

### Leyenda

- **SI** — Permiso asignado al rol.
- **No** — Permiso bloqueado para el rol.
- **Seguimiento** — Permiso asignado pero limitado a consulta de seguimiento,
  sin capacidad operativa. Aplica a SECRETARY.
- **Departamental** — Permiso asignado pero limitado por alcance
  departamental. Aplica a DEPARTMENT_STAFF.

## Alcance asociado por permiso

El alcance determina sobre que recursos puede aplicarse un permiso. Se valida
en conjunto con el permiso, no lo reemplaza.

| Permiso | Tipo de alcance | Recurso |
|---|---|---|
| `requests:create` | Ninguno (creacion) | Solicitud nueva |
| `requests:upload_documents` | Propio / Propio | Documentos de la solicitud |
| `requests:update` | Propio / Global | Campos de la solicitud |
| `requests:assign_department` | Global | Solicitud |
| `requests:set_priority` | Propio / Global | Solicitud |
| `requests:set_deadline` | Propio / Global | Solicitud |
| `requests:view_all` | Global | Todas las solicitudes |
| `requests:view_own_department` | Departamental | Solicitudes del departamento del usuario |
| `requests:view_audit` | Departamental / Global | Historial de la solicitud |
| `requests:mark_viewed` | Departamental | Solicitud del departamento |
| `requests:start_review` | Departamental | Solicitud del departamento |
| `requests:approve_department` | Departamental | Solicitud del departamento |
| `requests:reject_department` | Departamental | Solicitud del departamento |
| `requests:send_to_mayor_office` | Departamental | Solicitud del departamento |
| `requests:return_to_department` | Global | Solicitud |
| `requests:approve_mayor_office` | Global | Solicitud |
| `requests:reject_mayor_office` | Global | Solicitud |
| `requests:sign` | Global | Solicitud |
| `requests:close` | Global | Solicitud |
| `users:create` | Administrativo | Nuevo usuario |
| `users:update` | Administrativo | Usuario existente |
| `users:disable` | Administrativo | Usuario existente |
| `users:assign_role` | Administrativo | Usuario existente |
| `users:assign_department` | Administrativo | Usuario existente |

## Restricciones por alcance

### Alcance departamental (DEPARTMENT_STAFF)

- El usuario debe tener un `departmentId` activo y valido.
- El permiso solo aplica si `request.departmentId == user.departmentId`.
- Si el usuario no tiene departamento o esta inactivo, todas las operaciones
  departamentales deben denegarse.
- La reasignacion de una solicitud cambia inmediatamente el departamento con
  autoridad operativa sobre ella.

### Alcance global (MAYOR_OFFICE, SECRETARY para seguimiento)

- MAYOR_OFFICE tiene visibilidad global sin restriccion de departamento.
- SECRETARY tiene visibilidad global limitada a seguimiento: puede consultar
  pero no decidir sobre solicitudes.
- La visibilidad global no permite ejecutar transiciones fuera del estado
  compatible.

### Alcance administrativo (ADMIN)

- Limitado a recursos de configuracion: usuarios, roles y departamentos.
- No otorga permisos operativos sobre solicitudes.

### Alcance propio

- Recursos creados o asignados directamente al usuario.

## Reglas de validacion de permisos

El flujo de autorizacion debe seguir este orden:

1. El usuario esta autenticado (JWT valido).
2. El usuario tiene un rol activo.
3. El rol tiene el permiso requerido para la accion.
4. Si el permiso requiere alcance departamental, se valida `departmentId`.
5. Si el permiso requiere un estado compatible, se valida el estado de la
   solicitud.
6. Los datos obligatorios para la transicion estan presentes.
7. Se registra el evento de auditoria correspondiente.

Si cualquiera de las validaciones falla, la operacion debe rechazarse con el
codigo HTTP y mensaje de error definidos en el contrato tecnico.

## Cobertura de criterios de aceptacion

- [x] Todas las acciones protegidas fueron identificadas (24 permisos).
- [x] Cada permiso posee codigo tecnico unico.
- [x] Cada permiso posee descripcion funcional.
- [x] Cada permiso tiene roles asociados en la matriz.
- [ ] Todas las transiciones de la Issue 3 tienen permisos definidos
      (actividad de verificacion posterior, cuando las transiciones esten
       documentadas por la Issue 3).
- [x] No existen acciones protegidas sin autorizacion asociada.
- [x] La matriz es compatible con el modelo de permisos disenado en la
      Issue 2.
- [x] La matriz puede utilizarse como referencia para implementar guards y
      decoradores.

## Historial de cambios

| Fecha | Cambio | Autor |
|---|---|---|
| 2026-06-10 | Creacion inicial de la matriz oficial de permisos | Lucas-Santamaria-Create |
