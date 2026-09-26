# V3-3.1 Documentar el catálogo técnico de estados

## Metadatos

| Campo | Valor |
| --- | --- |
| **Revisor** | @Fradeh |
| **Tipo** | Diseño funcional |
| **Dependencias** | Subissue 1.3 — Consolidar estados y decisiones funcionales pendientes |
| **Fuentes** | `docs/sprint-03-official-states.md`, `docs/sprint-03-official-roles.md`, `docs/sprint-03-gap-analysis.md` |

## Proposito

Este documento define formalmente el catalogo tecnico de estados que compone la maquina de estados del nuevo flujo de solicitudes. Documenta el proposito, comportamiento y caracteristicas de cada estado para garantizar una interpretacion consistente entre backend, frontend, auditoria y permisos.

El catalogo resultante sirve como referencia obligatoria para todas las transiciones que seran definidas en las siguientes subissues de esta issue.

## Fuera de alcance

- Implementar transiciones.
- Implementar endpoints.
- Implementar auditoria.
- Implementar permisos.
- Modificar base de datos.
- Crear servicios de transicion.

---

## Criterios de aceptacion

- [x] Los diez estados oficiales estan documentados.
- [x] Cada estado posee un codigo tecnico unico.
- [x] Cada estado posee una descripcion funcional.
- [x] Cada estado posee un actor responsable definido.
- [x] Cada estado posee condiciones de entrada documentadas.
- [x] Cada estado posee condiciones de salida documentadas.
- [x] Los estados estan clasificados por tipo.
- [x] No existen estados ambiguos.
- [x] El catalogo puede utilizarse como base para disenar transiciones.

---

## Principios del catalogo

1. Toda solicitud inicia en `received`.
2. El cliente no puede seleccionar directamente el estado inicial.
3. Un estado representa una etapa persistente del proceso, no cualquier accion realizada sobre la solicitud.
4. Las transiciones se ejecutan mediante acciones funcionales explicitas.
5. No se permite cambiar un estado enviando un `statusId` arbitrario.
6. Toda transicion valida debe registrar auditoria en la misma transaccion.
7. El actor responsable de una etapa no obtiene automaticamente permiso para ejecutar todas las salidas posibles.
8. `closed` es el unico estado terminal del ciclo operativo.

---

## Clasificacion de estados

| Tipo | Significado |
| --- | --- |
| **Inicial** | Punto obligatorio de entrada al flujo. |
| **Intermedio operativo** | Etapa en la que un actor debe realizar trabajo o tomar una decision. |
| **Intermedio de resultado** | Registra el resultado de una decision antes del cierre administrativo. |
| **Final o terminal** | Finaliza el ciclo operativo y bloquea nuevas acciones ordinarias. |

---

## Catalogo de estados

### 1. `received`

| Campo | Definicion |
| --- | --- |
| **Codigo tecnico** | `received` |
| **Nombre mostrado al usuario** | Recibida |
| **Descripcion funcional** | La solicitud fue registrada por Secretaria y existe oficialmente en el sistema, pero todavia no ha sido delegada a un departamento responsable. |
| **Actor responsable** | Secretaria |
| **Tipo de estado** | Inicial y operativo |
| **Condiciones de entrada** | Se registraron los datos minimos de la solicitud y del ciudadano; el backend genero el codigo de seguimiento; el backend identifico al usuario receptor; el estado fue asignado automaticamente. |
| **Condiciones de salida** | La unica salida ordinaria es `assigned_to_department`, mediante una accion de asignacion que exige: departamento activo, prioridad valida, fecha limite valida. |
| **Restricciones de salida** | No puede aprobarse, rechazarse, firmarse ni cerrarse. El departamento no puede iniciar revision desde este estado. |

**Nota:** Mientras permanece en `received`, Secretaria puede completar o corregir los datos iniciales permitidos, asociar documentos y preparar la delegacion. La solicitud puede existir temporalmente sin departamento, prioridad definitiva o fecha limite. Ver `docs/sprint-03-official-states.md` seccion `received` para detalles de comportamiento.

---

### 2. `assigned_to_department`

| Campo | Definicion |
| --- | --- |
| **Codigo tecnico** | `assigned_to_department` |
| **Nombre mostrado al usuario** | Asignada a departamento |
| **Descripcion funcional** | La solicitud fue delegada formalmente a un departamento responsable y esta disponible para que su personal la consulte y comience el analisis. |
| **Actor responsable** | Personal del departamento asignado |
| **Tipo de estado** | Intermedio operativo |
| **Condiciones de entrada** | La solicitud estaba en `received`, o fue reasignada por una accion superior que determine volver a esta etapa; existe un departamento activo; la prioridad y la fecha limite estan definidas; se registro la fecha de delegacion y se genero el evento de asignacion o reasignacion. |
| **Condiciones de salida** | Pasa a `in_review` cuando personal autorizado ejecuta la accion de iniciar revision. |
| **Restricciones de salida** | No puede decidirse una aprobacion, rechazo o escalamiento antes de iniciar formalmente la revision. Solo el departamento asociado puede operar la solicitud. |

---

### 3. `in_review`

| Campo | Definicion |
| --- | --- |
| **Codigo tecnico** | `in_review` |
| **Nombre mostrado al usuario** | En revision |
| **Descripcion funcional** | El departamento responsable inicio formalmente el analisis de la solicitud y debe producir una decision departamental. |
| **Actor responsable** | Personal del departamento asignado |
| **Tipo de estado** | Intermedio operativo |
| **Condiciones de entrada** | La solicitud estaba en `assigned_to_department` o `returned_to_department`; el usuario pertenece al departamento responsable; se registro `review_started_at` y se genero el evento `REVIEW_STARTED`. |
| **Condiciones de salida** | Puede pasar a: `approved_by_department` (aprobacion sin escalamiento), `rejected_by_department` (rechazo departamental), `awaiting_mayor_signature` (requiere decision superior). |
| **Restricciones de salida** | Rechazar requiere un motivo; enviar al despacho requiere justificar la causa de intervencion; no puede firmarse ni cerrarse directamente; un usuario de otro departamento no puede decidir sobre la solicitud. |

---

### 4. `approved_by_department`

| Campo | Definicion |
| --- | --- |
| **Codigo tecnico** | `approved_by_department` |
| **Nombre mostrado al usuario** | Aprobada por departamento |
| **Descripcion funcional** | El departamento concluyo favorablemente el analisis y determino que la solicitud no necesita una decision ni firma del Despacho del Alcalde. |
| **Actor responsable** | Secretaria para comunicar o registrar el resultado y completar el cierre administrativo |
| **Tipo de estado** | Intermedio de resultado |
| **Condiciones de entrada** | La solicitud estaba en `in_review`; la decision fue tomada por personal autorizado del departamento; la solicitud no cumple un criterio de intervencion obligatoria del despacho; se registro `decision_at` y se generaron los eventos de aprobacion y cambio de estado. |
| **Condiciones de salida** | Pasa a `closed` mediante una accion explicita de cierre administrativo. |
| **Restricciones de salida** | No puede enviarse posteriormente al despacho por el flujo ordinario; no puede volver a revision sin una reapertura, que queda fuera del MVP. |

**Decision funcional:** `approved_by_department` no cambia automaticamente a `closed`. Se mantiene como estado de resultado hasta que Secretaria confirme que el resultado fue comunicado o que el expediente cumple las condiciones administrativas de cierre. Esta separacion evita perder la diferencia entre "aprobada" y "cerrada".

---

### 5. `rejected_by_department`

| Campo | Definicion |
| --- | --- |
| **Codigo tecnico** | `rejected_by_department` |
| **Nombre mostrado al usuario** | Rechazada por departamento |
| **Descripcion funcional** | El departamento concluyo desfavorablemente el analisis y rechazo la solicitud. |
| **Actor responsable** | Secretaria para comunicar o registrar el resultado y completar el cierre administrativo |
| **Tipo de estado** | Intermedio de resultado |
| **Condiciones de entrada** | La solicitud estaba en `in_review`; la decision fue tomada por personal autorizado del departamento; existe un motivo obligatorio de rechazo; se registro `decision_at` y se generaron los eventos correspondientes. |
| **Condiciones de salida** | Pasa a `closed` mediante una accion explicita de cierre administrativo. |
| **Restricciones de salida** | No puede enviarse al despacho despues del rechazo ordinario; no puede volver a revision sin una reapertura fuera del MVP. |

**Decision funcional:** El rechazo departamental no cierra automaticamente la solicitud. Secretaria debe completar el paso administrativo de comunicacion o registro de respuesta.

---

### 6. `awaiting_mayor_signature`

| Campo | Definicion |
| --- | --- |
| **Codigo tecnico** | `awaiting_mayor_signature` |
| **Nombre mostrado al usuario** | Pendiente de decision del despacho |
| **Descripcion funcional** | El departamento completo su revision y envio la solicitud al Despacho del Alcalde porque requiere decision superior, firma logica o una actuacion que excede la competencia departamental. Aunque el codigo menciona "signature", el estado representa la espera de una decision del despacho y no garantiza que el resultado final sea una firma. |
| **Actor responsable** | Despacho del Alcalde |
| **Tipo de estado** | Intermedio operativo |
| **Condiciones de entrada** | La solicitud estaba en `in_review`; el departamento autorizo el envio; existe una causa de intervencion documentada; se genero `SENT_TO_MAYOR_OFFICE`. |
| **Condiciones de salida** | Puede pasar a: `signed` (aprobacion y firma logica), `returned_to_department` (devolucion para correccion), `rejected_by_mayor_office` (rechazo del despacho), `assigned_to_department` (solo mediante reasignacion explicita a otro departamento). |
| **Restricciones de salida** | No puede cerrarse sin registrar primero un resultado; devolver, rechazar o reasignar exige motivo; la firma requiere identificar al usuario autorizado. |

---

### 7. `returned_to_department`

| Campo | Definicion |
| --- | --- |
| **Codigo tecnico** | `returned_to_department` |
| **Nombre mostrado al usuario** | Devuelta al departamento |
| **Descripcion funcional** | El Despacho del Alcalde devolvio la solicitud al departamento responsable para corregir, ampliar informacion o realizar una revision adicional. |
| **Actor responsable** | Personal del departamento al que fue devuelta |
| **Tipo de estado** | Intermedio operativo |
| **Condiciones de entrada** | La solicitud estaba en `awaiting_mayor_signature`; el despacho registro un motivo obligatorio; se genero `RETURNED_TO_DEPARTMENT`. |
| **Condiciones de salida** | Pasa a `in_review` cuando el departamento reinicia formalmente la revision. |
| **Restricciones de salida** | El despacho no puede firmarla mientras siga devuelta; no puede cerrarse ni producir una nueva decision sin reiniciar la revision. |

**Decision funcional:** `returned_to_department` no vuelve automaticamente a `in_review`. Se mantiene como etapa diferenciada hasta que el departamento reconozca la devolucion e inicie una nueva revision. Al reiniciar, se conserva todo el historial anterior y la solicitud puede volver a aprobarse, rechazarse o enviarse al despacho.

---

### 8. `rejected_by_mayor_office`

| Campo | Definicion |
| --- | --- |
| **Codigo tecnico** | `rejected_by_mayor_office` |
| **Nombre mostrado al usuario** | Rechazada por el despacho |
| **Descripcion funcional** | El Despacho del Alcalde rechazo la solicitud despues de revisar el expediente escalado. |
| **Actor responsable** | Secretaria para comunicar o registrar el resultado y completar el cierre administrativo |
| **Tipo de estado** | Intermedio de resultado |
| **Condiciones de entrada** | La solicitud estaba en `awaiting_mayor_signature`; un usuario autorizado del despacho tomo la decision; existe un motivo obligatorio; se registro `decision_at` y se genero `REJECTED_BY_MAYOR_OFFICE`. |
| **Condiciones de salida** | Pasa a `closed` mediante una accion explicita. |
| **Restricciones de salida** | No vuelve al departamento mediante el flujo ordinario; no puede firmarse despues del rechazo; una reapertura queda fuera del MVP. |

---

### 9. `signed`

| Campo | Definicion |
| --- | --- |
| **Codigo tecnico** | `signed` |
| **Nombre mostrado al usuario** | Firmada |
| **Descripcion funcional** | El Despacho del Alcalde aprobo la solicitud escalada y un usuario autorizado realizo la firma logica. |
| **Actor responsable** | Secretaria para comunicar o registrar el resultado y completar el cierre administrativo |
| **Tipo de estado** | Intermedio de resultado |
| **Condiciones de entrada** | La solicitud estaba en `awaiting_mayor_signature`; el usuario tenia permiso explicito de firma; se registro `signed_at` y `signed_by_id`; se genero `SIGNED`. |
| **Condiciones de salida** | Pasa a `closed` mediante una accion explicita de cierre administrativo. |
| **Restricciones de salida** | No puede firmarse una segunda vez por el flujo ordinario; no puede volver a revision sin una reapertura fuera del MVP. |

**Decision funcional:** `signed` no cambia automaticamente a `closed`. La firma es un resultado relevante que debe permanecer identificable hasta que Secretaria complete la comunicacion o cierre del expediente.

---

### 10. `closed`

| Campo | Definicion |
| --- | --- |
| **Codigo tecnico** | `closed` |
| **Nombre mostrado al usuario** | Cerrada |
| **Descripcion funcional** | La solicitud completo su ciclo operativo y administrativo. Existe un resultado registrado y no quedan acciones ordinarias pendientes. |
| **Actor responsable** | Ninguno. La solicitud permanece disponible para consulta y auditoria segun los permisos aplicables. |
| **Tipo de estado** | Final o terminal |
| **Condiciones de entrada** | La solicitud debe estar en uno de los estados de resultado: `approved_by_department`, `rejected_by_department`, `rejected_by_mayor_office` o `signed`. Adicionalmente: el resultado debe estar completo; los motivos obligatorios deben existir; un usuario de Secretaria con permiso de cierre ejecuta la accion; se genera `CLOSED`. |
| **Condiciones de salida** | Ninguna. Es el estado terminal. |
| **Restricciones de salida** | No se permiten cambios de prioridad, fecha, departamento o decision; no se permiten nuevas observaciones operativas ordinarias; la reapertura queda fuera del MVP. |

**Decision funcional:** El cierre es manual y corresponde a Secretaria durante el MVP. Esta decision separa la autoridad que toma la decision de la responsabilidad de comunicar y cerrar administrativamente el expediente.

---

## Clasificacion consolidada de estados

| Estado | Tipo | Actor responsable | Nombre mostrado |
| --- | --- | --- | --- |
| `received` | Inicial y operativo | Secretaria | Recibida |
| `assigned_to_department` | Intermedio operativo | Personal de Departamento | Asignada a departamento |
| `in_review` | Intermedio operativo | Personal de Departamento | En revision |
| `approved_by_department` | Intermedio de resultado | Secretaria para cierre | Aprobada por departamento |
| `rejected_by_department` | Intermedio de resultado | Secretaria para cierre | Rechazada por departamento |
| `awaiting_mayor_signature` | Intermedio operativo | Despacho del Alcalde | Pendiente de decision del despacho |
| `returned_to_department` | Intermedio operativo | Personal de Departamento | Devuelta al departamento |
| `rejected_by_mayor_office` | Intermedio de resultado | Secretaria para cierre | Rechazada por el despacho |
| `signed` | Intermedio de resultado | Secretaria para cierre | Firmada |
| `closed` | Final o terminal | Ninguno | Cerrada |

---

## Analisis de responsabilidades

### Actor que controla cada estado

| Estado | Actor controlador |
| --- | --- |
| `received` | Secretaria |
| `assigned_to_department` | Personal de Departamento (del departamento asignado) |
| `in_review` | Personal de Departamento (del departamento asignado) |
| `approved_by_department` | Secretaria (para cierre administrativo) |
| `rejected_by_department` | Secretaria (para cierre administrativo) |
| `awaiting_mayor_signature` | Despacho del Alcalde |
| `returned_to_department` | Personal de Departamento (del departamento devuelto) |
| `rejected_by_mayor_office` | Secretaria (para cierre administrativo) |
| `signed` | Secretaria (para cierre administrativo) |
| `closed` | Ninguno (solo consulta) |

### Actores que pueden visualizar cada estado

| Estado | Secretaria | Personal Depto | Despacho | Administrador |
| --- | --- | --- | --- | --- |
| `received` | Si (seguimiento) | No | Si | Solo soporte autorizado |
| `assigned_to_department` | Si (seguimiento) | Si (propio departamento) | Si | Solo soporte autorizado |
| `in_review` | Si (seguimiento) | Si (propio departamento) | Si | Solo soporte autorizado |
| `approved_by_department` | Si (seguimiento) | Si (propio departamento) | Si | Solo soporte autorizado |
| `rejected_by_department` | Si (seguimiento) | Si (propio departamento) | Si | Solo soporte autorizado |
| `awaiting_mayor_signature` | Si (seguimiento) | No | Si | Solo soporte autorizado |
| `returned_to_department` | Si (seguimiento) | Si (propio departamento) | Si | Solo soporte autorizado |
| `rejected_by_mayor_office` | Si (seguimiento) | Si (propio departamento) | Si | Solo soporte autorizado |
| `signed` | Si (seguimiento) | Si (propio departamento) | Si | Solo soporte autorizado |
| `closed` | Si (seguimiento) | Si (propio departamento) | Si | Solo soporte autorizado |

**Leyenda:** `Si` = visibilidad global o seguimiento autorizado; `Si (propio departamento)` = visibilidad limitada por `departmentId`; `Solo soporte autorizado` = requiere permiso expreso de soporte (fuera del MVP por defecto).

### Actores que pueden actuar sobre cada estado

| Estado | Secretaria | Personal Depto | Despacho | Administrador |
| --- | --- | --- | --- | --- |
| `received` | Crear, editar inicial, asignar departamento | No | No | No |
| `assigned_to_department` | No | Marcar vista, iniciar revision | No | No |
| `in_review` | No | Aprobar, rechazar, enviar al despacho | No | No |
| `approved_by_department` | Cerrar | No | No | No |
| `rejected_by_department` | Cerrar | No | No | No |
| `awaiting_mayor_signature` | No | No | Firmar, devolver, rechazar, reasignar | No |
| `returned_to_department` | No | Iniciar revision | No | No |
| `rejected_by_mayor_office` | Cerrar | No | No | No |
| `signed` | Cerrar | No | No | No |
| `closed` | Ninguna accion ordinaria | Ninguna accion ordinaria | Ninguna accion ordinaria | Ninguna accion ordinaria |

**Nota:** El actor responsable no obtiene automaticamente permiso para todas las salidas. Las acciones requieren validacion de permiso + estado + alcance. Ver `docs/sprint-03-permission-matrix.md` para la matriz completa.

---

## Validacion de consistencia

| Verificacion | Resultado |
| --- | --- |
| Todos los estados definidos en la Semana 1 estan representados | **Si**. Los 10 estados oficiales (`received`, `assigned_to_department`, `in_review`, `approved_by_department`, `rejected_by_department`, `awaiting_mayor_signature`, `returned_to_department`, `rejected_by_mayor_office`, `signed`, `closed`) estan documentados. |
| Estados duplicados | **Ninguno**. Cada codigo tecnico es unico. |
| Estados ambiguos | **Ninguno**. Cada estado tiene una descripcion inequivoca, actor responsable definido y condiciones de entrada y salida claras. |
| Estado terminal unico | **Si**. Solo `closed` es terminal. |
| Estados de resultado separados del cierre | **Si**. `approved_by_department`, `rejected_by_department`, `rejected_by_mayor_office` y `signed` son estados intermedios de resultado que preceden al cierre manual por Secretaria. |
| Devolucion diferenciada | **Si**. `returned_to_department` es un estado intermedio operativo distinto de `in_review`, que requiere reinicio formal de la revision. |

---

## Base para transiciones (Issue 3)

### Posibles estados origen y destino

| Estado origen | Estados destino posibles | Restricciones relevantes |
| --- | --- | --- |
| `received` | `assigned_to_department` | Requiere departamento activo, prioridad y fecha limite validas. |
| `assigned_to_department` | `in_review` | Solo personal autorizado del departamento asignado. |
| `in_review` | `approved_by_department`, `rejected_by_department`, `awaiting_mayor_signature` | Rechazar y enviar al despacho requieren motivo; no puede saltar a `closed`. |
| `approved_by_department` | `closed` | Cierre manual por Secretaria con permiso. |
| `rejected_by_department` | `closed` | Cierre manual por Secretaria con permiso. |
| `awaiting_mayor_signature` | `signed`, `returned_to_department`, `rejected_by_mayor_office`, `assigned_to_department` | Reasignacion solo mediante accion explicita; devolver, rechazar y firmar requieren motivo. |
| `returned_to_department` | `in_review` | Reinicio formal de revision; no puede decidir sin volver a `in_review`. |
| `rejected_by_mayor_office` | `closed` | Cierre manual por Secretaria con permiso. |
| `signed` | `closed` | Cierre manual por Secretaria con permiso. |
| `closed` | Ninguno | Estado terminal. Reapertura fuera del MVP. |

### Flujo funcional consolidado

```text
received
  -> assigned_to_department
      -> in_review
          -> approved_by_department
              -> closed
          -> rejected_by_department
              -> closed
          -> awaiting_mayor_signature
              -> signed
                  -> closed
              -> rejected_by_mayor_office
                  -> closed
              -> returned_to_department
                  -> in_review
              -> assigned_to_department
                  -> in_review
```

**Nota:** La matriz formal de transiciones, permisos, errores y contratos HTTP corresponde a la Issue 3. Este diagrama consolida los caminos funcionales aprobados en este catalogo.

---

## Decisiones funcionales resueltas

| Ambiguedad | Decision |
| --- | --- |
| Paso de `approved_by_department` a `closed` | Cierre manual por Secretaria despues de registrar la comunicacion o finalizacion administrativa. |
| Paso de `rejected_by_department` a `closed` | Cierre manual por Secretaria. |
| Paso de `signed` a `closed` | Cierre manual por Secretaria. |
| Paso de `rejected_by_mayor_office` a `closed` | Cierre manual por Secretaria. |
| Comportamiento posterior a `returned_to_department` | El departamento debe iniciar una nueva revision para volver a `in_review`. |
| Marcar como vista | Genera fecha y auditoria, pero no cambia estado. |
| Reasignacion desde el despacho | Cambia a `assigned_to_department` del nuevo departamento. |
| Estado terminal | Solo `closed` es terminal. |
| Reapertura | Fuera del MVP. |

---

## Criterios de intervencion del Despacho del Alcalde

Una solicitud pasa a `awaiting_mayor_signature` cuando, despues de la revision departamental, se cumple al menos una de estas condiciones:

- Requiere firma logica del alcalde o personal autorizado.
- La decision excede la competencia del departamento.
- Tiene impacto institucional, presupuestal, juridico o interdepartamental que exige decision superior.
- Una politica, categoria o regla administrativa exige revision del despacho.
- El departamento justifica una escalacion excepcional.

No requieren intervencion ordinaria:

- Solicitudes que el departamento puede aprobar dentro de su competencia.
- Solicitudes que el departamento puede rechazar de forma motivada.
- Correcciones administrativas previas a la revision.

---

## Decisiones pendientes de validacion externa

Las siguientes decisiones requieren confirmacion del cliente, profesor o lider funcional antes de implementar la maquina de estados:

1. Que categorias o reglas concretas obligan a intervenir al Despacho del Alcalde.
2. Donde se configura esa obligacion: categoria, solicitud, politica externa o decision manual autorizada.
3. Que evidencia representa la comunicacion al ciudadano antes del cierre.
4. Si existe un plazo maximo entre un estado de resultado y `closed`.
5. Si debe existir un permiso excepcional de cierre para el Despacho en caso de contingencia.
6. Si una solicitud aprobada por departamento necesita un documento de respuesta antes del cierre.

### Impacto de los pendientes

- Los diez estados y sus significados **no estan bloqueados**.
- El flujo principal puede utilizarse para disenar la matriz de transiciones de la Issue 3.
- No debe implementarse la regla automatica de escalamiento hasta resolver los puntos 1 y 2.
- El endpoint de cierre no debe congelar su DTO definitivo hasta resolver los puntos 3 y 6.

---

## Referencias

- `docs/sprint-03-official-states.md` — Documento tecnico completo del sprint con comportamientos esperados, decisiones funcionales detalladas y flujo diagramado.
- `docs/sprint-03-official-roles.md` — Definicion de actores, responsabilidades, restricciones y alcance de acceso.
- `docs/sprint-03-permission-matrix.md` — Matriz oficial de permisos por rol para validar quien puede actuar sobre cada estado.
- `docs/sprint-03-gap-analysis.md` — Analisis de brechas entre el backend actual y el flujo objetivo del Sprint 3.
- `docs/v3-5-2-consolidar-eventos-flujo-solicitudes.md` — Catalogo de eventos auditables asociados a cada transicion.

---

## Resultado esperado

Disponer de una definicion tecnica y funcional completa de todos los estados del sistema, permitiendo que las siguientes subissues disenen transiciones, permisos y auditoria sobre una base consistente y aprobada.

---

*Documento generado para la subissue V3-3.1. El detalle funcional completo de cada estado se encuentra en `docs/sprint-03-official-states.md`.*
