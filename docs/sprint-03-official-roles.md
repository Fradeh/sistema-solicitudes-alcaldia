# Roles y responsabilidades oficiales del Sprint 3

## Proposito

Este documento define los actores oficiales del sistema de solicitudes de la
alcaldia, sus responsabilidades, restricciones y alcance de acceso.

La definicion elimina ambiguedades entre rol, permiso y departamento, y
establece el tratamiento funcional de los roles heredados del backend actual.
Debe utilizarse como referencia para:

- La maquina de estados de la Issue 3.
- La matriz de permisos y el mecanismo de autorizacion de la Issue 4.
- El modelo de usuarios, roles y permisos.
- Las reglas de consulta por departamento.
- La clasificacion de funcionalidades anteriores.

Este documento es funcional. No implementa roles, permisos, guards, cambios de
JWT, migraciones ni logica de acceso.

## Fuentes

- `docs/sprint-03-gap-analysis.md`.
- Plan de reorientacion funcional del sistema.
- Descripcion oficial de estados y flujo.
- Plan de trabajo de la Semana 1 del Sprint 3.
- `backend/src/auth/roles/app-role.enum.ts`.
- `backend/src/auth/roles/role-normalizer.ts`.
- Seeds de roles y usuarios de demostracion.
- Entidades actuales de usuarios, roles y departamentos.

## Principios del modelo

1. Un rol identifica la funcion principal que una persona cumple en el
   sistema.
2. Un permiso identifica una accion concreta que el sistema puede autorizar.
3. Un departamento identifica la unidad organizacional que limita el acceso a
   determinados recursos.
4. Tener un rol no permite ejecutar cualquier accion relacionada con ese rol.
5. Tener un permiso no elimina las validaciones de estado, departamento o
   propiedad del recurso.
6. Estar autenticado no equivale a estar autorizado.
7. La visibilidad de una solicitud y la capacidad de modificarla son
   autorizaciones diferentes.
8. Las decisiones operativas deben respetar el estado vigente de la solicitud.
9. Las acciones relevantes deben producir auditoria.
10. Durante el MVP se mantiene un rol principal por usuario.

## Conceptos oficiales

### Rol

Representa la responsabilidad funcional principal de un usuario dentro del
sistema.

Ejemplos:

- Secretaria.
- Personal de Departamento.
- Despacho del Alcalde.
- Administrador.

El rol agrupa responsabilidades, pero las acciones tecnicas se autorizan
mediante permisos.

### Permiso

Representa una capacidad tecnica individual.

Ejemplos:

- Crear solicitudes.
- Consultar solicitudes del propio departamento.
- Aprobar a nivel departamental.
- Firmar una solicitud.
- Crear usuarios.

Los permisos se asignaran a roles en la matriz de autorizacion. Este documento
no define todavia sus codigos definitivos.

### Departamento

Representa una unidad organizacional de la alcaldia y, para el personal
departamental, define el alcance de los recursos que puede consultar y operar.

Ejemplos:

- Planeacion.
- Infraestructura.
- Servicios Publicos.

Un departamento no es un rol ni un permiso. Dos usuarios pueden tener el mismo
rol departamental y pertenecer a departamentos diferentes, por lo que tendran
las mismas capacidades generales sobre conjuntos distintos de solicitudes.

### Alcance de acceso

Es el conjunto de recursos sobre los que un usuario puede aplicar un permiso.
Puede ser:

- Propio: recursos creados o asignados directamente al usuario, cuando una
  regla funcional lo requiera.
- Departamental: recursos asociados al departamento del usuario.
- Global: recursos de todos los departamentos.
- Administrativo: recursos de configuracion como usuarios, roles y
  departamentos, sin autoridad operativa automatica sobre solicitudes.

## Catalogo oficial de actores

| Actor funcional | Codigo tecnico propuesto | Departamento requerido | Alcance principal |
| --- | --- | --- | --- |
| Secretaria | `SECRETARY` | No | Recepcion, registro y seguimiento autorizado |
| Personal de Departamento | `DEPARTMENT_STAFF` | Si | Solicitudes del departamento asociado |
| Despacho del Alcalde | `MAYOR_OFFICE` | No | Solicitudes de todos los departamentos |
| Administrador | `ADMIN` | No | Usuarios, roles, permisos y departamentos |

Los codigos tecnicos son la propuesta oficial de esta subissue. La guia de
convenciones de la Subissue 1.4 debe confirmar su formato antes de crear nuevas
migraciones o seeds.

## Secretaria

### Proposito

Representa al personal responsable del primer contacto con el ciudadano, la
recepcion documental, el registro inicial y el seguimiento administrativo de
las solicitudes.

### Responsabilidades

- Registrar los datos del ciudadano.
- Crear solicitudes.
- Asociar documentos recibidos o escaneados.
- Definir o actualizar la prioridad dentro de los estados autorizados.
- Definir o actualizar la fecha limite dentro de los estados autorizados.
- Asignar la solicitud a un departamento.
- Reasignar el departamento cuando las reglas del flujo lo permitan.
- Consultar el avance necesario para responder al ciudadano.
- Consultar la auditoria cuando tenga el permiso correspondiente.
- Agregar observaciones internas cuando la politica lo permita.
- Corregir datos iniciales dentro de los limites definidos por el estado.

### Restricciones

- No aprueba solicitudes a nivel departamental.
- No rechaza solicitudes en nombre de un departamento.
- No envia solicitudes al despacho como decision departamental.
- No devuelve ni rechaza solicitudes desde el despacho.
- No firma solicitudes.
- No administra usuarios, roles o permisos.
- No puede escoger el estado inicial de una solicitud.
- No puede cambiar el estado mediante una accion generica.
- No puede editar libremente una solicitud cuando el departamento ya inicio
  su revision.

### Alcance de acceso

Secretaria no requiere un departamento asociado.

Su alcance de consulta no debe depender de `departmentId`. Para permitir el
seguimiento al ciudadano se propone que pueda consultar todas las solicitudes
y su auditoria mediante permisos explicitos de lectura, sin recibir por ello
permisos de decision departamental o del despacho.

Esta visibilidad global de seguimiento debe limitar la exposicion de datos
internos que no sean necesarios para sus funciones.

## Personal de Departamento

### Proposito

Representa al personal que analiza y decide solicitudes dentro de una unidad
organizacional de la alcaldia.

El nombre del actor es "Personal de Departamento". El departamento concreto es
un dato asociado al usuario, no una variante del rol.

### Responsabilidades

- Consultar solicitudes del departamento asociado.
- Consultar el detalle y el historial autorizado de esas solicitudes.
- Marcar una solicitud como vista.
- Iniciar su revision.
- Agregar observaciones internas.
- Aprobar una solicitud a nivel departamental.
- Rechazar una solicitud a nivel departamental.
- Enviar una solicitud al Despacho del Alcalde cuando requiera decision o
  firma superior.
- Retomar la revision de solicitudes devueltas al departamento.
- Mantener trazabilidad de las decisiones y motivos requeridos.

### Restricciones

- No consulta solicitudes de otros departamentos salvo un permiso global
  excepcional aprobado posteriormente.
- No opera solicitudes de otro departamento aunque conozca su identificador.
- No asigna o reasigna departamentos por iniciativa propia.
- No firma solicitudes.
- No ejecuta decisiones propias del Despacho del Alcalde.
- No administra usuarios, roles, permisos ni departamentos.
- No modifica datos iniciales fuera de los campos expresamente autorizados.
- No puede aprobar, rechazar o escalar una solicitud que no este en un estado
  compatible.

### Departamento obligatorio

Todo usuario con rol `DEPARTMENT_STAFF` debe tener un `departmentId` activo y
valido.

Si el usuario no tiene departamento, su departamento esta inactivo o la
solicitud pertenece a otro departamento:

- Puede autenticarse si su cuenta sigue activa.
- No puede consultar ni operar solicitudes departamentales.
- La API debe responder con acceso denegado o configuracion invalida segun el
  caso definido en la Issue 4.
- La inconsistencia debe ser corregida por Administracion.

### Alcance departamental

El alcance se determina comparando:

- `user.departmentId`.
- `request.departmentId`.

La coincidencia de departamentos es obligatoria, pero no suficiente. Tambien
deben validarse el permiso solicitado y el estado de la solicitud.

La asignacion opcional a un usuario especifico puede utilizarse para distribuir
trabajo interno, pero no reemplaza el alcance departamental. La permanencia de
`user_assigned_id` debe resolverse en el diseno de datos.

## Despacho del Alcalde

### Proposito

Representa al alcalde y al personal autorizado de su despacho que interviene
en solicitudes escaladas o que requieren una decision superior.

### Responsabilidades

- Consultar solicitudes de todos los departamentos.
- Consultar la auditoria completa.
- Revisar solicitudes enviadas al despacho.
- Editar los campos expresamente autorizados.
- Cambiar prioridad o fecha limite cuando corresponda.
- Reasignar una solicitud a otro departamento.
- Devolver una solicitud al departamento con un motivo.
- Rechazar una solicitud desde el despacho con un motivo.
- Realizar la firma logica cuando tenga la autorizacion correspondiente.
- Cerrar solicitudes cuando las reglas de cierre lo permitan.
- Registrar observaciones y decisiones con trazabilidad.

### Restricciones

- La visibilidad global no permite ejecutar cualquier transicion.
- No decide sobre solicitudes en estados incompatibles con la accion.
- No omite la revision departamental salvo una excepcion funcional aprobada.
- No administra usuarios, roles o permisos por pertenecer al despacho.
- No reemplaza la recepcion inicial de Secretaria.
- No puede devolver, rechazar o reasignar sin registrar el motivo requerido.
- No puede firmar sin una solicitud en el estado autorizado.

### Alcance de acceso

El Despacho del Alcalde tiene alcance global sobre solicitudes y no requiere un
departamento asociado.

El alcance global permite consultar recursos de todos los departamentos, pero
cada accion sigue necesitando:

- Permiso especifico.
- Estado compatible.
- Datos obligatorios.
- Registro de auditoria.

### Firma

Dentro del MVP, `MAYOR_OFFICE` representa al personal autorizado del despacho.
La capacidad de firma debe expresarse mediante un permiso explicito y no como
consecuencia automatica de la visibilidad global.

La matriz de permisos debe confirmar si todos los usuarios del rol reciben el
permiso de firma o si el MVP necesita una separacion adicional. Hasta resolver
esa decision, no debe asumirse que cualquier usuario con acceso global puede
firmar.

## Administrador

### Proposito

Representa al personal responsable de la configuracion, continuidad y gestion
de accesos del sistema.

### Responsabilidades

- Consultar usuarios.
- Crear y actualizar usuarios.
- Activar y desactivar usuarios.
- Asignar roles.
- Asignar departamentos a usuarios.
- Consultar roles y permisos.
- Consultar, crear, actualizar, activar o desactivar departamentos.
- Corregir configuraciones invalidas de usuarios departamentales.
- Ejecutar tareas de soporte expresamente autorizadas.
- Generar auditoria de sus acciones administrativas.

### Restricciones

- No crea solicitudes como funcion administrativa.
- No aprueba solicitudes a nivel departamental.
- No rechaza solicitudes a nivel departamental.
- No envia solicitudes al despacho.
- No devuelve ni rechaza solicitudes desde el despacho.
- No firma solicitudes.
- No cierra solicitudes.
- No recibe permisos operativos por ser Administrador.
- No debe consultar informacion privada de solicitudes salvo un permiso de
  soporte expresamente aprobado.

### Alcance de acceso

El Administrador no requiere departamento.

Su alcance es administrativo sobre usuarios, roles, permisos, departamentos y
configuracion. Este alcance no es equivalente al alcance global operativo del
Despacho del Alcalde.

## Matriz de responsabilidades

| Responsabilidad | Secretaria | Departamento | Despacho | Administrador |
| --- | --- | --- | --- | --- |
| Registrar solicitud | Responsable | No | No | No |
| Asociar documento inicial | Responsable | Segun permiso futuro | Segun permiso futuro | No |
| Asignar departamento | Responsable | No | Puede reasignar | No |
| Definir prioridad y fecha limite | Responsable inicial | No por defecto | Puede modificar | No |
| Consultar solicitudes del propio departamento | Segun seguimiento | Responsable | Si | No por defecto |
| Consultar todas las solicitudes | Para seguimiento autorizado | No | Responsable | Solo soporte autorizado |
| Marcar como vista e iniciar revision | No | Responsable | No | No |
| Aprobar o rechazar por departamento | No | Responsable | No | No |
| Enviar al despacho | No | Responsable | No | No |
| Devolver o rechazar desde despacho | No | No | Responsable | No |
| Firmar | No | No | Responsable autorizado | No |
| Cerrar | Segun regla por confirmar | No por defecto | Segun regla por confirmar | No |
| Gestionar usuarios y accesos | No | No | No | Responsable |
| Consultar auditoria de solicitud | Para seguimiento autorizado | De su departamento | Global | Solo soporte autorizado |

La expresion "segun permiso" indica que la matriz de la Issue 4 debe definir la
capacidad tecnica. No autoriza por si sola la accion.

## Equivalencias con roles heredados

| Rol o alias actual | Actor oficial | Tratamiento | Justificacion |
| --- | --- | --- | --- |
| `RECEPTIONIST` | Secretaria (`SECRETARY`) | Migrar | Representa la recepcion y registro inicial. |
| `recepcionista` | Secretaria (`SECRETARY`) | Migrar y normalizar | Es un alias persistido del mismo actor. |
| `OFFICER` | Personal de Departamento (`DEPARTMENT_STAFF`) | Migrar | Sus funciones de revision pasan al alcance departamental. |
| `revisor` | Personal de Departamento (`DEPARTMENT_STAFF`) | Migrar y normalizar | Es un alias persistido de `OFFICER`. |
| `SUPERVISOR` | Sin equivalencia directa | Retirar progresivamente | Sus responsabilidades se distribuyen entre Secretaria, Despacho y Administrador. |
| `supervisor` | Sin equivalencia directa | Retirar progresivamente | Es un alias persistido de `SUPERVISOR`. |
| `MAYOR` | Despacho del Alcalde (`MAYOR_OFFICE`) | Migrar | El actor objetivo incluye al alcalde y personal autorizado. |
| `alcalde` | Despacho del Alcalde (`MAYOR_OFFICE`) | Migrar y normalizar | Es un alias persistido de `MAYOR`. |
| `ADMIN` | Administrador (`ADMIN`) | Conservar y normalizar | Su responsabilidad administrativa sigue vigente. |
| `admin` | Administrador (`ADMIN`) | Consolidar | Debe evitarse duplicidad por mayusculas. |

### Tratamiento de SUPERVISOR

`SUPERVISOR` no se conserva como actor oficial porque combina capacidades que
el nuevo modelo separa:

- La asignacion inicial de departamento pertenece a Secretaria.
- La reasignacion superior y visibilidad global pertenecen al Despacho.
- La gestion de usuarios y estructura pertenece al Administrador.
- La revision operativa pertenece al Personal de Departamento.

Mantener `SUPERVISOR` de forma permanente produciria responsabilidades
duplicadas y permitiria autorizaciones ambiguas.

La retirada debe ser progresiva:

1. Identificar usuarios y endpoints que dependen de `SUPERVISOR`.
2. Asignar a cada usuario el actor oficial correspondiente.
3. Reemplazar sus usos por permisos explicitos.
4. Mantener compatibilidad temporal solo durante la migracion.
5. Eliminar aliases, seeds y referencias cuando no existan dependencias.

No se deben asignar automaticamente todas las capacidades anteriores de
`SUPERVISOR` a ninguno de los cuatro actores.

## Reglas para usuarios y departamentos

| Rol oficial | `departmentId` | Regla |
| --- | --- | --- |
| `SECRETARY` | Opcional, no usado como alcance principal | No debe limitar el seguimiento por departamento. |
| `DEPARTMENT_STAFF` | Obligatorio | Debe corresponder a un departamento activo. |
| `MAYOR_OFFICE` | No requerido | Su alcance sobre solicitudes es global. |
| `ADMIN` | No requerido | Su alcance principal es administrativo. |

Reglas adicionales:

- Un departamento no concede permisos por si mismo.
- Cambiar el departamento de un usuario cambia su alcance futuro y debe
  auditarse.
- Desactivar un departamento debe bloquear nuevas operaciones de sus usuarios.
- La reasignacion de una solicitud cambia inmediatamente el departamento con
  autoridad operativa sobre ella.
- La consulta y la modificacion deben validarse por separado.

## Modelo de rol unico durante el MVP

El modelo actual relaciona cada usuario con un solo `roleId`. Para limitar el
alcance del Sprint 3 se conserva un rol principal por usuario durante el MVP.

Consecuencias:

- Administrador no recibe capacidades operativas.
- Personal de Departamento no recibe capacidades administrativas.
- Despacho no administra usuarios por defecto.
- Si una persona cumple funciones incompatibles, debe definirse una excepcion
  posterior o utilizar cuentas funcionales separadas durante el MVP.

Los roles multiples y permisos individuales por usuario quedan fuera del
alcance hasta que exista una necesidad aprobada.

## Responsabilidades sin duplicidad

Para evitar solapamientos:

- Secretaria es propietaria de la recepcion y asignacion inicial.
- Departamento es propietario del analisis y decision departamental.
- Despacho es propietario de la decision superior, devolucion y firma.
- Administrador es propietario de usuarios, accesos y estructura.

Las capacidades compartidas de consulta, observacion o edicion no representan
responsabilidades duplicadas porque deben operar con permisos, estados y
alcances diferentes.

## Decisiones que requieren validacion posterior

Las siguientes decisiones no bloquean la definicion de los cuatro actores, pero
deben resolverse antes de implementar la matriz final:

1. Si todos los usuarios de `MAYOR_OFFICE` pueden firmar o se necesita una
   separacion adicional dentro del despacho.
2. Si Secretaria puede cerrar solicitudes despues de responder al ciudadano.
3. Si el Administrador recibe un permiso de lectura de solicitudes para
   soporte.
4. Si la asignacion opcional a un usuario limita operaciones dentro del mismo
   departamento.
5. Que informacion interna puede consultar Secretaria durante el seguimiento.
6. Como se manejaran personas que requieran mas de un rol despues del MVP.

Hasta que se aprueben:

- La firma no se deriva automaticamente del alcance global.
- El Administrador no tiene acceso operativo.
- La asignacion individual no sustituye el alcance departamental.
- No se implementan multiples roles por usuario.

## Implicaciones para las Issues 3 y 4

### Issue 3: maquina de estados

Cada transicion debe identificar:

- Actor responsable.
- Permiso requerido.
- Estado origen y destino.
- Alcance departamental o global.
- Datos y motivos obligatorios.
- Evento de auditoria.

Los controladores no deben inferir autorizacion solamente a partir del rol.

### Issue 4: permisos y autorizacion

La matriz debe:

- Asignar permisos concretos a los cuatro roles.
- Separar permisos de consulta y modificacion.
- Validar `departmentId` para `DEPARTMENT_STAFF`.
- Tratar el alcance global del despacho por separado de sus decisiones.
- Evitar permisos operativos para `ADMIN`.
- Definir la estrategia temporal de compatibilidad con roles heredados.

## Fuera de alcance

- Implementar permisos.
- Modificar autenticacion o autorizacion.
- Crear o modificar tablas.
- Crear seeds o migraciones.
- Cambiar el JWT.
- Implementar guards o decoradores.
- Modificar endpoints.
- Implementar logica de acceso.
- Migrar usuarios existentes.

## Cobertura de criterios de aceptacion

- Cada responsabilidad pertenece a un actor identificado.
- No se asignan responsabilidades operativas principales a mas de un actor.
- Las restricciones de cada actor estan documentadas.
- El alcance departamental esta definido.
- Se determino que rol requiere departamento.
- Los roles heredados tienen equivalencia y tratamiento.
- `SUPERVISOR` se retira progresivamente y sus responsabilidades se
  redistribuyen.
- Rol, permiso, departamento y alcance estan diferenciados.
- Las decisiones pendientes de validacion estan registradas.
- El documento puede utilizarse como referencia para las Issues 3 y 4.
