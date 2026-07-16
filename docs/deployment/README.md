# Documentación de Despliegue

Documentación de despliegue, respaldo y operación del sistema de solicitudes
de alcaldía (backend NestJS + PostgreSQL 16 + MongoDB 7 con Docker Compose).

Fuente de verdad de los servicios: `docker-compose.yml` en la raíz del
repositorio.

## Servicios del stack

| Servicio   | `container_name`        | Imagen        | Puerto host |
| ---------- | ----------------------- | ------------- | ----------- |
| `backend`  | `solicitudes_backend`   | build local   | `3000`      |
| `postgres` | `solicitudes_postgres`  | `postgres:16` | `5432`      |
| `mongodb`  | `solicitudes_mongodb`   | `mongo:7`     | `27017`     |

Endpoints clave:
- Health check: `GET /api/v1/health` (`backend/src/app.controller.ts`)
- Swagger UI: `GET /api/docs` (`backend/src/main.ts:21`)

## Índice de archivos y estado de entregables

| # | Archivo                                   | Descripción                                              | Estado     |
| - | ----------------------------------------- | -------------------------------------------------------- | ---------- |
| 1 | `enlace_api_produccion.md`                | URL pública, verificación de disponibilidad de la API    | Pendiente  |
| 2 | `instrucciones_despliegue_backend.md`    | Requisitos, variables de entorno, pasos de despliegue    | Completo   |
| 3 | `respaldo_archivos_escaneados.md`         | Ubicación, frecuencia y comandos de respaldo de archivos | Pendiente  |
| 4 | `restauracion_del_sistema.md`             | Procedimiento completo de restauración ante desastre     | Completo   |
| 5 | `respaldo_base_datos.md`                  | Respaldo de PostgreSQL y MongoDB (coordinar con Integrante 3) | Pendiente |
| 6 | `limitaciones_conocidas.md`               | Limitaciones técnicas y operativas del despliegue       | Completo   |
| 7 | `mejoras_futuras.md`                      | Lista priorizada de mejoras                               | Completo   |
| 8 | `recomendaciones_mantenimiento.md`        | Mantenimiento preventivo/correctivo y checklist seguridad| Completo   |

> **Estado "Pendiente"** indica que la estructura está completa pero contiene
> marcadores `[COMPLETAR]` que requieren información externa (URL de
> producción, plataforma de hosting, ubicación real de archivos, datos del
> Integrante 3). El **estado "Completo"** indica que toda la información
> inferible del proyecto está documentada y los comandos son ejecutables.

## Datos pendientes de completar (resumen)

Estos valores no se pueden inferir del repositorio y deben completarse con
información del entorno real de producción:

- URL pública de la API (`enlace_api_produccion.md`)
- Plataforma de despliegue (EC2 / Dokploy / VPS)
- URL del repositorio
- Ubicación real de los archivos escaneados (volumen / bucket S3 / disco)
- Frecuencia y retención de respaldos (a confirmar con Integrante 3)
- Responsables y contactos de operación

## Pendientes técnicos detectados en el análisis

- `JWT_SECRET` y `JWT_REFRESH_SECRET` no están en el `environment` del
  `docker-compose.yml` (solo en `.env`). Recomendado agregarlos.
- El compose corre el backend con `npm run start:dev` (modo desarrollo).
- Los puertos de Postgres y Mongo están publicados al host (riesgo en
  producción).
- No hay volumen ni bucket definido para los archivos escaneados.

Ver detalle en `limitaciones_conocidas.md` y planes en `mejoras_futuras.md`.

## Cómo usar esta documentación

1. **Para desplegar:** seguir `instrucciones_despliegue_backend.md` paso a paso.
2. **Para respaldar:** seguir `respaldo_base_datos.md` (BD) y
   `respaldo_archivos_escaneados.md` (archivos).
3. **Para restaurar:** seguir `restauracion_del_sistema.md` en el orden
   indicado.
4. **Para operar día a día:** usar el checklist de frecuencias en
   `recomendaciones_mantenimiento.md`.
5. **Para priorizar mejoras:** ver `mejoras_futuras.md` (alta/media/baja).
