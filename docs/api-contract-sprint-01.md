# Contrato API v0.1 - Sprint 01

Este documento define el contrato inicial para que frontend pueda crear mocks,
tipos y consumo de endpoints en paralelo con la implementacion del backend.

## Convenciones generales

- Base URL local: `http://localhost:3000`
- Prefijo API: `/api/v1`
- Formato: JSON
- Fechas: ISO 8601 en UTC, por ejemplo `2026-05-30T14:30:00.000Z`
- Autenticacion privada: `Authorization: Bearer <access_token>`
- Content-Type en peticiones con body: `application/json`

### Envoltorio de respuesta sugerido

```json
{
  "success": true,
  "message": "Operacion realizada exitosamente.",
  "data": {}
}
```

### Error sugerido

```json
{
  "success": false,
  "message": "Descripcion legible del error.",
  "error": "Bad Request",
  "statusCode": 400,
  "details": [
    {
      "field": "email",
      "message": "email must be an email"
    }
  ]
}
```

## Enumeraciones

### RequestPriority

```json
["Low", "Medium", "High", "Urgent"]
```

### RequestStatus inicial

```json
["Pendiente", "En Proceso", "Resuelto", "Cerrado"]
```

### Roles iniciales

```json
["recepcionista", "revisor", "supervisor", "alcalde"]
```

## Modelos base

### User

```json
{
  "id": "9d7b8e8b-83c3-4bb2-9c1f-2cc4dd7d7f01",
  "firstName": "Ana",
  "lastName": "Perez",
  "email": "ana.perez@alcaldia.gob",
  "isActive": true,
  "role": {
    "id": "6c4d3ad0-2b7d-40f2-8122-80ea8f2d6fd3",
    "name": "recepcionista"
  },
  "department": {
    "id": "ad7f1b8a-52d6-4f14-a94c-9d1ff34ef200",
    "name": "Planeacion"
  },
  "createdAt": "2026-05-30T14:30:00.000Z",
  "updatedAt": "2026-05-30T14:30:00.000Z"
}
```

### Request

```json
{
  "id": "c3d66f5a-4175-4ad7-8c45-9eb81d6aa1de",
  "subject": "Solicitud de reparacion de via",
  "description": "La calle principal presenta huecos desde hace varias semanas.",
  "applicantName": "Carlos Ramirez",
  "applicantContact": "carlos.ramirez@email.com",
  "categoryId": "15e9dc42-9b0d-42cb-a0e0-2041db54db6f",
  "departmentId": "ad7f1b8a-52d6-4f14-a94c-9d1ff34ef200",
  "statusId": "49e1a06c-dc9a-447c-baae-1202157ef480",
  "priority": "Medium",
  "receivedById": "9d7b8e8b-83c3-4bb2-9c1f-2cc4dd7d7f01",
  "userAssignedId": null,
  "trackingCode": "ALC-20260530-X7K9Q2",
  "isActive": true,
  "createdAt": "2026-05-30T14:30:00.000Z",
  "updatedAt": "2026-05-30T14:30:00.000Z"
}
```

### Category

```json
{
  "id": "15e9dc42-9b0d-42cb-a0e0-2041db54db6f",
  "name": "Infraestructura vial",
  "description": "Solicitudes relacionadas con vias, andenes y espacios publicos.",
  "departmentId": "ad7f1b8a-52d6-4f14-a94c-9d1ff34ef200",
  "isActive": true,
  "createdAt": "2026-05-30T14:30:00.000Z",
  "updatedAt": "2026-05-30T14:30:00.000Z"
}
```

### Department

```json
{
  "id": "ad7f1b8a-52d6-4f14-a94c-9d1ff34ef200",
  "name": "Planeacion",
  "description": "Dependencia encargada de planeacion municipal.",
  "isActive": true,
  "createdAt": "2026-05-30T14:30:00.000Z",
  "updatedAt": "2026-05-30T14:30:00.000Z"
}
```

## Endpoints

### POST `/api/v1/auth/login`

Inicia sesion y devuelve tokens.

Request:

```json
{
  "email": "ana.perez@alcaldia.gob",
  "password": "password123"
}
```

Response `200`:

```json
{
  "success": true,
  "message": "Login exitoso.",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 28800,
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

Errores esperados: `400`, `401`.

### POST `/api/v1/requests`

Crea una solicitud ciudadana.

Headers:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

Request:

```json
{
  "subject": "Solicitud de reparacion de via",
  "description": "La calle principal presenta huecos desde hace varias semanas.",
  "applicantName": "Carlos Ramirez",
  "applicantContact": "carlos.ramirez@email.com",
  "categoryId": "15e9dc42-9b0d-42cb-a0e0-2041db54db6f",
  "departmentId": "ad7f1b8a-52d6-4f14-a94c-9d1ff34ef200",
  "priority": "Medium"
}
```

Response `201`:

```json
{
  "success": true,
  "message": "Solicitud creada exitosamente.",
  "data": {
    "id": "c3d66f5a-4175-4ad7-8c45-9eb81d6aa1de",
    "subject": "Solicitud de reparacion de via",
    "description": "La calle principal presenta huecos desde hace varias semanas.",
    "applicantName": "Carlos Ramirez",
    "applicantContact": "carlos.ramirez@email.com",
    "categoryId": "15e9dc42-9b0d-42cb-a0e0-2041db54db6f",
    "departmentId": "ad7f1b8a-52d6-4f14-a94c-9d1ff34ef200",
    "status": {
      "id": "49e1a06c-dc9a-447c-baae-1202157ef480",
      "name": "Pendiente"
    },
    "priority": "Medium",
    "receivedById": "9d7b8e8b-83c3-4bb2-9c1f-2cc4dd7d7f01",
    "userAssignedId": null,
    "trackingCode": "ALC-20260530-X7K9Q2",
    "isActive": true,
    "createdAt": "2026-05-30T14:30:00.000Z",
    "updatedAt": "2026-05-30T14:30:00.000Z"
  }
}
```

Errores esperados: `400`, `401`, `404`.

### GET `/api/v1/requests`

Lista solicitudes con paginacion y filtros opcionales.

Query params:

| Parametro | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| `page` | number | No | Pagina actual. Default: `1`. |
| `limit` | number | No | Registros por pagina. Default: `10`, maximo `100`. |
| `statusId` | uuid | No | Filtra por estado. |
| `departmentId` | uuid | No | Filtra por dependencia. |
| `categoryId` | uuid | No | Filtra por categoria. |
| `priority` | string | No | `Low`, `Medium`, `High`, `Urgent`. |

Response `200`:

```json
{
  "success": true,
  "message": "Solicitudes obtenidas exitosamente.",
  "data": {
    "items": [
      {
        "id": "c3d66f5a-4175-4ad7-8c45-9eb81d6aa1de",
        "subject": "Solicitud de reparacion de via",
        "trackingCode": "ALC-20260530-X7K9Q2",
        "status": {
          "id": "49e1a06c-dc9a-447c-baae-1202157ef480",
          "name": "Pendiente"
        },
        "priority": "Medium",
        "department": {
          "id": "ad7f1b8a-52d6-4f14-a94c-9d1ff34ef200",
          "name": "Planeacion"
        },
        "category": {
          "id": "15e9dc42-9b0d-42cb-a0e0-2041db54db6f",
          "name": "Infraestructura vial"
        },
        "createdAt": "2026-05-30T14:30:00.000Z",
        "updatedAt": "2026-05-30T14:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalItems": 1,
      "totalPages": 1
    }
  }
}
```

Errores esperados: `401`.

### GET `/api/v1/requests/:id`

Obtiene el detalle de una solicitud.

Response `200`:

```json
{
  "success": true,
  "message": "Solicitud obtenida exitosamente.",
  "data": {
    "id": "c3d66f5a-4175-4ad7-8c45-9eb81d6aa1de",
    "subject": "Solicitud de reparacion de via",
    "description": "La calle principal presenta huecos desde hace varias semanas.",
    "applicantName": "Carlos Ramirez",
    "applicantContact": "carlos.ramirez@email.com",
    "trackingCode": "ALC-20260530-X7K9Q2",
    "priority": "Medium",
    "status": {
      "id": "49e1a06c-dc9a-447c-baae-1202157ef480",
      "name": "Pendiente"
    },
    "department": {
      "id": "ad7f1b8a-52d6-4f14-a94c-9d1ff34ef200",
      "name": "Planeacion"
    },
    "category": {
      "id": "15e9dc42-9b0d-42cb-a0e0-2041db54db6f",
      "name": "Infraestructura vial"
    },
    "receivedBy": {
      "id": "9d7b8e8b-83c3-4bb2-9c1f-2cc4dd7d7f01",
      "firstName": "Ana",
      "lastName": "Perez"
    },
    "assignedTo": null,
    "createdAt": "2026-05-30T14:30:00.000Z",
    "updatedAt": "2026-05-30T14:30:00.000Z"
  }
}
```

Errores esperados: `401`, `404`.

### PATCH `/api/v1/requests/:id/assign`

Asigna o reasigna una solicitud a un usuario interno.

Request:

```json
{
  "userAssignedId": "52aa67da-5982-4224-bbee-b0fd75987455",
  "observation": "Se asigna a revisor de Planeacion."
}
```

Response `200`:

```json
{
  "success": true,
  "message": "Solicitud asignada exitosamente.",
  "data": {
    "id": "c3d66f5a-4175-4ad7-8c45-9eb81d6aa1de",
    "userAssignedId": "52aa67da-5982-4224-bbee-b0fd75987455",
    "assignedTo": {
      "id": "52aa67da-5982-4224-bbee-b0fd75987455",
      "firstName": "Luis",
      "lastName": "Gomez",
      "email": "luis.gomez@alcaldia.gob"
    },
    "updatedAt": "2026-05-30T15:05:00.000Z"
  }
}
```

Errores esperados: `400`, `401`, `404`.

### GET `/api/v1/requests/:id/history`

Lista el historial de cambios, asignaciones y observaciones internas.

Response `200`:

```json
{
  "success": true,
  "message": "Historial obtenido exitosamente.",
  "data": [
    {
      "id": "2c0e67e4-a7d0-4b5c-a297-b27fb668e285",
      "requestId": "c3d66f5a-4175-4ad7-8c45-9eb81d6aa1de",
      "userId": "9d7b8e8b-83c3-4bb2-9c1f-2cc4dd7d7f01",
      "previousStatusId": null,
      "newStatusId": null,
      "previousAssignedUserId": null,
      "newAssignedUserId": "52aa67da-5982-4224-bbee-b0fd75987455",
      "observation": "Se asigna a revisor de Planeacion.",
      "createdAt": "2026-05-30T15:05:00.000Z"
    }
  ]
}
```

Errores esperados: `401`, `404`.

### GET `/api/v1/tracking/:trackingCode`

Consulta publica del estado de una solicitud por codigo de seguimiento. No
requiere token.

Response `200`:

```json
{
  "success": true,
  "message": "Informacion de seguimiento obtenida exitosamente.",
  "data": {
    "requestId": "c3d66f5a-4175-4ad7-8c45-9eb81d6aa1de",
    "trackingCode": "ALC-20260530-X7K9Q2",
    "status": "Pendiente",
    "submittedAt": "2026-05-30T14:30:00.000Z",
    "lastUpdatedAt": "2026-05-30T15:05:00.000Z",
    "subject": "Solicitud de reparacion de via"
  }
}
```

Errores esperados: `400`, `404`.

### GET `/api/v1/categories`

Lista categorias activas.

Response `200`:

```json
{
  "success": true,
  "message": "Categorias obtenidas exitosamente.",
  "data": [
    {
      "id": "15e9dc42-9b0d-42cb-a0e0-2041db54db6f",
      "name": "Infraestructura vial",
      "description": "Solicitudes relacionadas con vias, andenes y espacios publicos.",
      "departmentId": "ad7f1b8a-52d6-4f14-a94c-9d1ff34ef200",
      "isActive": true
    }
  ]
}
```

Errores esperados: `401`.

### GET `/api/v1/departments`

Lista dependencias activas.

Response `200`:

```json
{
  "success": true,
  "message": "Dependencias obtenidas exitosamente.",
  "data": [
    {
      "id": "ad7f1b8a-52d6-4f14-a94c-9d1ff34ef200",
      "name": "Planeacion",
      "description": "Dependencia encargada de planeacion municipal.",
      "isActive": true
    }
  ]
}
```

Errores esperados: `401`.

## Notas de implementacion para backend

- El contrato publico de la issue usa `/api/v1/requests`; el codigo actual
  expone creacion como `POST /api/v1/requests/register`. Debe alinearse antes
  de cerrar la issue.
- El DTO actual de creacion de solicitudes debe incluir los campos del modelo
  `Request`: `subject`, `description`, `applicantName`, `applicantContact` y
  `receivedById` tomado desde el usuario autenticado.
- `trackingCode`, `statusId` inicial y `receivedById` deben ser definidos por
  backend, no enviados por frontend.
- `GET /api/v1/tracking/:trackingCode` es publico; los demas endpoints de este
  contrato requieren JWT salvo que se acuerde lo contrario.
