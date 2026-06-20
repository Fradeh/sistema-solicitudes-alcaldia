# Definición de Endpoints Administrativos - Gestión del Sistema (Sprint 03)

Este documento especifica el diseño técnico de los endpoints administrativos para la gestión de usuarios, roles, permisos y departamentos, garantizando el aislamiento del flujo operativo y la seguridad del sistema.

---

## 1. Endpoints de Gestión de Usuarios

| Método | Ruta | Propósito | Rol Autorizado | Permiso Requerido | Restricciones / Validaciones | Evento de Auditoría |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/admin/users` | Consultar lista global de usuarios | `ADMIN` | `users:list` | Solo devuelve datos de perfil; no expone contraseñas. | Ninguno (Lectura) |
| **GET** | `/api/v1/admin/users/:userId` | Consultar detalle completo de un usuario | `ADMIN` | `users:view` | El usuario debe existir en PostgreSQL. | Ninguno (Lectura) |
| **POST** | `/api/v1/admin/users` | Crear un nuevo usuario/funcionario | `ADMIN` | `users:create` | Correo electrónico único. Contraseña inicial cifrada. | `USER_CREATED` |
| **PUT** | `/api/v1/admin/users/:userId` | Actualizar datos generales de perfil | `ADMIN` | `users:update` | No permite modificar el estado `isActive` por esta vía. | `USER_UPDATED` |
| **PATCH** | `/api/v1/admin/users/:userId/activate` | Activar una cuenta de usuario | `ADMIN` | `users:activate` | Solo aplica si el usuario estaba `inactive`. | `USER_ACTIVATED` |
| **PATCH** | `/api/v1/admin/users/:userId/deactivate`| Desactivar temporal/definitivamente | `ADMIN` | `users:deactivate`| Impide la desactivación del propio usuario logueado. | `USER_DEACTIVATED` |
| **PATCH** | `/api/v1/admin/users/:userId/roles` | Asignar o remover roles a un usuario | `ADMIN` | `users:assign:roles`| Validar que el rol exista en la base de datos. | `USER_ROLES_ASSIGNED` |
| **PATCH**| `/api/v1/admin/users/:userId/departments`| Asignar usuario a dependencias | `ADMIN` | `users:assign:dept` | Obligatorio para roles `OFFICER` y `SUPERVISOR`. | `USER_DEPT_ASSIGNED` |

---

## 2. Endpoints de Roles y Permisos

| Método | Ruta | Propósito | Rol Autorizado | Permiso Requerido | Restricciones / Validaciones | Evento de Auditoría |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/admin/roles` | Consultar roles del sistema | `ADMIN`, `SUPERVISOR` | `roles:list` | Retorna catálogo estático de roles. | Ninguno (Lectura) |
| **GET** | `/api/v1/admin/permissions` | Consultar catálogo global de permisos | `ADMIN` | `permissions:list` | Muestra todos los permisos del sistema. | Ninguno (Lectura) |
| **GET** | `/api/v1/admin/roles/:roleId/permissions`| Consultar permisos asignados a un rol | `ADMIN` | `roles:permissions:view` | Mapeo específico de un nodo de rol. | Ninguno (Lectura) |
| **GET** | `/api/v1/admin/permissions/matrix` | Consultar la matriz completa de permisos | `ADMIN` | `permissions:matrix` | Vista consolidada para auditoría de seguridad. | Ninguno (Lectura) |

---

## 3. Endpoints de Gestión de Departamentos

| Método | Ruta | Propósito | Rol Autorizado | Permiso Requerido | Restricciones / Validaciones | Evento de Auditoría |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/admin/departments` | Consultar lista de departamentos | Todos los autenticados | `departments:list` | Retorna nombres e IDs de las dependencias. | Ninguno (Lectura) |
| **GET** | `/api/v1/admin/departments/:deptId`| Consultar detalle de departamento | `ADMIN`, `SUPERVISOR`| `departments:view` | Muestra metadata y jefaturas asociadas. | Ninguno (Lectura) |
| **POST** | `/api/v1/admin/departments` | Crear un nuevo departamento municipal | `ADMIN` | `departments:create` | El nombre del departamento debe ser único. | `DEPT_CREATED` |
| **PUT** | `/api/v1/admin/departments/:deptId`| Actualizar información del departamento | `ADMIN` | `departments:update` | Solo modifica campos descriptivos. | `DEPT_UPDATED` |
| **PATCH**| `/api/v1/admin/departments/:deptId/activate`| Activar departamento inactivo | `ADMIN` | `departments:activate`| Permite asignarle solicitudes nuevamente. | `DEPT_ACTIVATED` |
| **PATCH**| `/api/v1/admin/departments/:deptId/deactivate`| Desactivar departamento municipal | `ADMIN` | `departments:deactivate`| **Restricción Crítica:** No se puede desactivar si tiene usuarios activos asignados. | `DEPT_DEACTIVATED` |

---

## 4. Políticas de Restricciones Administrativas Obligatorias

1. **Aislamiento del Flujo Operativo:** El hecho de poseer el rol `ADMIN` u otorgar permisos administrativos sobre este módulo **no concede participación ni permisos automáticos** sobre la máquina de estados de solicitudes (como `/approve`, `/reject` o `/sign`). Las acciones del flujo operativo quedan restringidas estrictamente a los roles correspondientes asignados de forma explícita.
2. **Restricción sobre Usuarios Departamentales:** Un usuario de tipo `OFFICER` o `SUPERVISOR` está obligado a pertenecer a un departamento válido. El sistema bloqueará cualquier intento de desvincularlos si quedan en un estado huérfano.
3. **Restricción de Desactivación de Departamentos:** Se denegará el cierre o desactivación de cualquier departamento que registre usuarios con estatus `isActive: true`. Primero se debe reasignar al personal.
4. **Auditoría Obligatoria:** Toda mutación de estado (`POST`, `PUT`, `PATCH`) en este módulo disparará de forma síncrona el registro en la tabla de auditoría del sistema con la estampa del administrador responsable.