# Sistema de Solicitudes de Alcaldia

Proyecto base para gestionar solicitudes ciudadanas de una alcaldia.

La aplicacion esta pensada como un sistema fullstack con frontend web,
backend API y persistencia oficial en PostgreSQL. MongoDB queda reservado
para un checklist documental del alcalde en una fase posterior.

## Stack tecnologico

- Frontend: React + TypeScript
- Backend: NestJS + TypeScript
- Base de datos oficial: PostgreSQL
- Base de datos secundaria futura: MongoDB, reservada para checklist documental
- Contenedores: Docker y Docker Compose
- Documentacion API: Swagger

## Estructura

- `frontend/`: aplicacion web React.
- `backend/`: API backend NestJS.
- `backend/src/`: modulos principales del backend.
- `docs/`: documentacion del proyecto.
- `infra/`: configuracion de infraestructura futura, como Nginx o despliegue.
- `docker-compose.yml`: servicios de backend, PostgreSQL y MongoDB.

## Arquitectura de datos

- PostgreSQL es la fuente de verdad para solicitudes, estados, historial,
  tracking publico, usuarios, roles, departamentos y categorias.
- MongoDB se reserva para el checklist documental del alcalde en una fase
  posterior.
- No se deben almacenar ni consultar solicitudes oficiales, estados, historial
  o tracking publico desde MongoDB.

Consulta la decision completa en
[`docs/architecture.md`](docs/architecture.md).

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
http://localhost:3000/api/v1
```

4. Verificar servicios principales:

```text
Health:  http://localhost:3000/api/v1/health
Swagger: http://localhost:3000/api/docs
```

## Notas

- El frontend todavia no esta incluido en Docker Compose.
- El `docker-compose.yml` oficial esta en la raiz del proyecto.
- El backend tambien puede correrse localmente desde `backend/` con `npm run start:dev`.
- La arquitectura oficial de persistencia esta documentada en
  `docs/architecture.md` y debe respetarse en nuevas implementaciones.
