# Instrucciones de Despliegue del Backend

> Guía paso a paso para desplegar el backend NestJS junto con PostgreSQL 16 y
> MongoDB 7 usando Docker Compose. Todos los nombres de servicios, contenedores
> y puertos provienen del `docker-compose.yml` real del proyecto.

## 1. Requisitos previos

| Requisito              | Versión mínima recomendada | Verificación                          |
| ---------------------- | -------------------------- | ------------------------------------- |
| Docker Engine          | 24.x                       | `docker --version`                    |
| Docker Compose (v2)    | 2.20.x                     | `docker compose version`              |
| Git                    | 2.34+                      | `git --version`                       |
| Acceso al repositorio | —                          | `[COMPLETAR: URL del repo]`           |
| Plataforma de hosting  | —                          | `[COMPLETAR: EC2 / Dokploy / VPS]`    |
| RAM disponible         | 2 GB+                      | `free -h`                             |
| Disco disponible       | 5 GB+                      | `df -h`                               |

## 2. Estructura de carpetas relevante

```
sistema-solicitudes-alcaldia/
├── docker-compose.yml          # Orquestación de los 3 servicios
├── backend/
│   ├── Dockerfile              # Imagen Node 20-alpine
│   ├── .env                    # Variables de entorno (NO versionado)
│   ├── .env.example            # Plantilla de variables
│   ├── package.json            # Scripts: start:dev, migration:run, etc.
│   └── src/
│       ├── main.ts             # Bootstrap NestJS, prefijo api/v1, Swagger
│       ├── app.controller.ts   # Endpoint GET /health
│       ├── database/
│       │   ├── data-source.ts  # DataSource TypeORM para migraciones
│       │   ├── migrations/     # Migraciones TypeORM
│       │   └── seeders/
│       └── documents/          # Schema Mongoose DocumentUser (MongoDB)
└── docs/
    └── deployment/             # Esta documentación
```

### 2.1 Servicios definidos en `docker-compose.yml`

| Servicio   | `container_name`        | Imagen        | Puerto host | Puerto contenedor |
| ---------- | ----------------------- | ------------- | ----------- | ----------------- |
| `backend`  | `solicitudes_backend`   | build local   | `3000`      | `3000`            |
| `postgres` | `solicitudes_postgres`  | `postgres:16` | `5432`      | `5432`            |
| `mongodb`  | `solicitudes_mongodb`   | `mongo:7`     | `27017`     | `27017`           |

Volúmenes persistentes: `postgres_data`, `mongodb_data`, `backend_node_modules`.

## 3. Variables de entorno

El backend lee variables desde `./backend/.env` (ver `env_file` en el compose)
y, además, el compose define valores por defecto en la sección `environment`.

### 3.1 Tabla de variables

| Variable                | Descripción                                  | Ejemplo                                                                 | Obligatoria | Notas                                                            |
| ----------------------- | -------------------------------------------- | ----------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------- |
| `NODE_ENV`              | Entorno de ejecución                          | `production`                                                            | Sí          | Define el modo de NestJS                                         |
| `PORT`                  | Puerto del backend dentro del contenedor     | `3000`                                                                  | Sí          | Ya fijado en el compose                                          |
| `API_PREFIX`            | Prefijo global de rutas                       | `api/v1`                                                                | Sí          | Ya fijado en el compose                                          |
| `POSTGRES_HOST`         | Host de PostgreSQL                            | `postgres`                                                              | Sí          | Dentro de la red Docker debe ser el nombre del servicio          |
| `POSTGRES_PORT`         | Puerto de PostgreSQL                          | `5432`                                                                  | Sí          | —                                                                |
| `POSTGRES_DB`           | Nombre de la base de datos                    | `solicitudes_db`                                                        | Sí          | —                                                                |
| `POSTGRES_USER`         | Usuario de PostgreSQL                         | `solicitudes_user`                                                      | Sí          | —                                                                |
| `POSTGRES_PASSWORD`     | Contraseña de PostgreSQL                      | `[COMPLETAR: contraseña segura]`                                       | Sí          | Cambiar en producción                                            |
| `MONGODB_URI`           | URI de conexión a MongoDB                     | `mongodb://solicitudes_user:solicitudes_password@mongodb:27017/...`    | Sí          | Host `mongodb` (nombre del servicio) dentro de la red Docker    |
| `JWT_SECRET`            | Secreto para firmar access tokens             | `[COMPLETAR: cadena aleatoria 64+ chars]`                               | Sí          | **PENDIENTE:** no está en `docker-compose.yml`, solo en `.env`   |
| `JWT_EXPIRES_IN`        | Vigencia del access token                     | `8h`                                                                    | Sí          | Ya fijado en el compose                                          |
| `JWT_REFRESH_SECRET`    | Secreto para firmar refresh tokens            | `[COMPLETAR: cadena aleatoria 64+ chars]`                               | Sí          | **PENDIENTE:** no está en `docker-compose.yml`, solo en `.env`   |
| `JWT_REFRESH_EXPIRES_IN`| Vigencia del refresh token                    | `7d`                                                                    | Sí          | Ya fijado en el compose                                          |

### 3.2 Pendientes a corregir en el compose

El `docker-compose.yml` actual **NO** define `JWT_SECRET` ni
`JWT_REFRESH_SECRET` en la sección `environment` del servicio `backend`.
Estos valores sí existen en `backend/.env.example` y `backend/.env`.

Acción recomendada: agregar ambas variables al `environment` del servicio
`backend` en el compose (o asegurar que el `env_file` las cargue
consistentemente). Mientras tanto, el backend las lee desde `./backend/.env`
gracias a la directiva `env_file`.

## 4. Pasos de despliegue

### Paso 1 — Clonar el repositorio

```bash
git clone [COMPLETAR: URL del repo] sistema-solicitudes-alcaldia
cd sistema-solicitudes-alcaldia
```

Si ya está clonado, actualizar a la versión etiquetada:

```bash
git fetch --tags
git checkout [COMPLETAR: tag, ej. v1.0.0]
git pull origin main
```

### Paso 2 — Crear `./backend/.env` con variables de producción

Copiar la plantilla y editar valores:

```bash
cp backend/.env.example backend/.env
```

Contenido mínimo para producción:

```dotenv
NODE_ENV=production
PORT=3000
API_PREFIX=api/v1

POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=solicitudes_db
POSTGRES_USER=solicitudes_user
POSTGRES_PASSWORD=[COMPLETAR: contraseña segura de producción]

MONGODB_URI=mongodb://solicitudes_user:[COMPLETAR-password]@mongodb:27017/solicitudes_academic?authSource=admin

JWT_SECRET=[COMPLETAR: generar con `openssl rand -hex 64`]
JWT_EXPIRES_IN=8h

JWT_REFRESH_SECRET=[COMPLETAR: generar con `openssl rand -hex 64`]
JWT_REFRESH_EXPIRES_IN=7d
```

Generación de secretos JWT seguros:

```bash
openssl rand -hex 64
```

### Paso 3 — Levantar los servicios

```bash
docker compose up -d --build
```

Esto construye la imagen del backend y levanta los 3 contenedores en segundo
plano, respetando `depends_on` (postgres y mongodb se inician antes que el
backend).

### Paso 4 — Verificar contenedores en ejecución

```bash
docker ps --filter "name=solicitudes_"
```

Salida esperada (3 contenedores con status `Up`):

```
CONTAINER ID   IMAGE           STATUS              NAMES
xxxxxxxxxxxx   ...backend      Up X minutes        solicitudes_backend
yyyyyyyyyyyy   postgres:16     Up X minutes        solicitudes_postgres
zzzzzzzzzzzz   mongo:7         Up X minutes        solicitudes_mongodb
```

### Paso 5 — Verificar logs del backend

```bash
docker logs solicitudes_backend -f
```

Buscar líneas que confirmen la conexión a las bases de datos y el arranque de
NestJS en el puerto 3000. Para salir de los logs: `Ctrl+C`.

Verificar logs individuales de cada base de datos:

```bash
docker logs solicitudes_postgres -f
docker logs solicitudes_mongodb -f
```

## 5. Configuración de base de datos

### 5.1 Creación automática de la base PostgreSQL

La imagen oficial `postgres:16` crea automáticamente la base de datos y el
usuario a partir de las variables de entorno del servicio `postgres` en el
compose:

- `POSTGRES_DB=solicitudes_db`
- `POSTGRES_USER=solicitudes_user`
- `POSTGRES_PASSWORD=solicitudes_password`

No se requiere un script de inicialización adicional. Los datos persisten en
el volumen `postgres_data`.

### 5.2 Creación automática de la base MongoDB

La imagen oficial `mongo:7` crea el usuario root a partir de:

- `MONGO_INITDB_ROOT_USERNAME=solicitudes_user`
- `MONGO_INITDB_ROOT_PASSWORD=solicitudes_password`

Los datos persisten en el volumen `mongodb_data`. La base `solicitudes_academic`
se crea al primer documento escrito por Mongoose.

### 5.3 Ejecución de migraciones TypeORM

Las migraciones viven en `backend/src/database/migrations/` y deben ejecutarse
**después** de que el contenedor de Postgres esté levantado.

Ejecutar todas las migraciones pendientes:

```bash
docker exec -it solicitudes_backend npm run migration:run
```

Ver el estado de las migraciones (cuáles aplicadas, cuáles pendientes):

```bash
docker exec -it solicitudes_backend npm run migration:show
```

Revertir la última migración (solo si es necesario):

```bash
docker exec -it solicitudes_backend npm run migration:revert
```

> Nota: el `DataSource` de migraciones (`backend/src/database/data-source.ts`)
> tiene `synchronize: false`, por lo que el esquema solo se crea vía
> migraciones explícitas. No se sincroniza automáticamente.

### 5.4 Seeds

Actualmente no existe un script `seed:run` en `package.json`. Los datos
iniciales (roles, estados, departamentos, categorías y usuarios demo) se
insertan mediante migraciones de tipo `Seed*` (ver
`backend/src/database/migrations/`), por lo que `npm run migration:run` ya
puebla los datos base.

## 6. Configuración de almacenamiento de archivos escaneados

El schema `DocumentUser` (`backend/src/documents/schema/document-user.schema.ts`)
almacena **metadatos** en MongoDB: `fileName`, `fileType`, `size`, `url`,
`requestId`, `userId`, `isActive`.

La ubicación física de los archivos binarios escaneados **no está definida en
el `docker-compose.yml` actual** (no hay volumen de uploads ni referencia a
bucket S3).

- Ubicación real de archivos: `[COMPLETAR: volumen Docker / ruta en disco / bucket S3]`
- Estrategia de persistencia: `[COMPLETAR]`

Acción pendiente: definir y mapear un volumen o bucket para los archivos
físicos y reflejarlo en el `docker-compose.yml` (ver
`docs/deployment/respaldo_archivos_escaneados.md`).

## 7. Verificación post-despliegue

### 7.1 Health check

```bash
curl -i http://localhost:3000/api/v1/health
```

Respuesta esperada:

```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "ok",
  "timestamp": "2026-07-16T17:00:00.000Z",
  "services": {
    "postgres": "connected",
    "mongodb": "connected"
  }
}
```

### 7.2 Swagger UI

Abrir en el navegador:

```
http://localhost:3000/api/docs
```

### 7.3 Prueba de endpoint autenticado

```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"[COMPLETAR]","password":"[COMPLETAR]"}'

# Usar token devuelto
curl -X GET http://localhost:3000/api/v1/[COMPLETAR-recurso] \
  -H "Authorization: Bearer [TOKEN]"
```

## 8. Solución de problemas comunes

### 8.1 Puerto ocupado

Síntoma: `Bind for 0.0.0.0:3000 failed: port is already allocated`.

```bash
# Identificar proceso que ocupa el puerto
lsof -i :3000          # macOS/Linux
# o
sudo netstat -tlnp | grep 3000

# Liberar el puerto
kill -9 <PID>

# Alternativa: mapear a otro puerto en el compose (solo host)
# ports:
#   - "3001:3000"
```

### 8.2 Falla de conexión a PostgreSQL

Síntoma: el backend reporta `postgres: disconnected` o error
`ECONNREFUSED` al levantar.

Verificar que el contenedor de Postgres esté sano:

```bash
docker ps --filter "name=solicitudes_postgres"
docker logs solicitudes_postgres
```

Verificar conectividad desde el backend (el host debe ser `postgres`, nombre
del servicio en el compose, no `localhost`):

```bash
docker exec -it solicitudes_backend sh
# dentro del contenedor:
nc -zv postgres 5432
```

Si se cambió `POSTGRES_HOST` a `localhost` en `./backend/.env`, corregirlo a
`postgres` (nombre del servicio dentro de la red de Docker).

### 8.3 Falla de conexión a MongoDB

Síntoma: `mongodb: disconnected` en el health check.

```bash
docker logs solicitudes_mongodb
docker exec -it solicitudes_backend sh -c "nc -zv mongodb 27017"
```

Validar que `MONGODB_URI` use `mongodb://...@mongodb:27017/...` (host
`mongodb`, no `localhost`) cuando se corre dentro del compose.

### 8.4 Variables de entorno faltantes

Síntoma: el backend falla al arranque por `JWT_SECRET` o
`JWT_REFRESH_SECRET` no definidos.

```bash
# Verificar variables cargadas en el contenedor
docker exec -it solicitudes_backend env | grep JWT
```

Confirmar que `./backend/.env` contiene ambos secretos y que el compose carga
`env_file: ./backend/.env`.

### 8.5 Contenedor reiniciándose en loop

Síntoma: `STATUS: Restarting (...)` en `docker ps`.

```bash
docker logs solicitudes_backend --tail 100
```

Causas frecuentes:
- Migraciones no ejecutadas (el backend no encuentra tablas) → ejecutar
  `docker exec -it solicitudes_backend npm run migration:run`.
- `POSTGRES_HOST` incorrecto (debe ser `postgres`).
- `MONGODB_URI` con host incorrecto (debe ser `mongodb`).
- Secretos JWT vacíos.

### 8.6 Reinicio completo del stack

```bash
docker compose down
docker compose up -d --build
```

Para limpiar también los volúmenes (¡borra los datos!):

```bash
docker compose down -v
```
