# Limitaciones Conocidas

> Listado de limitaciones técnicas y operativas del despliegue actual del
> sistema de solicitudes de alcaldía. Cada limitación incluye su impacto real
> y una referencia a la mejora futura asociada (ver
> `docs/deployment/mejoras_futuras.md`).

## 1. Sin balanceo de carga / única instancia del backend

**Descripción:** el `docker-compose.yml` define un único contenedor
`solicitudes_backend` (`docker-compose.yml:2`). No hay réplicas ni un
balanceador delante. El backend se reinicia solo por `depends_on`, no por
política de salud.

**Impacto real:**
- Si el contenedor del backend cae, la API queda totalmente fuera de servicio.
- No hay zero-downtime: cualquier despliegue implica un corte mientras se
  reconstruye/reinicia el contenedor.
- No se pueden escalar para soportar más concurrencia que la que admite un
  solo proceso Node.js.

## 2. Sin HTTPS gestionado automáticamente

**Descripción:** el backend NestJS expone únicamente HTTP en el puerto 3000
(`backend/src/main.ts:23`, `backend/Dockerfile:15`). No hay configuración de
Caddy, Nginx, Traefik ni certificados automáticos (Let's Encrypt) en el
repositorio. La carpeta `infra/` solo contiene un `README.md` y un
`infra/docker/.gitkeep`.

**Impacto real:**
- Si la API se expone directamente a Internet, las credenciales (login,
  JWT, contraseñas en tránsito) viajan en claro.
- Hasta que se agregue un reverse proxy con TLS, se debe asumir que el
  tráfico entre el cliente y la API es inseguro.

## 3. Contraseñas de BD hardcodeadas en el compose

**Descripción:** `docker-compose.yml:19` y `docker-compose.yml:36-37`
incluyen en texto plano `POSTGRES_PASSWORD=solicitudes_password` y
`MONGO_INITDB_ROOT_PASSWORD=solicitudes_password`. Lo mismo ocurre con la
`MONGODB_URI` (`docker-compose.yml:20`) que contiene usuario y contraseña
incrustados.

**Impacto real:**
- Las credenciales quedan versionadas en el repositorio (accesibles a todo
  quien tenga acceso al código).
- Cualquier filtración del repositorio expone credenciales de las bases
  de datos.
- Rotación de secretos requiere editar el compose y re-desplegar.

## 4. Secretos JWT ausentes en el compose

**Descripción:** `JWT_SECRET` y `JWT_REFRESH_SECRET` **no** están definidos
en la sección `environment` del servicio `backend` en el
`docker-compose.yml`. Sí figuran en `backend/.env.example` y `backend/.env`
con valores de placeholder (`anadir_secret_super_seguro_aqui`).

**Impacto real:**
- El backend depende exclusivamente de que `env_file: ./backend/.env`
  cargue los secretos. Si el archivo falta o está mal, el backend falla al
  arranque.
- Los valores actuales (`anadir_secret_super_seguro_aqui`) son inseguros y
  deben rotarse en cualquier despliegue real.

## 5. Sin monitoreo ni alertas automatizadas

**Descripción:** no hay configuración de Prometheus, Grafana, Uptime Kuma,
Alertmanager ni ningún exportador en el repositorio. Tampoco hay health
checks de Docker (`HEALTHCHECK`) en el `docker-compose.yml` ni en el
`Dockerfile`.

**Impacto real:**
- Una caída del backend o de las bases de datos puede pasar desapercibida
  hasta que un usuario lo reporte.
- No hay métricas de latencia, uso de CPU/memoria, ni tasa de errores.
- El único diagnóstico disponible es inspeccionar manualmente los logs con
  `docker logs`.

## 6. Sin backups automatizados (estado actual)

**Descripción:** no existe ningún `cron`, job de CI o sidecar que ejecute
`pg_dump` o `mongodump` de forma programada. Los procedimientos de respaldo
documentados en `docs/deployment/respaldo_base_datos.md` son manuales.

**Impacto real:**
- Riesgo de pérdida total de datos si no se ejecutan los respaldos a mano
  con disciplina.
- No hay trazabilidad de cuándo fue el último respaldo válido.

## 7. Almacenamiento de archivos escaneados no definido

**Descripción:** el schema `DocumentUser`
(`backend/src/documents/schema/document-user.schema.ts`) guarda metadatos
en MongoDB, pero el `docker-compose.yml` **no** define un volumen para
archivos binarios ni una referencia a bucket S3. El `Dockerfile` tampoco
define un `VOLUME` de uploads.

**Impacto real:**
- No hay estrategia clara de dónde viven los archivos físicos.
- Al reiniciar el contenedor sin un volumen mapeado, los archivos subidos
  podrían perderse.
- La estrategia de respaldo de archivos no se puede completar hasta
  resolver esto (ver `docs/deployment/respaldo_archivos_escaneados.md`).

## 8. Backend corre en modo desarrollo en el compose

**Descripción:** el comando del contenedor backend es `npm run start:dev`
(`docker-compose.yml:7`), que ejecuta `nest start --watch` (ver
`backend/package.json:7`). Esto activa hot-reload y mounting del volumen
`./backend:/app`.

**Impacto real:**
- No es la configuración ideal para producción (sobrecarga de file
  watchers, sin optimización de build).
- El build de producción debería usar `npm run build` + `npm run start:prod`
  (`backend/package.json:8-9`) o un comando equivalente.

## 9. Sin migraciones automáticas al levantar el stack

**Descripción:** el `DataSource` de TypeORM
(`backend/src/database/data-source.ts:14`) tiene `synchronize: false`. El
contenedor del backend **no** ejecuta migraciones automáticamente al
arrancar; deben correrse a mano con
`docker exec -it solicitudes_backend npm run migration:run`.

**Impacto real:**
- Un despliegue que olvide ejecutar las migraciones dejará la base sin
  esquema y el backend fallará al consultar tablas inexistentes.
- Es un paso manual adicional que propaga errores humanos.

## 10. Puertos de bases de datos expuestos al host

**Descripción:** el `docker-compose.yml` publica los puertos `5432`
(Postgres, `docker-compose.yml:38`) y `27017` (Mongo, `docker-compose.yml:49`)
hacia el host. Útil en desarrollo pero innecesario y riesgoso en producción.

**Impacto real:**
- Si el host es accesible desde Internet, las bases quedan expuestas
  directamente a ataques de fuerza bruta.
- Recomendación de producción: quitar el mapeo `ports:` y dejar solo la
  comunicación interna entre contenedores.

## 11. Sin pruebas de integración automatizadas en el flujo de despliegue

**Descripción:** no existe un paso en CI que valide el stack completo
levantado con Docker Compose antes de marcar un despliegue como exitoso. La
carpeta `backend/test/` existe, pero el `package.json` no expone script de
tests.

**Impacto real:**
- Un despliegue puede pasar a producción con regresiones no detectadas.
- La verificación post-despliegue depende de pruebas manuales.
