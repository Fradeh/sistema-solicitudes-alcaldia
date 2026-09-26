# Enlace API Producción

> Registro de verificación de disponibilidad de la API en el entorno de
> producción. Este documento debe actualizarse cada vez que se realice un
> despliegue o una verificación de disponibilidad.

## 1. URL pública de la API

```
[COMPLETAR: https://api.midominio.com/api/v1]
```

Prefijo global configurado en el backend: `api/v1`
(see `backend/src/config/env.config.ts` y `backend/src/main.ts`).

Swagger UI (documentación interactiva):

```
[COMPLETAR: https://api.midominio.com/api/docs]
```

## 2. Fecha y hora de verificación

- Fecha y hora (UTC): `[COMPLETAR: AAAA-MM-DD HH:MM Z]`
- Fecha y hora (hora local): `[COMPLETAR]`
- Realizado por: `[COMPLETAR: nombre del responsable]`

## 3. Endpoint usado para comprobar disponibilidad

Ruta de health check definida en `backend/src/app.controller.ts:9`:

```
GET [COMPLETAR: https://api.midominio.com]/api/v1/health
```

Este endpoint valida conectividad real contra PostgreSQL y MongoDB, ya que
inyecta `DataSource` (TypeORM) y `Connection` (Mongoose) y reporta su estado:

```json
{
  "status": "ok",
  "timestamp": "2026-07-16T17:00:00.000Z",
  "services": {
    "postgres": "connected",
    "mongodb": "connected"
  }
}
```

## 4. Resultado de la prueba

| Campo              | Valor esperado | Valor obtenido |
| ------------------ | -------------- | -------------- |
| Status code HTTP   | `200`          | `[COMPLETAR]`  |
| `status`           | `ok`           | `[COMPLETAR]`  |
| `services.postgres`| `connected`    | `[COMPLETAR]`  |
| `services.mongodb` | `connected`    | `[COMPLETAR]`  |

Respuesta JSON completa recibida:

```json
[COMPLETAR: pegar respuesta real devuelta por el servidor]
```

## 5. Herramienta usada para verificar

- Herramienta: `[COMPLETAR: curl / Postman / navegador]`
- Comando ejecutado (si aplica):

```bash
curl -i [COMPLETAR: https://api.midominio.com]/api/v1/health
```

Ejemplo de comando completo a utilizar:

```bash
curl -i -X GET "https://api.midominio.com/api/v1/health" \
  -H "Accept: application/json"
```

## 6. Verificación de endpoint autenticado (opcional)

Una vez confirmado el health check, se recomienda verificar un endpoint
protegido para validar la emisión de JWT y la conexión a PostgreSQL.

Ejemplo de flujo:

```bash
# 1. Login para obtener token
curl -X POST "https://api.midominio.com/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"[COMPLETAR]","password":"[COMPLETAR]"}'

# 2. Usar el token devuelto
curl -X GET "https://api.midominio.com/api/v1/[COMPLETAR-recurso]" \
  -H "Authorization: Bearer [TOKEN]"
```

Resultado de la prueba autenticada: `[COMPLETAR]`

## 7. Historial de verificaciones

| Fecha (UTC)        | Responsable | Resultado | Observaciones |
| ------------------ | ----------- | --------- | ------------- |
| `[COMPLETAR]`      | `[COMPLETAR]` | `[COMPLETAR]` | `[COMPLETAR]` |
