# Respaldo de Archivos Escaneados

> Define cómo respaldar los archivos físicos de documentos escaneados
> asociados a solicitudes. Los **metadatos** de cada documento viven en
> MongoDB (schema `DocumentUser`), pero los **archivos binarios** requieren
> una estrategia de respaldo distinta que se documenta aquí.

## 1. Ubicación real de los archivos escaneados

- Almacenamiento físico: `[COMPLETAR: volumen Docker / ruta en disco / bucket S3]`
- Volumen / ruta: `[COMPLETAR]`
- Mapeado en el `docker-compose.yml`: **No** (el compose actual no define un
  volumen para uploads de archivos).
- Accesible desde el backend: `[COMPLETAR: sí/no y cómo]`

> El schema `DocumentUser` (`backend/src/documents/schema/document-user.schema.ts`)
> guarda `fileName`, `fileType`, `size`, `url`, `requestId`, `userId`.
> La estrategia de respaldo debe cubrir los binarios referenciados por el
> campo `url` de cada documento.

## 2. Frecuencia de respaldo

- Frecuencia: `[COMPLETAR: diario / semanal]`
- Tipo: `[COMPLETAR: automático (cron) / manual]`
- Horario sugerido (si es automático): `[COMPLETAR: ej. 02:00 UTC]`
- Responsable: `[COMPLETAR]`

## 3. Comandos o pasos exactos de respaldo

A continuación se presentan dos alternativas según la ubicicación final que
se defina. Elegir y dejar marcada la opción en uso.

### Opción A — Respaldo de volumen Docker (referencia)

Si los archivos se guardan en un volumen Docker (por ejemplo `uploads_data`),
el respaldo se realiza con un contenedor efímero que monta el volumen:

```bash
docker run --rm \
  -v [COMPLETAR-nombre-del-volumen]:/data \
  -v $(pwd)/backups/archivos:/backup \
  alpine tar czf /backup/archivos_$(date +%F).tar.gz -C /data .
```

Verificación del archivo generado:

```bash
ls -lh backups/archivos/archivos_$(date +%F).tar.gz
```

### Opción B — Sincronización a bucket S3

Si los archivos se almacenan en disco local y se sincronizan a S3:

```bash
aws s3 sync [COMPLETAR-ruta-local]/uploads \
  s3://[COMPLETAR-nombre-bucket]/archivos-escaneados/ \
  --region [COMPLETAR-region]
```

Verificación del último respaldo:

```bash
aws s3 ls s3://[COMPLETAR-nombre-bucket]/archivos-escaneados/ \
  --recursive --human-readable --summarize | tail -5
```

### Opción C — Los archivos viven directamente en S3

Si los archivos ya se guardan directamente en S3 (sin copia local), el
respaldo consiste en una replicación entre buckets o versionado:

```bash
aws s3 cp --recursive \
  s3://[COMPLETAR-bucket-origen]/archivos-escaneados/ \
  s3://[COMPLETAR-bucket-respaldo]/archivos-escaneados/$(date +%F)/
```

Habilitar versionado en el bucket como mecanismo de respaldo adicional:

```bash
aws s3api put-bucket-versioning \
  --bucket [COMPLETAR-nombre-bucket] \
  --versioning-configuration Status=Enabled
```

## 4. Respaldo conjunto de metadatos en MongoDB

Los metadatos de los archivos (schema `DocumentUser`) se respaldan junto con
toda la base MongoDB. Ver procedimiento completo en
`docs/deployment/respaldo_base_datos.md`.

Comando de respaldo específico de la colección `documentusers`:

```bash
docker exec -t solicitudes_mongodb \
  mongodump --username solicitudes_user \
            --password [COMPLETAR-password] \
            --authenticationDatabase admin \
            --db solicitudes_academic \
            --collection documentusers \
            --archive > backups/mongo/documentusers_$(date +%F).archive
```

## 5. Verificación del respaldo

### 5.1 Verificación por tamaño

```bash
# Volumen
ls -lh backups/archivos/archivos_$(date +%F).tar.gz

# S3
aws s3 ls s3://[COMPLETAR-bucket]/archivos-escaneados/ \
  --recursive --human-readable --summarize
```

Comparar el tamaño total con el volumen de datos en producción. Un respaldo
de tamaño muy inferior al esperado indica archivos faltantes.

### 5.2 Prueba de restauración parcial

Restaurar un archivo aleatorio del respaldo y comprobar su integridad:

```bash
# Volumen: extraer un archivo del tar.gz
mkdir -p /tmp/restore_test
tar -xzf backups/archivos/archivos_$(date +%F).tar.gz \
    -C /tmp/restore_test [COMPLETAR-ruta-relativa-de-un-archivo]
file /tmp/restore_test/[COMPLETAR-archivo]
```

```bash
# S3: descargar un archivo
aws s3 cp \
  s3://[COMPLETAR-bucket]/archivos-escaneados/[COMPLETAR-archivo] \
  /tmp/restore_test/
file /tmp/restore_test/[COMPLETAR-archivo]
```

Registrar resultado de la prueba de restauración:

- Fecha de la prueba: `[COMPLETAR]`
- Archivo restaurado: `[COMPLETAR]`
- Resultado (OK / fallido): `[COMPLETAR]`

## 6. Retención de respaldos

- Cantidad de respaldos a conservar: `[COMPLETAR: ej. 7 diarios + 4 semanales]`
- Política de expiración (si se usa S3, lifecycle rule): `[COMPLETAR]`
- Comando de limpieza local (ejemplo para 7 días):

```bash
find backups/archivos -name "archivos_*.tar.gz" -mtime +7 -delete
```

- Comando de limpieza en S3 (lifecycle):

```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket [COMPLETAR-bucket] \
  --lifecycle-configuration file://[COMPLETAR-ruta-lifecycle.json]
```

## 7. Automatización (pendiente)

Mientras no exista un cron/CI configurado, el respaldo es **manual**.

Plantilla de entrada crontab (a configurar en el host o en un contenedor
sidecar):

```cron
0 2 * * * docker run --rm -v uploads_data:/data -v /opt/backups/archivos:/backup alpine tar czf /backup/archivos_$(date +\%F).tar.gz -C /data . 2>> /var/log/backup_archivos.log
```

Estado actual de la automatización: `[COMPLETAR: pendiente / implementado]`

## 8. Responsables

| Rol                  | Nombre           | Contacto        |
| -------------------- | ---------------- | --------------- |
| Ejecuta el respaldo  | `[COMPLETAR]`    | `[COMPLETAR]`   |
| Verifica el respaldo | `[COMPLETAR]`    | `[COMPLETAR]`   |
| Restaura en disaster | `[COMPLETAR]`    | `[COMPLETAR]`   |
