# Sistema de Solicitudes de Alcaldia

Proyecto base para gestionar solicitudes ciudadanas de una alcaldia.

La aplicacion esta pensada como un sistema fullstack con frontend web, backend API, base de datos relacional y base de datos secundaria para informacion complementaria o documentos.

## Stack tecnologico

- Frontend: React + TypeScript
- Backend: NestJS + TypeScript
- Base de datos principal: PostgreSQL
- Base de datos secundaria: MongoDB
- Contenedores: Docker y Docker Compose

## Estructura

- `frontend/`: aplicacion web React.
- `backend/`: API backend NestJS.
- `backend/src/modules/`: modulos principales del backend.
- `docs/`: documentacion del proyecto.
- `infra/`: configuracion de infraestructura.
- `docker-compose.yml`: servicios de backend, PostgreSQL y MongoDB.

## Como correr el proyecto

1. Entrar a la carpeta del proyecto:

```bash
cd Solicitudes-Alcaldia
```

2. Levantar los servicios con Docker Compose:

```bash
docker compose up
```

3. Acceder al backend:

```text
http://localhost:3000/api
```

## Notas

- El frontend todavia no esta incluido en Docker Compose.
- El backend usa variables basicas definidas en `docker-compose.yml`.
- Este proyecto contiene una estructura inicial y no incluye logica de negocio todavia.
