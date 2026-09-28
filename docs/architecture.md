# Arquitectura oficial del backend

## Objetivo

Definir la responsabilidad de cada base de datos y evitar duplicacion o
inconsistencias en la informacion oficial del sistema de solicitudes de la
alcaldia.

Este documento es la referencia arquitectonica para las implementaciones del
backend durante el sprint V2-01.

## Decision arquitectonica

PostgreSQL es la unica fuente de verdad para el flujo administrativo y el
seguimiento ciudadano.

MongoDB tendra un uso limitado y posterior para el checklist documental del
alcalde. La informacion almacenada en MongoDB no reemplazara ni duplicara el
estado oficial de una solicitud.

## Responsabilidad por almacenamiento

| Informacion | Base de datos | Estado |
| --- | --- | --- |
| Solicitudes (`requests`) | PostgreSQL | Oficial |
| Estados (`request_statuses`) | PostgreSQL | Oficial |
| Historial (`request_history`) | PostgreSQL | Oficial |
| Usuarios (`users`) | PostgreSQL | Oficial |
| Roles (`roles`) | PostgreSQL | Oficial |
| Departamentos (`departments`) | PostgreSQL | Oficial |
| Categorias (`categories`) | PostgreSQL | Oficial |
| Firmas (`request_signatures`) | PostgreSQL | Fase posterior |
| Checklist documental del alcalde (`mayor_checklists`) | MongoDB | Fase posterior |

## Reglas obligatorias

- Toda solicitud debe crearse y consultarse desde PostgreSQL.
- El estado vigente de una solicitud pertenece a PostgreSQL.
- Las asignaciones y el historial administrativo pertenecen a PostgreSQL.
- El tracking publico debe consultar PostgreSQL.
- MongoDB no puede utilizarse como copia de solicitudes oficiales.
- Los datos futuros almacenados en MongoDB solo pueden referenciar una
  solicitud por su identificador oficial de PostgreSQL.

## Prohibiciones

- Crear colecciones MongoDB de `requests`.
- Consultar estados oficiales desde MongoDB.
- Guardar eventos oficiales del historial en MongoDB.
- Consultar tracking publico desde MongoDB.
- Implementar persistencia que contradiga esta decision sin actualizar primero
  este documento y aprobar la decision con el equipo.

## Uso previsto de MongoDB

MongoDB queda fuera del flujo oficial del sprint actual. Su uso aprobado para
una fase posterior sera `mayor_checklists`, un checklist documental asociado a
una solicitud oficial mediante su identificador de PostgreSQL.

La metadata documental actualmente modelada en MongoDB debe revisarse antes de
considerarse parte de la arquitectura aprobada.

## Alineacion pendiente del codigo actual

La decision de este documento rige las nuevas implementaciones y correcciones.
El codigo existente contiene comportamientos previos que no representan la
arquitectura objetivo y deben corregirse en issues independientes:

- `TrackingService` consulta solicitudes desde MongoDB para el tracking
  publico; debe consultar la entidad `Request` en PostgreSQL.
- La consulta de detalle de documentos intenta obtener la solicitud asociada
  desde una coleccion MongoDB `requests`; debe obtener los datos oficiales
  desde PostgreSQL.
- El modulo actual de documentos utiliza MongoDB y debe revisarse frente al
  alcance aprobado para el sprint.

## Criterio para nuevos pull requests

Todo pull request que agregue persistencia o consultas de solicitudes,
estados, historial, asignaciones o tracking debe:

- Identificar la base de datos utilizada.
- Usar PostgreSQL para toda informacion oficial.
- Evitar nuevas colecciones MongoDB fuera del uso futuro aprobado.
- Indicar cualquier cambio requerido en esta decision arquitectonica antes de
  implementar una excepcion.
