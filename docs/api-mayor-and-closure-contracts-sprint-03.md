# Contratos Preliminares de API - Despacho de Alcaldía y Cierre (Sprint 03)

Este documento especifica los contratos preliminares de la API para las decisiones del Despacho del Alcalde y la finalización/cierre del proceso operativo de solicitudes (Issue #211). Defina estructuras de datos, permisos, validaciones de negocio y el mapeo con auditoría.

---

## 1. Matriz de Estados y Permisos del Despacho Superior

Todas las acciones descritas en este documento son de uso exclusivo para usuarios autorizados con roles de alta jerarquía (como `MAYOR` o administradores del despacho superior), exigiendo la verificación obligatoria del estado previo antes de procesar cualquier cambio.

---

## 2. Especificación Detallada de Endpoints y Contratos

### 2.1 Devolver Solicitud al Departamento
* **Ruta:** `PATCH /api/v1/requests/:id/return-to-department`
* **Propósito:** El Despacho del Alcalde devuelve una solicitud al departamento de origen debido a incongruencias o falta de información técnica.
* **Permiso Requerido:** `requests:mayor:return`
* **Estado Requerido:** `pending_signature`
* **Estado Resultante:** `in_review` (Regresa a la bandeja técnica del departamento para su corrección).
* **Motivo Obligatorio:** **Sí (Estricto).** Se requiere fundamentar el motivo de la devolución en el campo `reason`.
* **Evento de Auditoría:** `REQUEST_RETURNED_TO_DEPT`

#### Ejemplo de Request
```json
{
  "reason": "Se devuelve el expediente debido a que falta el sello de aprobación hidráulica en el plano de la página 4."
}