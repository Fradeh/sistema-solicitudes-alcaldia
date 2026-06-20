# Contratos Preliminares de API - Flujo Departamental (Sprint 03)

Este documento especifica los contratos preliminares de la API para las acciones del módulo Departamental dentro del flujo operativo de solicitudes, definiendo sus estructuras de datos, validaciones cruzadas y mapeo con la auditoría.

---

## 1. Matriz de Reglas de Validación Departamental

Para todos los endpoints descritos en este documento, el interceptor de seguridad aplicará estrictamente las siguientes reglas antes de procesar cualquier cambio:

1. **Validación de Pertenencia:** El usuario autenticado (con rol `OFFICER` o `SUPERVISOR`) solo puede operar solicitudes cuyo `departmentId` coincida exactamente con el `departmentId` asignado a su perfil de usuario.
2. **Error de Desviación:** Si la solicitud pertenece a otro departamento, el sistema responderá inmediatamente con un código **`403 Forbidden`** (`ERR_DEPARTMENT_MISMATCH`).
3. **Usuarios Huérfanos:** Si el usuario no tiene un departamento asignado en el sistema, la acción se denegará con un código **`403 Forbidden`** (`ERR_USER_WITHOUT_DEPARTMENT`).
4. **Departamentos Inactivos:** Si el departamento del usuario se encuentra en estado inactivo, se bloqueará toda operación con un código **`400 Bad Request`** (`ERR_INACTIVE_DEPARTMENT`).

---

##  2. Especificación Detallada de Endpoints y Contratos

### 2.1 Marcar Solicitud como Vista
* **Ruta:** `PATCH /api/v1/requests/:id/view`
* **Propósito:** Registrar que el departamento ha abierto y tomado conocimiento de la solicitud asignada.
* **Permiso Requerido:** `requests:department:view`
* **Estado Requerido:** `assigned`
* **Estado Resultante:** No cambia el estado principal (se mantiene en `assigned`), pero altera metadatos internos.
* **Fechas Actualizadas:** `viewed_at` (Fecha y hora actual del servidor).
* **Evento de Auditoría:** `REQUEST_VIEWED_BY_DEPT`

#### Ejemplo de Request
```json
// No requiere Body. Parámetro de ruta: id = 1045