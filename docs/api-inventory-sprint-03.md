# Inventario Oficial de Endpoints - Sprint 03 (V3)

Este documento constituye la referencia única y oficial de las operaciones que expondrá la API para soportar el flujo operativo, la administración del sistema, la auditoría y el historial.

---

## 1. Endpoints Operativos (Módulo de Solicitudes y Flujo)

| Método HTTP | Ruta | Módulo | Operación / Acción | Actor Principal (Rol) |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/requests` | `requests` | Crear solicitud inicial | `RECEPTIONIST` / Ciudadano |
| **GET** | `/api/v1/requests` | `requests` | Consultar / Listar solicitudes | `SUPERVISOR`, `ADMIN` |
| **GET** | `/api/v1/requests/:requestId` | `requests` | Consultar detalle de solicitud | Todos los roles autenticados |
| **PUT** | `/api/v1/requests/:requestId` | `requests` | Actualizar información permitida | `RECEPTIONIST`, `ADMIN` |
| **PATCH** | `/api/v1/requests/:requestId/assign-department` | `requests` | Asignar departamento encargado | `SUPERVISOR`, `ADMIN` |
| **PATCH** | `/api/v1/requests/:requestId/reassign-department` | `requests` | Reasignar departamento | `SUPERVISOR`, `ADMIN` |
| **PATCH** | `/api/v1/requests/:requestId/start-review` | `requests` | Iniciar revisión técnica | `OFFICER` |
| **PATCH** | `/api/v1/requests/:requestId/approve` | `requests` | Aprobar solicitud en departamento | `SUPERVISOR` |
| **PATCH** | `/api/v1/requests/:requestId/reject` | `requests` | Rechazar solicitud con justificación | `SUPERVISOR` |
| **PATCH** | `/api/v1/requests/:requestId/send-to-mayor` | `requests` | Enviar a Alcaldía (Despacho Superior) | `SUPERVISOR`, `ADMIN` |
| **PATCH** | `/api/v1/requests/:requestId/return` | `requests` | Devolver solicitud a revisión/corrección | `SUPERVISOR`, `MAYOR`, `ADMIN` |
| **PATCH** | `/api/v1/requests/:requestId/sign` | `requests` | Firmar digitalmente resolución/solicitud | `MAYOR` |
| **PATCH** | `/api/v1/requests/:requestId/close` | `requests` | Cerrar solicitud de manera definitiva | `SUPERVISOR`, `ADMIN` |
| **GET** | `/api/v1/requests/:requestId/history` | `requests` | Consultar historial del ciclo de vida | Todos los roles autenticados |

---

## 2. Endpoints Administrativos (Módulo de Gestión de Sistema)

| Método HTTP | Ruta | Módulo | Operación / Acción | Actor Principal (Rol) |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/admin/users` | `users` | Listar usuarios del sistema | `ADMIN` |
| **POST** | `/api/v1/admin/users` | `users` | Crear nuevos usuarios/funcionarios | `ADMIN` |
| **PUT** | `/api/v1/admin/users/:userId` | `users` | Modificar datos de usuario | `ADMIN` |
| **GET** | `/api/v1/admin/roles` | `roles` | Consultar roles del sistema | `ADMIN`, `SUPERVISOR` |
| **GET** | `/api/v1/admin/permissions` | `roles` | Consultar catálogo de permisos | `ADMIN` |
| **GET** | `/api/v1/admin/departments` | `departments`| Listar departamentos municipales | Todos los roles autenticados |
| **POST** | `/api/v1/admin/departments` | `departments`| Crear nuevo departamento municipal | `ADMIN` |

---

## 3. Endpoints de Auditoría e Historial

| Método HTTP | Ruta | Módulo | Operación / Acción | Actor Principal (Rol) |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/audit/admin-actions` | `audit` | Consulta de auditoría administrativa | `ADMIN` |
| **GET** | `/api/v1/audit/events` | `audit` | Consulta general de eventos del sistema | `ADMIN` |
| **GET** | `/api/v1/audit/requests/:requestId/logs` | `audit` | Consulta de historial de persistencia profundo | `ADMIN`, `SUPERVISOR` |

---

###  Notas de Cobertura y Diseño
- **Cero Duplicidades:** Cada acción del flujo operativo posee una única ruta semántica clara, evitando colisiones de métodos.
- **Base de Contratos:** Este inventario queda congelado y servirá como entrada estricta para el diseño de DTOs, Schemas y la futura documentación OpenAPI.