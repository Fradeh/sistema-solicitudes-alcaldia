# Almacenamiento de documentos

Actualmente el backend guarda los archivos subidos en esta carpeta local:

```txt
backend/uploads/requests/{id_solicitud}/
```

La base de datos PostgreSQL no guarda el archivo completo. Solo guarda la metadata del documento en la tabla `request_documents`, incluyendo:

- `file_name`
- `file_type`
- `size`
- `url`
- `request_id`
- `user_id`

## Que se debe cambiar en produccion

Si se decide usar su propio servidor, NAS, nube privada, gestor documental o repositorio interno de archivos, debe reemplazar la ruta local por la URL real donde queden guardados los documentos.

El punto principal esta en:

```txt
backend/src/requests/requests.controller.ts
```

En el endpoint:

```txt
POST /requests/:requestId/documents/upload
```

Hoy se genera una URL local asi:

```ts
const url = `/uploads/requests/${requestId}/${file.filename}`;
```

Cuando tengan su servicio propio, esa URL debe cambiar por la ruta final del documento, por ejemplo:

```ts
const url = `https://archivos.alcaldia.gov.co/solicitudes/${requestId}/${file.filename}`;
```

Tambien deben cambiar la parte que guarda el archivo fisico con `diskStorage`, para que en vez de guardar en `backend/uploads`, envie el archivo al servicio interno que ellos definan.

