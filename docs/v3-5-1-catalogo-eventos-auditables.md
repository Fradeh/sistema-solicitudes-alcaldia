# Catalogo oficial de eventos auditables

## Contexto

Este documento define la nomenclatura oficial de los eventos auditables que
usara el sistema para registrar acciones operativas y administrativas.

Su objetivo es eliminar ambiguedades entre historial de solicitudes, auditoria
administrativa, permisos y transiciones de estado.

## Objetivo

- Definir un codigo tecnico unico por evento.
- Separar eventos operativos y administrativos.
- Evitar nombres duplicados o ambiguos.
- Establecer una referencia comun para futuras implementaciones de auditoria.

## Convenciones

- El codigo tecnico usa `UPPER_SNAKE_CASE`.
- Cada evento describe una unica accion verificable.
- El nombre funcional debe ser claro y estable.
- La categoria agrupa eventos por dominio funcional.
- Los eventos no deben mezclar varias acciones en un solo codigo.

## Criterios de catalogacion

- `solicitudes`: eventos del ciclo de vida de una solicitud.
- `administracion`: eventos sobre usuarios, roles, permisos y departamentos.
- `seguridad`: eventos de control de acceso o cambios de habilitacion.

## Catalogo de eventos de solicitudes

| Codigo tecnico | Nombre descriptivo | Categoria | Descripcion funcional |
| --- | --- | --- | --- |
| `REQUEST_CREATED` | Solicitud creada | solicitudes | Se registra una nueva solicitud ciudadana en el sistema. |
| `REQUEST_DEPARTMENT_ASSIGNED` | Departamento asignado | solicitudes | Se asigna un departamento responsable a la solicitud. |
| `REQUEST_DEPARTMENT_REASSIGNED` | Departamento reasignado | solicitudes | Se cambia el departamento responsable de una solicitud ya asignada. |
| `REQUEST_REVIEW_STARTED` | Revision iniciada | solicitudes | El departamento responsable marca que comenzo el analisis de la solicitud. |
| `REQUEST_DEPARTMENT_APPROVED` | Solicitud aprobada por departamento | solicitudes | El departamento aprueba la solicitud en su nivel de decision. |
| `REQUEST_DEPARTMENT_REJECTED` | Solicitud rechazada por departamento | solicitudes | El departamento rechaza la solicitud en su nivel de decision. |
| `REQUEST_SENT_TO_MAYOR_OFFICE` | Solicitud enviada a Alcaldia | solicitudes | La solicitud se escala al despacho del alcalde para revision superior. |
| `REQUEST_RETURNED_TO_DEPARTMENT` | Solicitud devuelta al departamento | solicitudes | La solicitud regresa al departamento para ajustes o nueva revision. |
| `REQUEST_MAYOR_OFFICE_REJECTED` | Solicitud rechazada por Alcaldia | solicitudes | El despacho del alcalde rechaza la solicitud escalada. |
| `REQUEST_CLOSED` | Solicitud cerrada | solicitudes | La solicitud se cierra formalmente como caso finalizado. |
| `REQUEST_INTERNAL_OBSERVATION_ADDED` | Observacion interna agregada | solicitudes | Se agrega una observacion interna asociada a la solicitud. |
| `REQUEST_PRIORITY_CHANGED` | Prioridad cambiada | solicitudes | Se actualiza la prioridad operativa de la solicitud. |
| `REQUEST_DEADLINE_UPDATED` | Fecha limite actualizada | solicitudes | Se modifica la fecha limite de atencion de la solicitud. |
| `REQUEST_DOCUMENT_UPLOADED` | Documento cargado | solicitudes | Se adjunta un documento a la solicitud. |

## Catalogo de eventos administrativos

| Codigo tecnico | Nombre descriptivo | Categoria | Descripcion funcional |
| --- | --- | --- | --- |
| `USER_CREATED` | Usuario creado | administracion | Se crea un nuevo usuario en el sistema. |
| `USER_UPDATED` | Usuario actualizado | administracion | Se modifican los datos de un usuario existente. |
| `USER_ACTIVATED` | Usuario activado | seguridad | Se habilita nuevamente el acceso de un usuario. |
| `USER_DEACTIVATED` | Usuario desactivado | seguridad | Se suspende el acceso de un usuario al sistema. |
| `USER_ROLE_ASSIGNED` | Rol asignado a usuario | administracion | Se asigna un rol a un usuario. |
| `USER_ROLE_CHANGED` | Rol de usuario cambiado | administracion | Se reemplaza el rol principal o efectivo de un usuario. |
| `PERMISSION_UPDATED` | Permisos actualizados | administracion | Se modifica la matriz de permisos asociada a un rol o usuario. |
| `DEPARTMENT_CREATED` | Departamento creado | administracion | Se registra un nuevo departamento en el sistema. |
| `DEPARTMENT_UPDATED` | Departamento actualizado | administracion | Se modifican los datos de un departamento. |
| `DEPARTMENT_DEACTIVATED` | Departamento desactivado | seguridad | Se inhabilita un departamento para operaciones futuras. |
| `DEPARTMENT_REACTIVATED` | Departamento reactivado | seguridad | Se vuelve a habilitar un departamento desactivado. |

## Eventos que requieren validacion funcional adicional

| Codigo propuesto | Estado | Motivo |
| --- | --- | --- |
| `REQUEST_SENT_TO_MAYOR_OFFICE` | Pendiente de validacion fina | El flujo menciona envio a Alcaldia, pero puede requerir separar envio, aprobacion y firma. |
| `REQUEST_MAYOR_OFFICE_REJECTED` | Pendiente de validacion fina | Conviene confirmar si el rechazo de Alcaldia se modela como rechazo o devolucion. |
| `REQUEST_PRIORITY_CHANGED` | Pendiente de validacion | La prioridad aparece en el nuevo flujo, pero se debe confirmar si siempre genera evento auditable. |
| `REQUEST_DEADLINE_UPDATED` | Pendiente de validacion | La fecha limite es parte del alcance, pero falta confirmar las reglas exactas de auditoria. |
| `REQUEST_INTERNAL_OBSERVATION_ADDED` | Pendiente de validacion | Debe confirmarse si las observaciones internas son parte del catalogo oficial o de un subcatalogo propio. |
| `REQUEST_REVIEW_STARTED` | Pendiente de validacion | El termino exacto puede variar segun el actor: ver, recibir, tomar o iniciar revision. |
| `REQUEST_DEPARTMENT_REASSIGNED` | Pendiente de validacion | Puede necesitar distinguir reasignacion operativa de reasignacion administrativa. |
| `REQUEST_DEPARTMENT_ASSIGNED` | Pendiente de validacion | El flujo debe confirmar si la asignacion inicial y la reasignacion usan el mismo modelo. |
| `USER_ROLE_CHANGED` | Pendiente de validacion | Puede unificarse con asignacion de rol si el sistema maneja un unico rol efectivo. |
| `DEPARTMENT_REACTIVATED` | Pendiente de validacion | Solo aplica si el modelo de departamentos contempla desactivacion temporal. |

## Reglas de validacion

- No debe existir un evento con dos acciones distintas.
- No debe existir el mismo concepto con dos codigos diferentes.
- Los codigos deben ser compatibles con historial, auditoria y permisos.
- El catalogo debe poder usarse como fuente unica para capas futuras.
- Los eventos ambiguos deben quedar marcados como pendientes antes de su adopcion tecnica.

## Resultado esperado

Disponer de un catalogo oficial de eventos auditables que permita mantener
consistencia entre historial, auditoria administrativa y futuras
implementaciones de trazabilidad.
