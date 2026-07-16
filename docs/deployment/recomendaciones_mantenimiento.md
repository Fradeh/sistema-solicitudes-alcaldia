# Recomendaciones de Mantenimiento

> Pautas de mantenimiento preventivo y correctivo para el sistema de
> solicitudes de alcaldía desplegado con Docker Compose. Incluye frecuencias
> sugeridas y un checklist final de seguridad.

## 1. Mantenimiento preventivo

### 1.1 Actualización de imágenes base

**Frecuencia sugerida:** mensual.

Revisar y actualizar las imágenes oficiales para incorporar parches de
seguridad:

```bash
# Ver imágenes en uso
docker compose images

# Actualizar a últimas versiones dentro de la rama mayor
docker compose pull
docker compose up -d --build
```

Imágenes vigentes en el proyecto:

| Imagen          | Restricción de versión |
| --------------- | ---------------------- |
| `node:20-alpine`| Node 20 (LTS)          |
| `postgres:16`   | PostgreSQL 16          |
| `mongo:7`       | MongoDB 7              |

Antes de saltar de versión mayor (ej. Postgres 16 → 17), hacer prueba en
ambiente aislado.

### 1.2 Revisión de espacio en disco

**Frecuencia sugerida:** semanal.

```bash
# Espacio del host
df -h

# Espacio usado por Docker (imágenes, contenedores, volúmenes, logs)
docker system df -v
```

Limpieza segura (no afecta contenedores en ejecución ni volúmenes
nombrados del compose):

```bash
docker image prune -a --filter "until=720h"
docker builder prune -f
```

> No ejecutar `docker system prune -a --volumes` sin revisión previa:
> eliminaría `postgres_data` y `mongodb_data` y se perderían los datos.

### 1.3 Rotación de logs de contenedores

**Frecuencia sugerida:** mensual (o cuando los logs superen 1 GB por
contenedor).

Docker por defecto usa `json-file` sin rotación. Configurar rotación en
`/etc/docker/daemon.json` del host (requiere reiniciar el daemon de Docker):

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "5"
  }
}
```

Inspeccionar tamaño actual de logs de cada contenedor:

```bash
docker inspect --format='{{.LogPath}}' solicitudes_backend | xargs ls -lh
docker inspect --format='{{.LogPath}}' solicitudes_postgres | xargs ls -lh
docker inspect --format='{{.LogPath}}' solicitudes_mongodb | xargs ls -lh
```

### 1.4 Prueba periódica de restauración

**Frecuencia sugerida:** mensual.

Restaurar el último respaldo en un ambiente aislado (no producción) y
verificar integridad. Seguir el procedimiento completo en
`docs/deployment/restauracion_del_sistema.md`.

Registrar resultado en `docs/deployment/respaldo_base_datos.md` (sección 7).

### 1.5 Revisión de actualizaciones del SO y parches del host

**Frecuencia sugerida:** mensual.

```bash
# Linux (Debian/Ubuntu)
sudo apt update && sudo apt list --upgradable
sudo apt upgrade -y

# Reiniciar si es necesario
sudo reboot
```

### 1.6 Monitoreo de salud manual (mientras no haya alertas)

**Frecuencia sugerida:** diaria.

```bash
curl -i http://localhost:3000/api/v1/health
docker ps --filter "name=solicitudes_" --format "table {{.Names}}\t{{.Status}}"
```

### 1.7 Verificación de respaldos recientes

**Frecuencia sugerida:** diaria.

```bash
ls -lht backups/postgres/ | head -5
ls -lht backups/mongo/ | head -5
```

Confirmar que existe al menos un respaldo de las últimas 24 horas.

## 2. Mantenimiento correctivo

### 2.1 Ante caída del servicio del backend

Síntoma: el health check no responde o el contenedor está en `Restarting`.

```bash
# 1. Estado de los contenedores
docker ps -a --filter "name=solicitudes_"

# 2. Logs del backend
docker logs solicitudes_backend --tail 200

# 3. Verificar dependencias
docker logs solicitudes_postgres --tail 50
docker logs solicitudes_mongodb --tail 50

# 4. Si la causa es migraciones faltantes
docker exec -it solicitudes_backend npm run migration:run

# 5. Si la causa es un cuelgue, reiniciar el backend
docker restart solicitudes_backend

# 6. Si persiste, reiniciar todo el stack
docker compose down
docker compose up -d --build
```

### 2.2 Ante caída de PostgreSQL

```bash
# Estado del contenedor
docker ps -a --filter "name=solicitudes_postgres"

# Logs
docker logs solicitudes_postgres --tail 200

# Si el volumen está corrupto, restaurar desde el último dump
docker compose down
# (Opcional) renombrar el volumen dañado para preservar evidencia
docker volume rename sistema-solicitudes-alcaldia_postgres_data postgres_data_broken
docker compose up -d postgres
# Restaurar siguiendo docs/deployment/restauracion_del_sistema.md paso 3
```

### 2.3 Ante caída de MongoDB

```bash
docker logs solicitudes_mongodb --tail 200

# Si se necesita restaurar
docker compose down
docker volume rename sistema-solicitudes-alcaldia_mongodb_data mongodb_data_broken
docker compose up -d mongodb
# Restaurar siguiendo docs/deployment/restauracion_del_sistema.md paso 4
```

### 2.4 Ante saturación de disco

Síntoma: contenedores se reinician, Postgres reporta `No space left on
device`.

```bash
df -h
docker system df

# Limpiar imágenes y build cache
docker image prune -a -f
docker builder prune -f

# Limpiar logs viejos manualmente si no hay rotación configurada
docker inspect --format='{{.LogPath}}' solicitudes_backend | xargs truncate -s 0
```

Si el problema persiste, revisar tamaño de los volúmenes de datos y
considerar expansión del disco del host.

### 2.5 Rollback a una versión anterior del backend

```bash
# 1. Identificar tags disponibles
git tag -l --sort=-v:refname

# 2. Hacer checkout a la versión anterior
git checkout [COMPLETAR: tag anterior, ej. v1.0.0]

# 3. Reconstruir y reiniciar solo el backend (sin tocar las BD)
docker compose up -d --build backend

# 4. Si la nueva versión incluía una migración que se debe revertir
docker exec -it solicitudes_backend npm run migration:revert
```

> Antes de revertir migraciones, respaldar la base de datos actual.

### 2.6 Ante certificado HTTPS vencido (cuando se implemente reverse proxy)

```bash
# Con Caddy, la renovación es automática. Verificar el estado:
docker logs caddy --tail 50 | grep -i certificate

# Forzar renovación si fue necesario
docker restart caddy
```

## 3. Frecuencias resumidas

| Acción                                | Frecuencia sugerida |
| ------------------------------------- | ------------------- |
| Health check manual                   | Diaria              |
| Verificación de respaldos recientes   | Diaria              |
| Revisión de espacio en disco          | Semanal            |
| Actualización de imágenes base        | Mensual             |
| Rotación de logs de contenedores      | Mensual             |
| Prueba de restauración de respaldo    | Mensual             |
| Parches del sistema operativo del host| Mensual             |
| Rotación de contraseñas y secretos    | Trimestral          |
| Revisión de accesos y permisos        | Trimestral          |
| Revisión del `.env` y secretos        | Trimestral          |
| Prueba de disaster recovery completa  | Semestral           |

## 4. Checklist final de seguridad

Revisión recomendada antes de cualquier despliegue a producción y de forma
trimestral:

- [ ] Ninguna contraseña ni secreto está hardcoded en el
      `docker-compose.yml` (mover a gestor de secretos).
- [ ] `JWT_SECRET` y `JWT_REFRESH_SECRET` están rotados y son cadenas
      aleatorias de al menos 64 bytes (`openssl rand -hex 64`).
- [ ] `./backend/.env` tiene permisos `600` y no está versionado (verificar
      `.gitignore`).
- [ ] Las contraseñas de Postgres y Mongo de producción **no** son
      `solicitudes_password`.
- [ ] Los puertos `5432` y `27017` no están publicados al host en el
      compose de producción.
- [ ] Existe HTTPS delante del backend (Caddy/Nginx con certificado válido).
- [ ] Los respaldos de Postgres y Mongo de las últimas 24 horas existen y
      pesan lo esperado.
- [ ] La prueba de restauración del último mes fue exitosa.
- [ ] Los logs rotan (`max-size` configurado en el daemon de Docker).
- [ ] Las imágenes base están actualizadas dentro de su versión mayor.
- [ ] Los accesos SSH al host usan clave, no contraseña, y solo personal
      autorizado tiene acceso.
- [ ] Swagger UI (`/api/docs`) está deshabilitado o protegido en producción
      si no se requiere exponerlo.
- [ ] Se revisaron los accesos a Docker (`docker group`) en el host y se
      limitaron a usuarios necesarios.
- [ ] Se eliminaron imágenes y contenedores huérfanos (`docker system df`).

## 5. Responsables

| Rol                                  | Nombre         | Contacto      |
| ------------------------------------ | -------------- | ------------- |
| Encargado de mantenimiento preventivo| `[COMPLETAR]`  | `[COMPLETAR]`  |
| Encargado de mantenimiento correctivo| `[COMPLETAR]`  | `[COMPLETAR]`  |
| Encargado de backups y restauración  | Integrante 3   | `[COMPLETAR]`  |
| Revisión de seguridad trimestral    | `[COMPLETAR]`  | `[COMPLETAR]`  |
