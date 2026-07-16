# Respaldo de Base de Datos

> Procedimiento de respaldo para PostgreSQL 16 (base relacional oficial) y
> MongoDB 7 (base documental de archivos escaneados y checklist documental).
>
> **Atención:** este documento debe ser coordinado con el Integrante 3
> (encargado de bases de datos). Las secciones marcadas con
> `[PENDIENTE CON INTEGRANTE 3]` requieren confirmación explícita de ese
> responsable antes de quedar completas.

## 1. Alcance

| Base de datos | Motor        | Contenedor               | Volumen          | Uso                                |
| ------------- | ------------ | ------------------------ | ---------------- | ---------------------------------- |
| Relacional    | PostgreSQL 16| `solicitudes_postgres`   | `postgres_data`  | Solicitudes, estados, usuarios, etc.|
| Documental    | MongoDB 7    | `solicitudes_mongodb`    | `mongodb_data`   | Metadatos de archivos escaneados    |

## 2. Método de respaldo

### 2.1 PostgreSQL — `pg_dump`

Respaldo en formato SQL plano (recomendado para restore vía `psql`):

```bash
docker exec -t solicitudes_postgres \
  pg_dump -U solicitudes_user -d solicitudes_db -F p --no-owner --no-privileges \
  > backups/postgres/solicitudes_db_$(date +%F).sql
```

Respaldo en formato custom (recomendado para restore vía `pg_restore`, más
flexible):

```bash
docker exec -t solicitudes_postgres \
  pg_dump -U solicitudes_user -d solicitudes_db -F c --no-owner --no-privileges \
  > backups/postgres/solicitudes_db_$(date +%F).dump
```

### 2.2 MongoDB — `mongodump`

Respaldo completo de la base `solicitudes_academic` en formato archive:

```bash
docker exec -t solicitudes_mongodb \
  mongodump --username solicitudes_user \
            --password [COMPLETAR-password] \
            --authenticationDatabase admin \
            --db solicitudes_academic \
            --archive > backups/mongo/solicitudes_academic_$(date +%F).archive
```

Respaldo en formato directorio (opción alternativa):

```bash
docker exec -t solicitudes_mongodb \
  mongodump --username solicitudes_user \
            --password [COMPLETAR-password] \
            --authenticationDatabase admin \
            --db solicitudes_academic \
            --out /tmp/dump

docker cp solicitudes_mongodb:/tmp/dump \
  backups/mongo/solicitudes_academic_$(date +%F)

docker exec -t solicitudes_mongodb rm -rf /tmp/dump
```

### 2.3 Respaldo comprimido combinado

Para reducir espacio, comprimir los respaldos inmediatamente:

```bash
gzip backups/postgres/solicitudes_db_$(date +%F).sql
gzip backups/mongo/solicitudes_academic_$(date +%F).archive
```

## 3. Frecuencia de respaldo `[PENDIENTE CON INTEGRANTE 3]`

- Frecuencia PostgreSQL: `[COMPLETAR: diario / cada X horas]`
- Frecuencia MongoDB: `[COMPLETAR: diario / cada X horas]`
- Tipo: `[COMPLETAR: automático (cron) / manual]`
- Horario: `[COMPLETAR]`
- Justificación de la frecuencia elegida: `[COMPLETAR]`

## 4. Ubicación de los backups `[PENDIENTE CON INTEGRANTE 3]`

- Ruta local del host: `[COMPLETAR: ej. /opt/backups/postgres y /opt/backups/mongo]`
- Replicación a almacenamiento externo: `[COMPLETAR: S3 / otro servidor / ninguno]`
- Bucket / servidor externo: `[COMPLETAR]`
- Política de retención: `[COMPLETAR: ej. 7 diarios + 4 semanales + 12 mensuales]`

Estructura de directorios sugerida:

```
backups/
├── postgres/
│   ├── solicitudes_db_2026-07-16.sql.gz
│   └── solicitudes_db_2026-07-16.dump
└── mongo/
    ├── solicitudes_academic_2026-07-16.archive.gz
    └── solicitudes_academic_2026-07-16/
```

## 5. Automatización `[PENDIENTE CON INTEGRANTE 3]`

Mientras no exista un cron/CI configurado, el respaldo es **manual**.

Plantilla de `crontab` para respaldo diario a las 02:00 (a confirmar con
Integrante 3):

```cron
# PostgreSQL diario
0 2 * * * docker exec -t solicitudes_postgres pg_dump -U solicitudes_user -d solicitudes_db -F c --no-owner --no-privileges > /opt/backups/postgres/solicitudes_db_$(date +\%F).dump 2>> /var/log/backup_pg.log

# MongoDB diario
30 2 * * * docker exec -t solicitudes_mongodb mongodump --username solicitudes_user --password [COMPLETAR-password] --authenticationDatabase admin --db solicitudes_academic --archive > /opt/backups/mongo/solicitudes_academic_$(date +\%F).archive 2>> /var/log/backup_mongo.log

# Limpieza: conservar 7 días
0 4 * * * find /opt/backups/postgres -name "*.dump" -mtime +7 -delete
15 4 * * * find /opt/backups/mongo -name "*.archive" -mtime +7 -delete
```

Estado actual: `[COMPLETAR: pendiente / implementado / en qué host corre el cron]`

## 6. Responsables `[PENDIENTE CON INTEGRANTE 3]`

| Rol                                | Nombre         | Contacto      |
| ---------------------------------- | -------------- | ------------- |
| Define la política de respaldo     | Integrante 3   | `[COMPLETAR]` |
| Ejecuta respaldos manuales         | `[COMPLETAR]`  | `[COMPLETAR]` |
| Mantiene la automatización         | `[COMPLETAR]`  | `[COMPLETAR]` |
| Verifica respaldos periódicamente  | `[COMPLETAR]`  | `[COMPLETAR]` |
| Aprueba restores de prueba         | `[COMPLETAR]`  | `[COMPLETAR]` |

## 7. Prueba periódica de restauración `[PENDIENTE CON INTEGRANTE 3]`

La única forma de asegurar que un respaldo sirve es restaurándolo. Se
recomienda una prueba de restauración al menos una vez al mes en un entorno
aislado (no producción).

Frecuencia acordada: `[COMPLETAR: mensual / trimestral]`

Procedimiento de prueba de restauración: ver
`docs/deployment/restauracion_del_sistema.md`.

Registro de pruebas:

| Fecha       | Responsable  | Ambiente  | Resultado | Observaciones |
| ----------- | ------------ | --------- | --------- | ------------- |
| `[COMPLETAR]` | `[COMPLETAR]` | `[COMPLETAR]` | `[COMPLETAR]` | `[COMPLETAR]` |

## 8. Verificación inmediata post-respaldo

Tras cada respaldo, validar que el archivo se generó correctamente:

```bash
# PostgreSQL
ls -lh backups/postgres/solicitudes_db_$(date +%F).dump
docker exec -t solicitudes_postgres \
  pg_restore --list backups/postgres/solicitudes_db_$(date +%F).dump | head -20

# MongoDB
ls -lh backups/mongo/solicitudes_academic_$(date +%F).archive
docker exec -t solicitudes_mongodb \
  mongorestore --username solicitudes_user --password [COMPLETAR-password] \
  --authenticationDatabase admin --archive=backups/mongo/solicitudes_academic_$(date +%F).archive \
  --dryRun --nsInclude='solicitudes_academic.documentusers'
```

## 9. Resumen de pendientes con el Integrante 3

- [ ] Confirmar frecuencia exacta de respaldo (PostgreSQL y MongoDB)
- [ ] Confirmar ruta del host y replicación externa (S3 u otro)
- [ ] Confirmar política de retención (cuántos respaldos se conservan)
- [ ] Confirmar si existirá cron automático o un job CI
- [ ] Confirmar responsables y contactos
- [ ] Definir frecuencia de la prueba periódica de restauración
- [ ] Confirmar contraseñas reales de producción (no las del `.env` de dev)
- [ ] Documentar cualquier script adicional de respaldo propio del Integrante 3
