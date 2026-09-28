# Checklist de Validación - Sprint 01

Esta guía permite realizar la verificación manual del estado de los endpoints y asegurar que el comportamiento del sistema se alinea con la arquitectura y los contratos establecidos.

---

## Build
- [ ] **`npm run build` termina sin errores.**
  - **Resultado esperado:** La compilación de TypeScript de NestJS finaliza con código de salida `0` y genera la carpeta `/dist`.

## Autenticación
- [ ] **Login válido devuelve token.**
  - **Resultado esperado:** `POST /api/v1/auth/login` con credenciales correctas retorna un `access_token` en formato JWT.
- [ ] **Login inválido devuelve 401.**
  - **Resultado esperado:** `POST /api/v1/auth/login` con credenciales erróneas retorna estado HTTP `401 Unauthorized`.
- [ ] **Las rutas internas sin token devuelven 401.**
  - **Resultado esperado:** Intentar consumir endpoints protegidos (ej. `GET /api/v1/requests`) sin la cabecera `Authorization: Bearer <token>` retorna HTTP `401`.

## Catálogos
- [ ] **Se pueden consultar categorías.**
  - **Resultado esperado:** `GET /api/v1/categories` retorna un arreglo con los catálogos de tipos de solicitudes disponibles.
- [ ] **Se pueden consultar dependencias.**
  - **Resultado esperado:** `GET /api/v1/departments` retorna el listado de departamentos municipales configurados.

## Solicitudes
- [ ] **Se puede crear una solicitud autenticada.**
  - **Resultado esperado:** `POST /api/v1/requests` con rol `RECEPTIONIST` y body válido retorna HTTP `201 Created`.
- [ ] **La respuesta contiene trackingCode.**
  - **Resultado esperado:** El objeto JSON retornado al crear la solicitud incluye la propiedad `trackingCode` estructurada (ej. `TRK-XXXX-YYYY`).
- [ ] **La solicitud se crea en estado received.**
  - **Resultado esperado:** El campo `status` de la solicitud recién creada debe ser estrictamente `"received"`.
- [ ] **Se puede listar la solicitud creada.**
  - **Resultado esperado:** `GET /api/v1/requests` (con rol supervisor/admin) incluye en su lista el registro recién creado.
- [ ] **Se puede consultar el detalle.**
  - **Resultado esperado:** `GET /api/v1/requests/:requestId` retorna toda la metadata de la solicitud específica.

## Asignación
- [ ] **Se puede asignar un funcionario.**
  - **Resultado esperado:** `PATCH /api/v1/requests/:requestId/assign` con un `userId` de rol `OFFICER` responde de manera exitosa.
- [ ] **La solicitud cambia al estado in_review.**
  - **Resultado esperado:** Tras la asignación, al consultar la solicitud, su propiedad `status` cambió automáticamente a `"in_review"`.
- [ ] **La respuesta incluye assignedUser.**
  - **Resultado esperado:** El detalle de la solicitud muestra el objeto del funcionario asignado en la propiedad `assignedUser` (no puede ser nulo).

## Historial
- [ ] **La creación genera un evento de historial.**
  - **Resultado esperado:** Al crear la solicitud, se inserta una fila en la bitácora con `previousStatus: null` y `newStatus: "received"`.
- [ ] **La asignación genera un evento de historial.**
  - **Resultado esperado:** Al asignar la solicitud, se añade un evento con `previousStatus: "received"` y `newStatus: "in_review"`.
- [ ] **El historial puede consultarse desde el detalle.**
  - **Resultado esperado:** `GET /api/v1/requests/:requestId/history` retorna el arreglo cronológico con los movimientos de auditoría descritos.

## Tracking Público
- [ ] **Se puede consultar por trackingCode sin autenticación.**
  - **Resultado esperado:** `GET /api/v1/tracking/:trackingCode` es de acceso libre y responde HTTP `200 OK`.
- [ ] **El tracking devuelve estado y fechas.**
  - **Resultado esperado:** La respuesta contiene únicamente campos de control públicos: `status`, `createdAt` y `updatedAt`.
- [ ] **No expone datos privados del solicitante.**
  - **Resultado esperado:** El JSON **no** incluye nombres, descripciones detalladas, cédulas ni observaciones internas confidenciales.
- [ ] **El estado proviene de PostgreSQL y no de MongoDB.**
  - **Resultado esperado:** Confirmar mediante inspección de logs o código que la consulta lee de la tabla `requests` en Postgres. MongoDB queda excluido de este flujo.

## Documentación
- [ ] **Swagger coincide con el contrato API.**
  - **Resultado esperado:** Al levantar el servidor e ingresar a `/api/docs`, los endpoints listados, métodos HTTP, parámetros y esquemas coinciden con lo pactado.
- [ ] **api-response-examples.json coincide con el contrato.**
  - **Resultado esperado:** Las respuestas mockeadas en el JSON de ejemplos de la carpeta docs reflejan los mismos esquemas del backend.
- [ ] **api-examples.http contiene las rutas entregadas.**
  - **Resultado esperado:** El archivo de pruebas HTTP de VS Code contiene ejemplos de llamadas válidas para cada endpoint de este sprint.
- [ ] **Los cambios de contrato fueron reportados al líder backend.**
  - **Resultado esperado:** Cualquier divergencia u optimización aplicada en los DTOs fue notificada y aprobada por el líder antes de congelar la entrega.

---

### Reporte de Fallos
En caso de que alguna verificación resulte en **FALLO**, este debe ser reportado directamente en el hilo del issue o Pull Request correspondiente abriendo un ticket de corrección. **No se debe modificar la lógica del código sin una asignación explícita previa.**