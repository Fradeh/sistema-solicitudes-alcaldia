# Backend - Sistema de Solicitudes Alcaldia

Backend base para la API REST del sistema de gestion de solicitudes ciudadanas.

## Stack

- NestJS + TypeScript
- PostgreSQL como fuente de verdad del sistema
- MongoDB reservado para checklist documental en una fase posterior
- Docker y Docker Compose
- Swagger
- API REST versionada con prefijo `/api/v1`

## Estructura inicial

```txt
src/
|-- main.ts
|-- app.module.ts
|-- app.controller.ts
|-- config/
|-- common/
|-- database/
|-- auth/
|-- users/
|-- roles/
|-- departments/
|-- categories/
|-- request-statuses/
|-- requests/
|-- request-history/
|-- documents/
|-- tracking/
`-- academic-mongo/
```

## Variables de entorno

Usa `.env.example` como referencia para crear un archivo `.env` cuando sea necesario.

## Correr con Docker

Desde la raiz del proyecto:

```bash
docker compose up --build
```

Servicios disponibles:

- API: `http://localhost:3000/api/v1`
- Health: `http://localhost:3000/api/v1/health`
- Swagger: `http://localhost:3000/api/docs`
- PostgreSQL: `localhost:5432`
- MongoDB: `localhost:27017`

## Correr localmente

Desde la carpeta `backend/`:

```bash
npm install
npm run start:dev
```

Para correr localmente necesitas tener PostgreSQL y MongoDB disponibles con las variables definidas en `.env.example`.

## Reglas de persistencia

### PostgreSQL: fuente de verdad

Los siguientes datos deben almacenarse y consultarse exclusivamente desde
PostgreSQL:

- `requests`
- `request_statuses`
- `request_history`
- `users`
- `roles`
- `departments`
- `categories`
- `request_signatures` en una fase posterior

El tracking publico debe construirse a partir de la informacion oficial
almacenada en PostgreSQL.

### MongoDB: uso futuro limitado

MongoDB queda reservado para:

- `mayor_checklists`, correspondiente al checklist documental del alcalde,
  en una fase posterior.

### No permitido

- Crear colecciones MongoDB para solicitudes oficiales.
- Consultar estados oficiales desde MongoDB.
- Guardar historial oficial en MongoDB.
- Resolver tracking publico desde MongoDB.

## Alineacion pendiente

La documentacion representa la decision oficial para nuevas implementaciones.
Existen modulos previos que deben ajustarse en issues separadas, incluyendo la
consulta actual de tracking y detalle de solicitudes desde MongoDB.

Consulta el detalle en [`../docs/architecture.md`](../docs/architecture.md).

## Estado actual

El backend se encuentra en construccion y contiene modulos iniciales para
autenticacion, solicitudes, tracking y catalogos. Las funcionalidades nuevas
deben respetar las reglas de persistencia anteriores.
