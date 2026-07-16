# Mejoras Futuras

> Lista priorizada de mejoras para el despliegue y operación del sistema de
> solicitudes de alcaldía. Las prioridades se asignan considerando impacto en
> seguridad, disponibilidad y mantenibilidad. Cada mejora referencia la
> limitación asociada en `docs/deployment/limitaciones_conocidas.md`.

## Prioridad ALTA

### 1. Mover secretos a un gestor de secretos

**Problema:** contraseñas de BD y URI de Mongo hardcodeadas en
`docker-compose.yml`; secretos JWT con placeholders inseguros en `.env`.
Ver limitaciones 3 y 4.

**Propuesta:**
- Usar Docker Secrets, o un gestor externo (Vault, AWS Secrets Manager,
  Doppler, 1Password Connect).
- Eliminar credenciales del `docker-compose.yml` y reemplazarlas por
  referencias a secretos.
- Rotar `JWT_SECRET`, `JWT_REFRESH_SECRET` y las contraseñas de BD.

**Beneficio:** elimina exposición de credenciales en el repositorio y
facilita rotación.

### 2. Agregar HTTPS con reverse proxy

**Problema:** el backend solo expone HTTP; no hay TLS. Ver limitación 2.

**Propuesta:**
- Incorporar Caddy o Nginx como servicio en el compose delante del backend.
- Caddy emite y renueva certificados Let's Encrypt automáticamente.
- Mapear solo el puerto 443 del reverse proxy; el backend queda interno.

Estructura propuesta en el compose:

```yaml
services:
  caddy:
    image: caddy:2
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infra/caddy/Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - backend
```

**Beneficio:** cifrado en tránsito, redirección HTTP→HTTPS automática,
cabeceras de seguridad.

### 3. Definir el almacenamiento de archivos escaneados

**Problema:** no existe volumen ni bucket para los binarios de documentos
escaneados. Ver limitación 7.

**Propuesta:**
- Opción A: mapear un volumen Docker para uploads en el compose y respaldarlo.
- Opción B (recomendada): integrar S3 (u objeto equivalente) para guardar
  los binarios y registrar la URL en el schema `DocumentUser` de MongoDB.

**Beneficio:** persistencia real de los archivos y respaldo viable.

## Prioridad MEDIA

### 4. Automatizar backups de base de datos

**Problema:** los respaldos son manuales. Ver limitación 6.

**Propuesta:**
- Crear un contenedor sidecar `backup` en el compose que ejecute `pg_dump`
  y `mongodump` según un cron.
- Subir los dumps a S3 con `aws s3 cp`.
- Definir política de retención (ej. 7 diarios + 4 semanales).

**Beneficio:** respaldos consistentes y trazables sin intervención manual.

### 5. Ejecutar migraciones automáticamente al arrancar

**Problema:** las migraciones son un paso manual que se olvida fácil. Ver
limitación 9.

**Propuesta:**
- Cambiar el comando del contenedor backend en producción a un script que
  ejecute `npm run migration:run` antes de `npm run start:prod`:

```yaml
backend:
  command: sh -c "npm run migration:run && npm run start:prod"
```

- Mantener `npm run start:dev` solo para el compose de desarrollo.

**Beneficio:** esquema siempre sincronizado, menos errores humanos.

### 6. Cambiar el backend a modo producción

**Problema:** el compose corre `npm run start:dev` (con watch). Ver
limitación 8.

**Propuesta:**
- Crear un `docker-compose.prod.yml` (override) que use build multi-stage y
  `npm run start:prod`.
- Quitar el volumen `./backend:/app` en producción (no se necesita hot
  reload).

**Beneficio:** menos overhead, imágenes más livianas, sin file watchers en
producción.

### 7. Agregar health checks de Docker

**Problema:** no hay `HEALTHCHECK` definido en el compose ni en el Dockerfile.
Ver limitación 5.

**Propuesta:**
- En el `Dockerfile`:

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/v1/health || exit 1
```

- En el compose, usar `depends_on` con `condition: service_healthy` para
  que el backend espere a que Postgres y Mongo estén listos.

**Beneficio:** reinicios automáticos informados por salud real, no solo por
estado del proceso.

### 8. Cerrar puertos de bases de datos al host

**Problema:** `5432` y `27017` están publicados al host. Ver limitación 10.

**Propuesta:**
- En el compose de producción, eliminar la sección `ports:` de `postgres`
  y `mongodb`. La comunicación entre contenedores no la necesita.

**Beneficio:** reduce superficie de ataque.

## Prioridad BAJA

### 9. Monitoreo con Prometheus + Grafana

**Problema:** no hay métricas ni alertas. Ver limitación 5.

**Propuesta:**
- Agregar `prometheus`, `grafana` y `node-exporter` al compose.
- Exponer métricas del backend con `@willsoto/nestjs-prometheus`.
- Configurar dashboards de CPU, memoria, latencia HTTP y estado de BD.

**Beneficio:** observabilidad y detección temprana de incidentes.

### 10. Logs centralizados

**Problema:** los logs solo viven dentro de cada contenedor y se pierden al
reiniciarlo.

**Propuesta:**
- Enviar logs a un stack ELK/loki o un servicio gestionado (Datadog,
  Logtail, Grafana Loki).
- Configurar NestJS con logger JSON estructurado (`pino`).

**Beneficio:** trazabilidad histórica y correlación de incidentes.

### 11. Escalado horizontal del backend

**Problema:** única instancia del backend. Ver limitación 1.

**Propuesta:**
- En el compose, declarar `deploy.replicas: 3` (en Swarm) o usar Kubernetes.
- Poner un reverse proxy/load balancer (Caddy ya lo hace) delante.
- Si el backend guarda estado en memoria (sesiones), moverlo a Redis.

**Beneficio:** alta disponibilidad y capacidad de absorber picos de carga.

### 12. CI/CD con verificación de integración

**Problema:** no hay pruebas de integración automatizadas en el flujo de
despliegue. Ver limitación 11.

**Propuesta:**
- En GitHub Actions, levantar el stack completo con `docker compose` y
  ejecutar tests e2e contra el health check y endpoints clave antes de
  promocionar el despliegue.

**Beneficio:** detección de regresiones antes de producción.

### 13. Documentación de runbooks operativos

**Problema:** los procedimientos actuales viven en markdown pero no hay un
runbook operativo por incidente.

**Propuesta:**
- Crear `docs/runbooks/` con procedimientos específicos (caída de Postgres,
  saturación de disco, certificado vencido, etc.).

**Beneficio:** respuesta más rápida a incidentes y menos dependencia de
conocimiento individual.
