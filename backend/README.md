# Backend - Sistema de Solicitudes Alcaldia

Backend base para la API REST del sistema de gestion de solicitudes ciudadanas.

## Stack

- NestJS + TypeScript
- PostgreSQL como base principal
- MongoDB como base secundaria academica
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

## Estado actual

Esta version corresponde al issue BE-01. Solo incluye configuracion base, estructura modular, conexiones a bases de datos, Swagger y endpoint de salud. No incluye logica de negocio.
