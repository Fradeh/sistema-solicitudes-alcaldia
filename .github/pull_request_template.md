## Issue relacionada

Closes #

## Objetivo del PR

Describe brevemente que resuelve este cambio.

## Archivos o modulos modificados

-

## Como fue probado

- [ ] Ejecute `npm run build` desde `backend/`.
- [ ] Probe manualmente los endpoints afectados, si aplica.
- [ ] Agregue o actualice pruebas, si aplica.
- [ ] Adjunte evidencia o responses de prueba, si aplica.

## Arquitectura y persistencia

- [ ] Solicitudes, estados, historial y tracking usan PostgreSQL.
- [ ] Este PR no crea ni consulta solicitudes oficiales desde MongoDB.
- [ ] MongoDB se mantiene limitado al checklist futuro del Alcalde.
- [ ] Si cambie la API, actualice el contrato y el changelog.

## Seguridad

- [ ] Las rutas internas requieren autenticacion, si aplica.
- [ ] El actor de operaciones internas se obtiene desde JWT, no desde el body.
- [ ] El tracking publico no expone informacion privada.

## Migraciones y documentacion

- [ ] Inclui migracion si modifique entidades o esquema SQL.
- [ ] Actualice Swagger si modifique endpoints.
- [ ] Actualice documentacion si cambie comportamiento visible.

## Evidencia adicional

Incluye aqui capturas, responses JSON o notas de validacion.
