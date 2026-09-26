# Restauración del Sistema

> Procedimiento completo para restaurar el sistema completo (código,
> variables de entorno, PostgreSQL, MongoDB y archivos escaneados) a partir
> de los respaldos. Pensado para un escenario de recuperación ante desastre.

## 1. Orden recomendado de restauración

El orden respeta las dependencias entre componentes: primero se recuperan
código y configuración, luego las bases de datos relacionales y documentales,
finalmente los archivos físicos y se levanta el stack.

### Paso 1 — Restaurar el código (versión etiquetada)

```bash
git clone [COMPLETAR: URL del repo] sistema-solicitudes-alcaldia
cd sistema-solicitudes-alcaldia
git fetch --tags
git checkout [COMPLETAR: tag de la versión a restaurar, ej. v1.0.0]
```

Verificar la versión:

```bash
git describe --tags
git log -1 --oneline
```

### Paso 2 — Restaurar variables de entorno (`./backend/.env`)

Recuperar el archivo `.env` desde el gestor de secretos o copia segura
(fuera del repositorio, que es lo correcto ya que está en `.gitignore`):

```bash
cp [COMPLETAR-ruta-respaldo-.env] backend/.env
chmod 600 backend/.env
```

Verificar que contiene todos los valores obligatorios (ver tabla en
`docs/deployment/instrucciones_despliegue_backend.md`):

```bash
grep -E '^(POSTGRES_|MONGODB_URI|JWT_)' backend/.env
```

### Paso 3 — Restaurar base de datos PostgreSQL

Levantar únicamente el servicio de Postgres para restaurar los datos:

```bash
docker compose up -d postgres
```

Esperar a que esté listo:

```bash
until docker exec solicitudes_postgres pg_isready -U solicitudes_user; do
  sleep 2
done
```

Restaurar el dump SQL (formato plano):

```bash
docker exec -i solicitudes_postgres \
  psql -U solicitudes_user -d solicitudes_db < backups/postgres/backup_$(date +%F).sql
```

Restaurar el dump en formato custom (`pg_dump -Fc`):

```bash
docker cp backups/postgres/backup_$(date +%F).dump \
  solicitudes_postgres:/tmp/backup.dump
docker exec -i solicitudes_postgres \
  pg_restore -U solicitudes_user -d solicitudes_db --clean --if-exists /tmp/backup.dump
```

Verificar conteo de tablas clave:

```bash
docker exec -i solicitudes_postgres \
  psql -U solicitudes_user -d solicitudes_db -c \
  "SELECT 'users' AS tabla, COUNT(*) FROM users
   UNION ALL SELECT 'requests', COUNT(*) FROM requests
   UNION ALL SELECT 'request_history', COUNT(*) FROM request_history
   UNION ALL SELECT 'departments', COUNT(*) FROM departments
   UNION ALL SELECT 'roles', COUNT(*) FROM roles;"
```

### Paso 4 — Restaurar MongoDB

Levantar el servicio de MongoDB:

```bash
docker compose up -d mongodb
```

Esperar a que esté listo:

```bash
until docker exec solicitudes_mongodb mongosh --eval "db.runCommand({ping:1})" \
  --username solicitudes_user --password [COMPLETAR-password] \
  --authenticationDatabase admin >/dev/null 2>&1; do
  sleep 2
done
```

Restaurar el dump desde archivo `.archive`:

```bash
docker cp backups/mongo/mongo_$(date +%F).archive \
  solicitudes_mongodb:/tmp/mongo.archive

docker exec -i solicitudes_mongodb \
  mongorestore --username solicitudes_user \
               --password [COMPLETAR-password] \
               --authenticationDatabase admin \
               --archive=/tmp/mongo.archive --drop
```

Restaurar desde un directorio de dump (formato `mongodump` clásico):

```bash
docker cp backups/mongo/mongo_$(date +%F) solicitudes_mongodb:/tmp/dump

docker exec -i solicitudes_mongodb \
  mongorestore --username solicitudes_user \
               --password [COMPLETAR-password] \
               --authenticationDatabase admin \
               --drop /tmp/dump
```

Verificar conteo de documentos en la colección `documentusers`:

```bash
docker exec -i solicitudes_mongodb \
  mongosh --username solicitudes_user --password [COMPLETAR-password] \
  --authenticationDatabase admin --eval \
  "db.getSiblingDB('solicitudes_academic').documentusers.countDocuments()"
```

### Paso 5 — Restaurar archivos escaneados

Restaurar desde el respaldo de volumen Docker:

```bash
docker run --rm \
  -v [COMPLETAR-volumen-uploads]:/data \
  -v $(pwd)/backups/archivos:/backup \
  alpine tar xzf /backup/archivos_$(date +%F).tar.gz -C /data
```

Restaurar desde S3 (si los archivos viven en un bucket):

```bash
aws s3 sync s3://[COMPLETAR-bucket-respaldo]/archivos-escaneados/$(date +%F)/ \
  [COMPLETAR-ruta-local-uploads]/
```

Verificar conteo de archivos restaurados:

```bash
find [COMPLETAR-ruta-uploads] -type f | wc -l
```

Comparar con el conteo de documentos en la colección `documentusers` de
MongoDB (deben ser consistentes, salto documentos marcados `isActive=false`).

### Paso 6 — Levantar todos los servicios

```bash
docker compose up -d --build
```

Verificar estado de los contenedores:

```bash
docker ps --filter "name=solicitudes_"
```

### Paso 7 — Verificar integridad

#### 7.1 Health check

```bash
curl -i http://localhost:3000/api/v1/health
```

Debe devolver `200` con `postgres: connected` y `mongodb: connected`.

#### 7.2 Migraciones (validar que no falten)

```bash
docker exec -it solicitudes_backend npm run migration:show
```

Si hay migraciones pendientes, ejecutarlas:

```bash
docker exec -it solicitudes_backend npm run migration:run
```

#### 7.3 Prueba de login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"[COMPLETAR]","password":"[COMPLETAR]"}'
```

Debe devolver `access_token` y `refresh_token`.

#### 7.4 Prueba de endpoint de negocio

```bash
curl -X GET http://localhost:3000/api/v1/[COMPLETAR-recurso] \
  -H "Authorization: Bearer [TOKEN]"
```

#### 7.5 Conteo de registros vs. respaldo

Registrar resultados de la verificación:

| Componente  | Conteo esperado (respaldo) | Conteo obtenido | OK / Fallido |
| ----------- | ------------------------- | --------------- | ------------ |
| PostgreSQL  | `[COMPLETAR]`             | `[COMPLETAR]`   | `[COMPLETAR]`|
| MongoDB     | `[COMPLETAR]`             | `[COMPLETAR]`   | `[COMPLETAR]`|
| Archivos    | `[COMPLETAR]`             | `[COMPLETAR]`   | `[COMPLETAR]`|

## 2. Tiempo estimado de restauración completa

| Etapa                          | Tiempo estimado |
| ------------------------------ | --------------- |
| Clonar código y checkout tag   | 2-5 min         |
| Restaurar `.env`               | 1 min           |
| Levantar Postgres + restore     | 5-15 min        |
| Levantar MongoDB + restore      | 5-15 min        |
| Restaurar archivos escaneados   | `[COMPLETAR]`   |
| Levantar backend + verify       | 3-5 min         |
| Verificación integral           | 5-10 min        |
| **Total estimado**              | **`[COMPLETAR]: 20-50 min]`** |

El tiempo real depende del volumen de datos y del ancho de banda si se
restaura desde S3.

## 3. Responsable de ejecutar el procedimiento

| Rol                              | Nombre         | Contacto      |
| -------------------------------- | -------------- | ------------- |
| Coordina la restauración         | `[COMPLETAR]`  | `[COMPLETAR]`  |
| Ejecuta restore PostgreSQL       | `[COMPLETAR]`  | `[COMPLETAR]`  |
| Ejecuta restore MongoDB          | `[COMPLETAR]`  | `[COMPLETAR]`  |
| Ejecuta restore de archivos      | `[COMPLETAR]`  | `[COMPLETAR]`  |
| Verifica integridad post-restore | `[COMPLETAR]`  | `[COMPLETAR]`  |

## 4. Checklist final de restauración

- [ ] Código clonado en el tag correcto
- [ ] `./backend/.env` restaurado con valores de producción
- [ ] PostgreSQL restaurado y conteo verificado
- [ ] MongoDB restaurado y conteo de `documentusers` verificado
- [ ] Archivos escaneados restaurados y conteo consistente
- [ ] `docker compose up -d` sin errores
- [ ] Health check devuelve `200` con ambos servicios `connected`
- [ ] `migration:show` sin migraciones pendientes
- [ ] Login funcional (devuelve tokens)
- [ ] Al menos un endpoint de negocio responde correctamente
- [ ] Logs del backend sin errores (`docker logs solicitudes_backend --tail 200`)
