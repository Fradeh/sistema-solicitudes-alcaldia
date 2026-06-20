# Definición de Endpoints Operativos - Flujo de Solicitudes (Sprint 03)

Este documento detalla la especificación de diseño técnico para los endpoints operativos del flujo de solicitudes, estableciendo sus propósitos, requisitos de autorización y su acoplamiento estricto con la máquina de estados y el `RequestTransitionService`.

---

## 1. Endpoints de Creación y Consulta (Secretaría / General)

### `POST /api/v1/requests`
* **Propósito:** Registrar una nueva solicitud ciudadana en el sistema.
* **Roles Autorizados:** `RECEPTIONIST`, `ADMIN`
* **Permisos Requeridos:** `requests:create`
* **Relación con Transiciones:** Inicializa el flujo. Crea el registro en estado obligatorio **`received`** (Transición Inicial).

### `GET /api/v1/requests`
* **Propósito:** Consultar y listar solicitudes con soporte para filtros operativos.
* **Filtros Soportados:** `status` (por estado), `departmentId` (por departamento).
* **Roles Autorizados:** `SUPERVISOR`, `ADMIN`, `OFFICER`, `MAYOR`
* **Permisos Requeridos:** `requests:list` o `requests:list:department` (filtro automático por pertenencia).
* **Relación con Transiciones:** Lectura general. No altera el estado.

### `GET /api/v1/requests/:requestId`
* **Propósito:** Obtener el detalle completo y metadatos de una solicitud específica.
* **Roles Autorizados:** Todos los roles autenticados.
* **Permisos Requeridos:** `requests:view`
* **Relación con Transiciones:** Lectura de ficha. No altera el estado.

---

## 2. Endpoints de Asignación y Control Operativo

### `PATCH /api/v1/requests/:requestId/assign-department`
* **Propósito:** Asignar por primera vez el departamento municipal responsable de resolver la solicitud.
* **Roles Autorizados:** `SUPERVISOR`, `ADMIN`
* **Permisos Requeridos:** `requests:assign:department`
* **Relación con Transiciones:** Mueve el estado de **`received`** a **`assigned`**. Compatible con la validación del `RequestTransitionService`.

### `PATCH /api/v1/requests/:requestId/reassign-department`
* **Propósito:** Reasignar la solicitud a una dependencia diferente debido a errores de canalización.
* **Roles Autorizados:** `SUPERVISOR`, `ADMIN`
* **Permisos Requeridos:** `requests:reassign:department`
* **Relación con Transiciones:** Mantiene o reinicia el estado a **`assigned`**, registrando el cambio de nodo en la bitácora.

### `PATCH /api/v1/requests/:requestId/metadata`
* **Propósito:** Modificar la prioridad (`priority`) y establecer/extender la fecha límite (`dueDate`) de atención.
* **Roles Autorizados:** `SUPERVISOR`, `ADMIN`
* **Permisos Requeridos:** `requests:update:metadata`
* **Relación con Transiciones:** Modificación de control de ANS. No altera el estado del flujo principal.

---

## 3. Endpoints de Revisión Técnica (Departamentos)

### `PATCH /api/v1/requests/:requestId/start-review`
* **Propósito:** Registrar que un funcionario ha tomado la solicitud para comenzar su evaluación técnica interna.
* **Roles Autorizados:** `OFFICER`
* **Permisos Requeridos:** `requests:start:review`
* **Relación con Transiciones:** Transiciona el estado de **`assigned`** a **`in_review`**. Bloquea la solicitud para ese funcionario.

### `PATCH /api/v1/requests/:requestId/approve`
* **Propósito:** Dar el visto bueno técnico a nivel de departamento.
* **Roles Autorizados:** `SUPERVISOR`
* **Permisos Requeridos:** `requests:department:approve`
* **Relación con Transiciones:** Transiciona el estado de **`in_review`** a **`department_approved`**.

### `PATCH /api/v1/requests/:requestId/reject`
* **Propósito:** Rechazar la solicitud a nivel técnico emitiendo una justificación legal/técnica formal.
* **Roles Autorizados:** `SUPERVISOR`
* **Permisos Requeridos:** `requests:department:reject`
* **Relación con Transiciones:** Transiciona el estado de **`in_review`** a **`rejected`**. Fin del flujo ordinario.

### `PATCH /api/v1/requests/:requestId/send-to-mayor`
* **Propósito:** Elevar el expediente aprobado por el departamento hacia el Despacho Superior del Alcalde para firma.
* **Roles Autorizados:** `SUPERVISOR`, `ADMIN`
* **Permisos Requeridos:** `requests:send:mayor`
* **Relación con Transiciones:** Transiciona el estado de **`department_approved`** a **`pending_signature`**.

---

## 4. Endpoints del Despacho del Alcalde

### `PATCH /api/v1/requests/:requestId/sign`
* **Propósito:** Aplicar la firma digital/electrónica del Alcalde para emitir la resolución oficial de la solicitud.
* **Roles Autorizados:** `MAYOR`
* **Permisos Requeridos:** `requests:mayor:sign`
* **Relación con Transiciones:** Transiciona el estado de **`pending_signature`** a **`signed`**. El `RequestTransitionService` valida la presencia de la firma.

### `PATCH /api/v1/requests/:requestId/return`
* **Propósito:** Devolver la solicitud al departamento de origen debido a observaciones o falta de sustento técnico.
* **Roles Autorizados:** `MAYOR`, `ADMIN`
* **Permisos Requeridos:** `requests:mayor:return`
* **Relación con Transiciones:** Devuelve el estado de **`pending_signature`** a **`in_review`** o **`assigned`** para su subsanación.

### `PATCH /api/v1/requests/:requestId/mayor-reject`
* **Propósito:** Rechazar de manera definitiva la solicitud directamente desde el Despacho del Alcalde.
* **Roles Autorizados:** `MAYOR`
* **Permisos Requeridos:** `requests:mayor:reject`
* **Relación con Transiciones:** Transiciona el estado de **`pending_signature`** a **`rejected`**.

---

## 5. Endpoints de Cierre e Historial

### `PATCH /api/v1/requests/:requestId/close`
* **Propósito:** Archivar y cerrar la solicitud de manera definitiva una vez notificado el ciudadano o ejecutada la resolución.
* **Roles Autorizados:** `SUPERVISOR`, `ADMIN`
* **Permisos Requeridos:** `requests:close`
* **Relación con Transiciones:** Transiciona los estados terminales (**`signed`** o **`rejected`**) hacia el estado final **`closed`**.

### `GET /api/v1/requests/:requestId/history`
* **Propósito:** Consultar la bitácora pública y administrativa de los cambios de estado de la solicitud.
* **Roles Autorizados:** Todos los roles autenticados.
* **Permisos Requeridos:** `requests:history:view`
* **Relación con Transiciones:** Consulta de auditoría de transiciones del `RequestTransitionService`. No altera estados.

---

### Reglas de Control de la Máquina de Estados
- **Restricción de Bypass:** Ningún endpoint expone mutaciones directas sobre el campo `status` mediante `PUT` o `PATCH` genéricos. Las transiciones solo ocurren llamando a las acciones explícitas (`/approve`, `/reject`, `/sign`, etc.).
- **Compatibilidad:** Todas las rutas invocan internamente las reglas lógicas del `RequestTransitionService` para verificar que el `status` actual de la base de datos coincida con el estado requerido para la transición seleccionada.