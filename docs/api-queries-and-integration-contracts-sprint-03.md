# Contratos de Consultas, Filtros y Acuerdos de Integración (Sprint 03)

Este documento unifica y especifica los contratos preliminares de API para las consultas generales, catálogos, sistemas de paginación/filtrado y las convenciones de integración para resolver discrepancias entre el Frontend y el Backend (Issue #212).

---

## 1. Restricciones de Consulta y Alcance por Rol

Para proteger la integridad de la información, el endpoint principal de solicitudes (`GET /api/v1/requests`) aplicará filtros implícitos en el Backend dependiendo del rol extraído del JWT del usuario:

* **Rol `ADMIN` / `MAYOR` (Alcaldía):** Alcance Total. Tienen visibilidad global de todas las solicitudes del municipio sin restricciones de pertenencia.
* **Rol `OFFICER` / `SUPERVISOR` (Departamento):** Alcance Departamental. El sistema inyecta automáticamente el `departmentId` del usuario en la consulta. Solo ven expedientes asignados a su respectiva dependencia.
* **Rol `SECRETARY` (Secretaría / Recepción):** Alcance de Control Inicial. Tienen visibilidad de solicitudes en estados iniciales (`received`, `assigned`), pero no detalles internos de la bitácora técnica departamental.

---

## 2. Especificación Detallada de Endpoints de Consulta

### 2.1 Consulta General de Solicitudes (Con Paginación y Filtros)
* **Ruta:** `GET /api/v1/requests`
* **Propósito:** Lista las solicitudes del sistema aplicando filtros dinámicos y paginación estándar.
* **Permiso Requerido:** `requests:list`
* **Paginación por Defecto:** `page = 1`, `limit = 10`
* **Ordenamiento por Defecto:** Ordenado por fecha límite (`limit_date: ASC`), priorizando los expedientes más urgentes por vencer.
* **Filtros Disponibles (Query Params):** `status`, `departmentId`, `categoryId`, `priority`, `search` (búsqueda por código de seguimiento o solicitante).

#### Ejemplo de Request (Query URL)