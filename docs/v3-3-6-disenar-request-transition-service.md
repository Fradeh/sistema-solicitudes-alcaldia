# V3-3.6 Disenar el RequestTransitionService

## Metadatos

| Campo | Valor |
| --- | --- |
| **Revisor** | @Fradeh |
| **Tipo** | Diseno tecnico |
| **Dependencias** | V3-3.1 — Documentar el catalogo tecnico de estados; V3-3.2 — Definir las transiciones de Secretaria; V3-3.3 — Definir las transiciones del Departamento; V3-3.4 — Definir las transiciones del Despacho del Alcalde; V3-3.5 — Definir las reglas de cierre y estados terminales; Definicion preliminar de la Issue 4 (Roles, permisos y autorizacion); Definicion preliminar de la Issue 5 (Auditoria e historial) |
| **Fuentes** | `docs/v3-3-1-documentar-catalogo-estados.md`, `docs/v3-3-2-definir-transiciones-secretaria.md`, `docs/v3-3-3-definir-transiciones-departamento.md`, `docs/v3-3-4-definir-transiciones-despacho-alcalde.md`, `docs/v3-3-5-definir-reglas-cierre-estados-terminales.md`, `docs/sprint-03-permission-matrix.md`, `docs/v3-5-2-consolidar-eventos-flujo-solicitudes.md`, `docs/sprint-03-gap-analysis.md` |

## Proposito

Este documento disena el contrato tecnico del `RequestTransitionService`, el componente central responsable de ejecutar, validar y registrar todas las transiciones de estado del nuevo flujo de solicitudes.

El objetivo es evitar que la logica de transicion quede distribuida entre controladores, servicios o modulos distintos, garantizando que todas las reglas del flujo sean aplicadas desde un unico punto de entrada.

## Fuera de alcance

- Implementar el servicio.
- Crear endpoints.
- Implementar auditoria.
- Implementar permisos.
- Implementar historial.
- Crear migraciones.
- Modificar controladores.
- Implementar transacciones.
- Implementar logica de negocio.

---

## Criterios de aceptacion

- [x] Existe una unica responsabilidad centralizada para las transiciones.
- [x] El contrato de entrada esta documentado.
- [x] El contrato de salida esta documentado.
- [x] El flujo de validacion esta documentado.
- [x] El flujo de auditoria esta documentado.
- [x] El flujo de historial esta documentado.
- [x] Los errores esperados estan definidos.
- [x] La integracion con permisos esta definida.
- [x] La integracion con auditoria esta definida.
- [x] La integracion con historial esta definida.
- [x] El diseno evita logica de transicion en controladores.
- [x] El diseno puede implementarse posteriormente sin redefinir reglas funcionales.

---

## 1. Propósito y principios

### Principios fundamentales

| Principio | Descripcion |
| --- | --- |
| **Centralizacion** | Toda la logica de transicion de estados reside en un unico servicio. |
| **Acciones explicitas** | El servicio recibe acciones funcionales (ej. `ASSIGN_DEPARTMENT`, `SIGN_REQUEST`), nunca un `statusId` arbitrario. |
| **Atomicidad** | Cada transicion valida y persiste: estado actualizado + historial + auditoria en una sola transaccion. |
| **Validacion jerarquica** | Las validaciones se ejecutan en orden: existencia -> estado -> transicion -> permiso -> alcance -> datos. |
| **Inmutabilidad del pasado** | Los estados anteriores no se borran ni modifican; se registran en historial y auditoria. |
| **Sin bypass** | Ningun otro servicio ni controlador puede modificar directamente el estado de una solicitud sin pasar por este servicio. |

### Reemplazo del cambio generico de estado

El backend actual permite cambiar el estado mediante un `PATCH /requests/:id/status` enviando un `statusId` arbitrario. Este endpoint queda **obsoleto** y sera reemplazado por acciones explicitas que invocan al `RequestTransitionService`.

| Enfoque anterior | Enfoque nuevo |
| --- | --- |
| `PATCH /requests/:id/status { statusId: "signed" }` | `POST /requests/:id/sign` -> `RequestTransitionService.signRequest(context)` |
| El cliente decide el estado destino. | El servicio determina el estado destino segun la accion y el estado origen. |
| No valida actor, permiso ni alcance. | Valida actor, permiso, alcance, estado y datos obligatorios. |
| No registra auditoria atomica. | Registra estado + historial + auditoria en una transaccion. |

---

## 2. Responsabilidades del servicio

El `RequestTransitionService` es responsable de:

1. **Validar transiciones:** Verificar que la transicion solicitada este permitida segun la matriz de estados.
2. **Validar permisos:** Verificar que el actor tenga el permiso requerido para ejecutar la accion.
3. **Validar alcance departamental:** Verificar que el actor pueda operar sobre la solicitud segun su departamento o alcance global.
4. **Validar estado compatible:** Verificar que la solicitud se encuentre en el estado origen requerido por la transicion.
5. **Actualizar estados:** Modificar el estado de la solicitud al estado destino correspondiente.
6. **Registrar auditoria:** Generar el evento de auditoria correspondiente a la accion ejecutada.
7. **Generar historial:** Crear la entrada en el historial de la solicitud con estado anterior, nuevo, usuario y motivo.
8. **Ejecutar cambios transaccionalmente:** Garantizar que la actualizacion de estado, el historial y la auditoria se persistan juntos o se reviertan juntos.
9. **Rechazar cambios genericos de estado:** No aceptar transiciones que no correspondan a una accion funcional explicita definida en el catalogo.

---

## 3. Arquitectura hibrida

El servicio utiliza una arquitectura hibrida con dos capas:

### Capa publica: Acciones explicitas

El servicio expone un metodo publico por cada accion funcional valida del flujo. Cada metodo recibe un contexto tipado especifico para esa accion.

**Acciones soportadas:**

- `createRequest` — Crear solicitud (estado inicial `received`).
- `assignToDepartment` — Asignar departamento (`received -> assigned_to_department`).
- `startReview` — Iniciar revision (`assigned_to_department -> in_review` o `returned_to_department -> in_review`).
- `approveByDepartment` — Aprobar solicitud (`in_review -> approved_by_department`).
- `rejectByDepartment` — Rechazar solicitud (`in_review -> rejected_by_department`).
- `sendToMayorOffice` — Enviar al despacho (`in_review -> awaiting_mayor_signature`).
- `returnToDepartment` — Devolver al departamento (`awaiting_mayor_signature -> returned_to_department`).
- `rejectByMayorOffice` — Rechazar desde el despacho (`awaiting_mayor_signature -> rejected_by_mayor_office`).
- `signRequest` — Firmar solicitud (`awaiting_mayor_signature -> signed`).
- `reassignDepartment` — Reasignar departamento (desde `awaiting_mayor_signature` o `received` hacia `assigned_to_department`).
- `closeRequest` — Cerrar solicitud (desde estados de resultado hacia `closed`).

Cada metodo publico:
- Recibe un contexto con los datos especificos de la accion.
- Valida los datos de entrada minimos.
- Delega al motor interno `_executeTransition` con la configuracion de la accion.
- Retorna un `TransitionResult` estandarizado.

### Capa interna: Motor centralizado

Todas las acciones publicas delegan en un motor interno privado que centraliza las validaciones comunes y la ejecucion transaccional.

El motor recibe una configuracion que incluye:
- Identificador de la solicitud.
- Usuario ejecutor (con rol, departamento, permisos).
- Codigo de accion funcional.
- Reglas de transicion permitidas (estado origen -> estado destino).
- Permiso requerido.
- Lista de datos obligatorios.
- Observacion opcional.
- Datos adicionales especificos de la accion.

El motor ejecuta las validaciones en orden y, si todas pasan, ejecuta la transaccion.

### Diagrama de arquitectura

```text
Capa de Presentacion (Controlador)
  |
  +-- POST /requests/:id/sign
        |
        +-- Llama a RequestTransitionService.signRequest(context)
              |
              +-- Capa Publica
              |     +-- Valida datos de entrada minimos del contexto
              |     +-- Delega al motor interno con configuracion de la accion SIGN
              |
              +-- Capa Interna (Motor)
                    |
                    +-- Paso 1: Validar existencia de solicitud
                    +-- Paso 2: Validar usuario activo
                    +-- Paso 3: Validar estado actual compatible
                    +-- Paso 4: Validar transicion permitida
                    +-- Paso 5: Validar permiso del actor
                    +-- Paso 6: Validar alcance (departamento/global)
                    +-- Paso 7: Validar datos obligatorios
                    |
                    +-- Si todas las validaciones pasan:
                          |
                          +-- Inicia transaccion (EntityManager)
                                |
                                +-- Actualiza Request (nuevo estado, fechas, datos)
                                +-- Crea RequestHistory (estado anterior, nuevo, usuario)
                                +-- Crea AuditEvent (evento especifico, motivo, observacion)
                                |
                                +-- Commit si todo OK
                                +-- Rollback si algo falla
                          |
                          +-- Retorna TransitionResult (exito)
                    |
                    +-- Si alguna validacion falla:
                          +-- Retorna TransitionResult (error especifico)
```

---

## 4. Contrato de entrada

### Parametros base (presentes en todas las acciones)

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| `requestId` | Identificador | Si | ID de la solicitud a transicionar. |
| `user` | Actor autenticado | Si | Usuario que ejecuta la accion. Debe incluir: `id`, `role`, `departmentId` (si aplica), permisos activos. |
| `observation` | Texto | No | Observacion opcional asociada a la accion. |

### Datos adicionales por accion

Cada accion puede requerir datos adicionales especificos:

| Accion | Datos adicionales requeridos | Descripcion |
| --- | --- | --- |
| `createRequest` | Datos del ciudadano, categoria, descripcion, documentos opcionales. | Datos iniciales de la solicitud. |
| `assignToDepartment` | `departmentId`, `priority`, `dueDate`. | Departamento, prioridad y fecha limite obligatorios. |
| `startReview` | Ninguno adicional. | Solo requiere que la solicitud este en estado compatible. |
| `approveByDepartment` | Ninguno adicional. | La aprobacion no requiere datos extra (motivo opcional). |
| `rejectByDepartment` | `reason` (motivo). | **Motivo obligatorio.** |
| `sendToMayorOffice` | `justification` (causa de intervencion). | Justificacion recomendada. |
| `returnToDepartment` | `reason` (motivo), `observation` (detalle). | **Motivo obligatorio, observacion obligatoria.** |
| `rejectByMayorOffice` | `reason` (motivo), `observation` (detalle). | **Motivo obligatorio, observacion obligatoria.** |
| `signRequest` | Ninguno adicional. | La firma registra `signedById` y `signedAt` automaticamente. |
| `reassignDepartment` | `newDepartmentId`, `reason`. | Nuevo departamento y **motivo obligatorio.** |
| `closeRequest` | Ninguno adicional. | El cierre verifica que el resultado este completo. |

### Restricciones de entrada

- **No se recibe `statusId` como parametro.** El estado destino es determinado internamente por el servicio segun la accion y el estado origen.
- **No se recibe `status` arbitrario.** El cliente solo puede solicitar acciones funcionales explicitas.
- **El usuario se obtiene del JWT, no del body.** Nunca se confia en el body de la solicitud para determinar el autor.

---

## 5. Contrato de salida

### Estructura de respuesta

El servicio retorna un objeto estandarizado independientemente de la accion ejecutada:

| Campo | Tipo | Descripcion |
| --- | --- | --- |
| `success` | Boolean | Indica si la transicion se ejecuto correctamente. |
| `request` | Objeto Solicitud | La solicitud actualizada con el nuevo estado y datos. |
| `previousStatus` | String | Estado anterior de la solicitud. |
| `newStatus` | String | Nuevo estado de la solicitud. |
| `eventsGenerated` | Array | Lista de eventos generados (auditoria e historial). |
| `historyEntry` | Objeto Historial | La entrada creada en el historial de la solicitud. |
| `timestamp` | Fecha/Hora | Momento en que se ejecuto la transicion. |
| `errors` | Array | Lista de errores si la transicion fallo. Vacio si tuvo exito. |

### Estructura de error

Si la transicion falla, el campo `errors` contiene objetos con:

| Campo | Descripcion |
| --- | --- |
| `code` | Codigo del error (ej. `INVALID_TRANSITION`). |
| `message` | Descripcion legible del error. |
| `field` | Campo relacionado con el error (si aplica). |

---

## 6. Flujo interno de ejecucion

El motor interno ejecuta las siguientes etapas en orden secuencial:

### Paso 1: Validar existencia de solicitud

- Verificar que la solicitud con `requestId` exista en la base de datos.
- Si no existe, retornar error `REQUEST_NOT_FOUND`.

### Paso 2: Validar usuario activo

- Verificar que el usuario ejecutor este activo en el sistema.
- Verificar que el rol del usuario este activo.
- Si el usuario esta inactivo o deshabilitado, retornar error `INSUFFICIENT_PERMISSIONS`.

### Paso 3: Validar estado actual compatible

- Obtener el estado actual de la solicitud.
- Verificar que el estado actual este en la lista de estados origen permitidos para la accion solicitada.
- Si el estado no es compatible, retornar error `INVALID_STATE`.

### Paso 4: Validar transicion permitida

- Verificar que la combinacion (estado origen, accion, estado destino) este definida en la matriz de transiciones oficial.
- Si la transicion no esta permitida, retornar error `INVALID_TRANSITION`.

### Paso 5: Validar permiso del actor

- Verificar que el rol del usuario tenga el permiso requerido para la accion (segun `sprint-03-permission-matrix.md`).
- Si el permiso no esta asignado, retornar error `INSUFFICIENT_PERMISSIONS`.

### Paso 6: Validar alcance

- Si el permiso requiere alcance departamental, verificar que `user.departmentId == request.departmentId`.
- Si el permiso requiere alcance global (Despacho), no aplicar restriccion de departamento.
- Si el permiso requiere alcance propio, verificar que el usuario sea el creador o receptor.
- Si el alcance no coincide, retornar error `INVALID_SCOPE`.

### Paso 7: Validar datos obligatorios

- Verificar que todos los datos adicionales obligatorios para la accion esten presentes y sean validos.
- Ejemplos: motivo de rechazo no vacio, departamento activo, fecha limite futura.
- Si falta algun dato obligatorio, retornar error `MISSING_REQUIRED_DATA`.

### Paso 8: Ejecutar actualizacion, auditoria e historial (transaccional)

Si todas las validaciones pasan, se ejecuta dentro de una transaccion de base de datos:

1. **Actualizar la solicitud:**
   - Modificar el estado al destino correspondiente.
   - Actualizar campos operativos segun la accion (`reviewStartedAt`, `decisionAt`, `signedAt`, `signedById`, etc.).
   - Actualizar datos adicionales si aplica (nuevo `departmentId`, prioridad, fecha limite).

2. **Registrar historial:**
   - Crear entrada en `request_history` con estado anterior, estado nuevo, usuario ejecutor, observacion.

3. **Registrar auditoria:**
   - Crear evento de auditoria especifico (`REQUEST_REVIEW_STARTED`, `REQUEST_APPROVED_BY_DEPARTMENT`, `REQUEST_SIGNED`, etc.).
   - Incluir motivo y observacion segun las reglas del catalogo de eventos.

4. **Confirmar transaccion:**
   - Hacer commit si todas las operaciones tienen exito.
   - Hacer rollback si cualquier operacion falla.

### Paso 9: Confirmar operacion

- Construir el `TransitionResult` con los datos actualizados.
- Retornar el resultado al metodo publico.
- El metodo publico retorna al controlador.

---

## 7. Matriz de transiciones validadas

La matriz define que acciones estan permitidas desde cada estado, que actor las puede ejecutar, que permiso requiere y que evento de auditoria genera.

| Accion | Estado origen | Estado destino | Actor | Permiso | Datos obligatorios | Evento auditoria |
| --- | --- | --- | --- | --- | --- | --- |
| Crear solicitud | (ninguno) | `received` | Secretaria | `requests:create` | Datos del ciudadano | `REQUEST_CREATED` |
| Asignar departamento | `received` | `assigned_to_department` | Secretaria | `requests:assign_department` | `departmentId`, `priority`, `dueDate` | `REQUEST_DEPARTMENT_ASSIGNED` |
| Iniciar revision | `assigned_to_department` | `in_review` | Departamento | `requests:start_review` | Ninguno | `REQUEST_REVIEW_STARTED` |
| Iniciar revision (devuelta) | `returned_to_department` | `in_review` | Departamento | `requests:start_review` | Ninguno | `REQUEST_REVIEW_STARTED` |
| Aprobar departamento | `in_review` | `approved_by_department` | Departamento | `requests:approve_department` | Ninguno | `REQUEST_APPROVED_BY_DEPARTMENT` |
| Rechazar departamento | `in_review` | `rejected_by_department` | Departamento | `requests:reject_department` | `reason` | `REQUEST_REJECTED_BY_DEPARTMENT` |
| Enviar al despacho | `in_review` | `awaiting_mayor_signature` | Departamento | `requests:send_to_mayor_office` | `justification` | `REQUEST_SENT_TO_MAYOR_OFFICE` |
| Devolver a departamento | `awaiting_mayor_signature` | `returned_to_department` | Despacho | `requests:return_to_department` | `reason`, `observation` | `REQUEST_RETURNED_TO_DEPARTMENT` |
| Rechazar desde despacho | `awaiting_mayor_signature` | `rejected_by_mayor_office` | Despacho | `requests:reject_mayor_office` | `reason`, `observation` | `REQUEST_REJECTED_BY_MAYOR_OFFICE` |
| Firmar solicitud | `awaiting_mayor_signature` | `signed` | Despacho | `requests:sign` | Ninguno | `REQUEST_SIGNED` |
| Reasignar departamento | `received` | `assigned_to_department` | Secretaria | `requests:assign_department` | `newDepartmentId` | `REQUEST_DEPARTMENT_REASSIGNED` |
| Reasignar desde despacho | `awaiting_mayor_signature` | `assigned_to_department` | Despacho | `requests:assign_department` | `newDepartmentId`, `reason` | `REQUEST_DEPARTMENT_REASSIGNED` |
| Cerrar solicitud | `approved_by_department` | `closed` | Secretaria | `requests:close` | Ninguno | `REQUEST_CLOSED` |
| Cerrar solicitud | `rejected_by_department` | `closed` | Secretaria | `requests:close` | Ninguno | `REQUEST_CLOSED` |
| Cerrar solicitud | `signed` | `closed` | Secretaria / Despacho | `requests:close` | Ninguno | `REQUEST_CLOSED` |
| Cerrar solicitud | `rejected_by_mayor_office` | `closed` | Secretaria / Despacho | `requests:close` | Ninguno | `REQUEST_CLOSED` |

---

## 8. Validaciones por tipo

### Validaciones de estado

| Regla | Descripcion | Error si falla |
| --- | --- | --- |
| Estado actual compatible | La solicitud debe estar en uno de los estados origen permitidos para la accion. | `INVALID_STATE` |
| Estado destino determinado | El servicio calcula el estado destino; el cliente no lo envia. | `INVALID_TRANSITION` |
| Estado terminal inmutable | Desde `closed` no se permite ninguna transicion. | `INVALID_TRANSITION` |

### Validaciones de permiso

| Regla | Descripcion | Error si falla |
| --- | --- | --- |
| Permiso asignado al rol | El rol del usuario debe tener el permiso requerido para la accion. | `INSUFFICIENT_PERMISSIONS` |
| Usuario activo | El usuario y su cuenta deben estar activos. | `INSUFFICIENT_PERMISSIONS` |

### Validaciones de alcance

| Regla | Descripcion | Error si falla |
| --- | --- | --- |
| Alcance departamental | Para `DEPARTMENT_STAFF`, `user.departmentId` debe coincidir con `request.departmentId`. | `INVALID_SCOPE` |
| Alcance global | Para `MAYOR_OFFICE`, no aplica restriccion de departamento. | (ninguno) |
| Alcance propio | Para acciones propias, verificar que el usuario sea el creador o receptor. | `INVALID_SCOPE` |

### Validaciones de datos

| Regla | Descripcion | Error si falla |
| --- | --- | --- |
| Datos obligatorios presentes | Todos los campos requeridos por la accion deben estar en el contexto. | `MISSING_REQUIRED_DATA` |
| Departamento activo | El departamento asignado debe existir y estar activo. | `MISSING_REQUIRED_DATA` |
| Fecha limite valida | La fecha limite debe ser futura y valida. | `MISSING_REQUIRED_DATA` |
| Motivo no vacio | Los rechazos, devoluciones y reasignaciones requieren un motivo no vacio. | `MISSING_REQUIRED_DATA` |

---

## 9. Manejo de errores

### Errores definidos

| Codigo | Descripcion | Cuando ocurre |
| --- | --- | --- |
| `REQUEST_NOT_FOUND` | La solicitud no existe en el sistema. | Paso 1: El `requestId` no corresponde a una solicitud existente. |
| `INVALID_STATE` | El estado actual de la solicitud no permite la accion solicitada. | Paso 3: La solicitud esta en un estado incompatible con la accion. |
| `INVALID_TRANSITION` | La transicion no esta definida en la matriz de estados. | Paso 4: La combinacion (estado origen, accion) no tiene un estado destino permitido. |
| `INSUFFICIENT_PERMISSIONS` | El actor no tiene permiso para ejecutar la accion. | Paso 2 o 5: Usuario inactivo o rol sin el permiso requerido. |
| `INVALID_SCOPE` | El actor no puede operar sobre esta solicitud por restriccion de alcance. | Paso 6: El usuario pertenece a otro departamento o no tiene alcance global. |
| `MISSING_REQUIRED_DATA` | Faltan datos obligatorios para completar la transicion. | Paso 7: Falta motivo, departamento inactivo, fecha invalida, etc. |

### Estrategia de manejo de errores

- Cada validacion se ejecuta en orden y **detiene el flujo** en el primer error encontrado.
- El error se registra en el `TransitionResult` sin generar auditoria ni historial (la transicion no se ejecuto).
- El controlador debe mapear cada codigo de error al codigo HTTP y mensaje correspondiente segun el contrato API (Issue 6).

---

## 10. Integracion con otras capas

### Integracion con autorizacion (Issue 4)

| Aspecto | Integracion |
| --- | --- |
| Fuente de permisos | El servicio consume el `PermissionsService` para verificar que el rol del usuario tenga el permiso requerido. |
| Fuente de usuario | El usuario se obtiene del JWT via `AuthService`; nunca del body de la peticion. |
| Validacion de alcance | El servicio utiliza el `departmentId` del usuario (del JWT) y lo compara con el de la solicitud. |

### Integracion con historial (Issue 5)

| Aspecto | Integracion |
| --- | --- |
| Servicio consumido | `RequestHistoryService` o repositorio de historial. |
| Cuando se registra | Dentro de la misma transaccion que actualiza la solicitud. |
| Datos registrados | Estado anterior, estado nuevo, usuario ejecutor, fecha, observacion. |

### Integracion con auditoria (Issue 5)

| Aspecto | Integracion |
| --- | --- |
| Servicio consumido | `AuditService` o repositorio de eventos de auditoria. |
| Cuando se registra | Dentro de la misma transaccion que actualiza la solicitud. |
| Datos registrados | Evento especifico (ej. `REQUEST_SIGNED`), motivo, observacion, usuario, fecha, metadatos adicionales. |
| Regla de no duplicidad | No se registra `STATUS_CHANGED` si ya existe un evento especifico para la accion. |

### Integracion con persistencia

| Aspecto | Integracion |
| --- | --- |
| Repositorio de solicitudes | `RequestRepository` (TypeORM) para consultar y actualizar la solicitud. |
| Transacciones | Se utiliza `EntityManager` de TypeORM para agrupar todas las operaciones (solicitud + historial + auditoria) en una sola transaccion. |
| Rollback | Si falla cualquier operacion dentro de la transaccion, se hace rollback completo. |

---

## 11. Reemplazo del cambio generico de estado

### Estado actual (obsoleto)

El backend actual permite:

```text
PATCH /requests/:id/status
Body: { statusId: "<uuid-del-estado>" }
```

Este endpoint:
- Permite saltar estados.
- No valida actor ni permiso.
- No valida transicion.
- No registra auditoria atomica.

### Estado objetivo

Los nuevos endpoints llamaran directamente al `RequestTransitionService`:

```text
POST /requests/:id/assign-department
  -> RequestTransitionService.assignToDepartment(context)

POST /requests/:id/start-review
  -> RequestTransitionService.startReview(context)

POST /requests/:id/approve
  -> RequestTransitionService.approveByDepartment(context)

POST /requests/:id/sign
  -> RequestTransitionService.signRequest(context)

POST /requests/:id/close
  -> RequestTransitionService.closeRequest(context)
```

Cada endpoint:
- Recibe los datos especificos de la accion en el body.
- Obtiene el usuario del JWT.
- Llama al metodo correspondiente del servicio.
- Retorna el `TransitionResult` al cliente.

### Estrategia de migracion

1. Implementar `RequestTransitionService` con todas las acciones definidas.
2. Crear nuevos endpoints que invoquen al servicio.
3. Marcar `PATCH /requests/:id/status` como **obsoleto** (deprecated).
4. Actualizar la documentacion de Swagger.
5. En una fase posterior, eliminar el endpoint obsoleto.

---

## 12. Decisiones resueltas

| Decision | Resolucion |
| --- | --- |
| Unico punto de entrada | Toda la logica de transicion reside en `RequestTransitionService`. |
| Acciones explicitas | El servicio recibe acciones funcionales, nunca `statusId`. |
| Arquitectura | Hibrida: metodos publicos por accion + motor interno centralizado. |
| Transacciones | Atomicas: solicitud + historial + auditoria en una sola transaccion. |
| Validacion jerarquica | Orden: existencia -> usuario -> estado -> transicion -> permiso -> alcance -> datos. |
| Reemplazo de endpoint generico | `PATCH /requests/:id/status` queda obsoleto; se reemplaza por endpoints de acciones explicitas. |
| Sin bypass | Ningun otro servicio ni controlador puede modificar directamente el estado de una solicitud. |

---

## 13. Decisiones pendientes de validacion externa

| Punto | Impacto en el servicio |
| --- | --- |
| **Formato exacto de los DTOs/Contexts** | Se definiran en la Issue 6 (Contrato API). Este documento define la estructura funcional; los tipos tecnicos se concretaran en la implementacion. |
| **Uso de `EntityManager` vs repositorios inyectados** | Define si el servicio usara `EntityManager` directamente para transacciones o si delegara en repositorios que manejen sus propias transacciones. |
| **Estrategia de rollback ante fallo parcial** | Define como se maneja un fallo en la auditoria despues de haber actualizado la solicitud (rollback completo vs compensacion). |
| **Eventos asincronos** | Define si la auditoria se registra sincronicamente dentro de la transaccion o asincronamente despues del commit. |
| **Permisos multiples por usuario** | Si el MVP evoluciona a multiples roles por usuario, el servicio debe validar que al menos uno de los roles tenga el permiso requerido. |

---

## 14. Referencias

- `docs/v3-3-1-documentar-catalogo-estados.md` — Catalogo de los 10 estados y sus transiciones.
- `docs/v3-3-2-definir-transiciones-secretaria.md` — Acciones de Secretaria.
- `docs/v3-3-3-definir-transiciones-departamento.md` — Acciones del Departamento.
- `docs/v3-3-4-definir-transiciones-despacho-alcalde.md` — Acciones del Despacho del Alcalde.
- `docs/v3-3-5-definir-reglas-cierre-estados-terminales.md` — Reglas de cierre.
- `docs/sprint-03-permission-matrix.md` — Matriz de permisos por rol.
- `docs/v3-5-2-consolidar-eventos-flujo-solicitudes.md` — Catalogo de eventos auditables.
- `docs/sprint-03-gap-analysis.md` — Analisis de brechas (cambio generico de estado).

---

## Resultado esperado

Disponer de un contrato tecnico completo para el `RequestTransitionService`, permitiendo que la implementacion futura centralice todas las reglas de transicion, permisos, auditoria e historial en un unico componente consistente y mantenible.

---

*Documento generado para la subissue V3-3.6. Este diseno es la base tecnica para la implementacion del servicio central de transiciones en la fase de desarrollo.*
