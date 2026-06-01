# Alcance tecnico del sprint backend

## Objetivo

Cerrar el alcance tecnico del sprint backend para que el equipo implemente
solamente los endpoints, dependencias y funcionalidades acordadas.

Este documento bloquea cualquier trabajo adicional que no este listado aqui.
Las nuevas ideas o integraciones deben registrarse como backlog antes de
implementarse.

## Endpoints incluidos

| Metodo | Endpoint | Proposito | Dependencias | Responsable |
| --- | --- | --- | --- | --- |
| POST | `/api/v1/auth/login` | Iniciar sesion y devolver JWT | `users`, `roles` | Luis-Alain (Backend auth) |
| GET | `/api/v1/auth/me` | Obtener usuario autenticado | JWT, `users`, `roles` | Luis-Alain (Backend auth) |
| POST | `/api/v1/requests` | Registrar solicitud recibida | `requests`, `categories`, `departments`, `request_statuses`, `users` | Luis-Alain (Backend solicitudes) |
| GET | `/api/v1/requests` | Listar solicitudes internas | JWT, `requests`, `request_statuses`, `users` | Luis-Alain (Backend solicitudes) |
| GET | `/api/v1/requests/:id` | Consultar detalle interno de una solicitud | JWT, `requests`, `request_history` | Luis-Alain (Backend solicitudes) |
| PATCH | `/api/v1/requests/:id/assign` | Asignar solicitud a un usuario interno | JWT, `requests`, `users`, `request_history` | Luis-Alain (Backend solicitudes) |
| GET | `/api/v1/requests/:id/history` | Consultar historial interno de una solicitud | JWT, `request_history`, `request_statuses`, `users` | Luis-Alain (Backend tracking e historial) |
| GET | `/api/v1/tracking/:trackingCode` | Consultar tracking publico por codigo | `requests`, `request_statuses` | Luis-Alain (Backend tracking e historial) |
| GET | `/api/v1/categories` | Listar categorias disponibles | `categories`, `departments` | Luis-Alain (Backend catalogos) |
| GET | `/api/v1/departments` | Listar departamentos disponibles | `departments` | Luis-Alain (Backend catalogos) |

## Funcionalidades excluidas del sprint

- Firma digital del alcalde.
- Checklist documental del alcalde.
- Persistencia oficial en MongoDB para solicitudes, estados, historial o
  tracking publico.
- Chatbot real de WhatsApp.
- Notificaciones automaticas por correo, SMS o WhatsApp.
- Panel frontend completo.
- CRUD avanzado de usuarios fuera de crear y listar usuarios internos.
- Integraciones externas con servicios gubernamentales o proveedores de firma.
- Reportes administrativos avanzados.
- Auditoria avanzada fuera del historial minimo de solicitudes.

## Responsables por area

| Area | Alcance | Responsable |
| --- | --- | --- |
| Modelo y migraciones | Tablas PostgreSQL, claves foraneas, seeds iniciales y consistencia con entidades TypeORM | Luis-Alain |
| Servicio principal de solicitudes | Creacion, listado, detalle y asignacion de solicitudes | Luis-Alain |
| Tracking e historial | Tracking publico por codigo e historial interno de cambios | Luis-Alain |
| Autenticacion y seguridad | Login, JWT, usuario autenticado y proteccion de rutas privadas | Luis-Alain |
| Documentacion y Swagger | Contrato API, documentacion tecnica y endpoints documentados en Swagger | Lider backend |

Los responsables anteriores son propietarios tecnicos del area. Si el equipo
redistribuye tareas, este documento debe actualizarse antes de aprobar nuevas
implementaciones.

## Dependencias tecnicas

- Las solicitudes dependen de `roles`, `users`, `departments`, `categories` y
  `request_statuses`.
- La creacion de solicitudes debe generar y persistir `tracking_code`.
- El tracking publico debe consultar PostgreSQL y no MongoDB.
- La asignacion de solicitudes depende del usuario autenticado y de usuarios
  internos existentes.
- El historial depende de la solicitud, el usuario que realiza la accion, los
  estados y los cambios de asignacion.
- Los endpoints internos deben estar protegidos por JWT.
- Los endpoints publicos solo deben exponer informacion minima y no datos
  privados del solicitante.

## Regla de bloqueo de alcance

Todo endpoint, coleccion, tabla, integracion o flujo que no este listado en
este documento queda fuera del sprint actual.

Si una funcionalidad nueva es necesaria, debe crearse una issue de backlog y
validarse con el lider backend antes de implementarse.

## Backlog fuera de alcance

Las siguientes tareas pueden planificarse despues del sprint:

- Firma del alcalde.
- Checklist documental del alcalde en MongoDB.
- Chatbot de WhatsApp.
- Notificaciones automaticas.
- Panel frontend completo.
- Reportes y metricas administrativas.
- Auditoria avanzada.

## Criterios de aceptacion cubiertos

- Cada endpoint prometido queda listado con un responsable tecnico.
- Las funcionalidades fuera de alcance quedan registradas como backlog.
- Las dependencias principales por endpoint quedan identificadas.
- La regla de bloqueo evita agregar trabajo no acordado al sprint.
