# Estados oficiales y decisiones funcionales del Sprint 3

## Proposito

Este documento define el catalogo oficial de estados del nuevo flujo de
solicitudes, el significado funcional de cada estado, el actor responsable y
su posicion dentro del ciclo de vida.

Tambien resuelve las ambiguedades necesarias para que las siguientes issues
puedan disenar:

- La matriz de transiciones.
- Los permisos asociados a cada accion.
- Los eventos de auditoria.
- Los contratos de la API.
- Los cambios del modelo de datos.

Este documento es funcional. No implementa la maquina de estados, endpoints,
permisos, auditoria, migraciones ni validaciones de flujo.

## Fuentes

- `docs/sprint-03-gap-analysis.md`.
- `docs/sprint-03-official-roles.md`.
- Plan de reorientacion funcional del sistema.
- Descripcion oficial de estados y flujo.
- Plan de trabajo de la Semana 1 del Sprint 3.
- Seeds actuales de `request_statuses`.
- Entidad y servicios actuales de solicitudes.

## Principios del catalogo

1. Toda solicitud inicia en `received`.
2. El cliente no puede seleccionar directamente el estado inicial.
3. Un estado representa una etapa persistente del proceso, no cualquier accion
   realizada sobre la solicitud.
4. Acciones como consultar, marcar como vista o agregar una observacion pueden
   generar auditoria sin crear un estado adicional.
5. Las transiciones deben ejecutarse mediante acciones funcionales explicitas.
6. No se permite cambiar un estado enviando un `statusId` arbitrario.
7. Toda transicion valida debe registrar auditoria en la misma transaccion.
8. El actor responsable de una etapa no obtiene automaticamente permiso para
   ejecutar todas las salidas posibles.
9. Una solicitud con resultado decidido no se considera administrativamente
   terminada hasta llegar a `closed`.
10. `closed` es el unico estado terminal del ciclo operativo.

## Clasificacion de estados

| Tipo | Significado |
| --- | --- |
| Inicial | Punto obligatorio de entrada al flujo. |
| Intermedio operativo | Etapa en la que un actor debe realizar trabajo o tomar una decision. |
| Intermedio de resultado | Registra el resultado de una decision antes del cierre administrativo. |
| Final o terminal | Finaliza el ciclo operativo y bloquea nuevas acciones ordinarias. |

## Catalogo resumido

| Estado | Etiqueta funcional | Tipo | Actor responsable |
| --- | --- | --- | --- |
| `received` | Recibida | Inicial y operativo | Secretaria |
| `assigned_to_department` | Asignada a departamento | Intermedio operativo | Personal de Departamento |
| `in_review` | En revision | Intermedio operativo | Personal de Departamento |
| `approved_by_department` | Aprobada por departamento | Intermedio de resultado | Secretaria para cierre |
| `rejected_by_department` | Rechazada por departamento | Intermedio de resultado | Secretaria para cierre |
| `awaiting_mayor_signature` | Pendiente de decision del despacho | Intermedio operativo | Despacho del Alcalde |
| `returned_to_department` | Devuelta al departamento | Intermedio operativo | Personal de Departamento |
| `rejected_by_mayor_office` | Rechazada por el despacho | Intermedio de resultado | Secretaria para cierre |
| `signed` | Firmada | Intermedio de resultado | Secretaria para cierre |
| `closed` | Cerrada | Final o terminal | Ninguno |

El actor responsable identifica quien debe atender la solicitud mientras se
encuentra en ese estado. No sustituye la validacion de permisos.

## received

### Significado

La solicitud fue registrada por Secretaria y existe oficialmente en el
sistema, pero todavia no ha sido delegada a un departamento responsable.

### Clasificacion

- Inicial.
- Operativo.

### Actor responsable

Secretaria.

### Condiciones de entrada

- Se registraron los datos minimos de la solicitud y del ciudadano.
- El backend genero el codigo de seguimiento.
- El backend identifico al usuario receptor.
- El estado fue asignado automaticamente.

### Comportamiento esperado

Mientras permanece en `received`, Secretaria puede completar o corregir los
datos iniciales permitidos, asociar documentos y preparar la delegacion.

La solicitud puede existir temporalmente sin departamento, prioridad definitiva
o fecha limite. Estos datos deben ser validos antes de asignarla formalmente.

### Salida esperada

La unica salida ordinaria es `assigned_to_department`, mediante una accion de
asignacion que exige:

- Departamento activo.
- Prioridad valida.
- Fecha limite valida.

### Restricciones

- El departamento no puede iniciar revision.
- No puede aprobarse, rechazarse, firmarse ni cerrarse.
- El cliente no puede sustituir este estado durante la creacion.

## assigned_to_department

### Significado

La solicitud fue delegada formalmente a un departamento responsable y esta
disponible para que su personal la consulte y comience el analisis.

### Clasificacion

Intermedio operativo.

### Actor responsable

Personal del departamento asignado.

### Condiciones de entrada

- La solicitud estaba en `received`, o fue reasignada por una accion superior
  que determine volver a esta etapa.
- Existe un departamento activo.
- La prioridad y la fecha limite estan definidas.
- Se registro la fecha de delegacion.
- Se genero el evento de asignacion o reasignacion.

### Comportamiento esperado

El departamento puede consultar la solicitud, revisar sus documentos y marcarla
como vista.

Marcar como vista:

- Registra `viewed_at` cuando corresponda.
- Genera un evento de auditoria.
- No cambia el estado.

### Salida esperada

Pasa a `in_review` cuando personal autorizado ejecuta la accion de iniciar
revision.

### Restricciones

- No puede decidirse una aprobacion, rechazo o escalamiento antes de iniciar
  formalmente la revision.
- Solo el departamento asociado puede operar la solicitud.

## in_review

### Significado

El departamento responsable inicio formalmente el analisis de la solicitud y
debe producir una decision departamental.

### Clasificacion

Intermedio operativo.

### Actor responsable

Personal del departamento asignado.

### Condiciones de entrada

- La solicitud estaba en `assigned_to_department` o
  `returned_to_department`.
- El usuario pertenece al departamento responsable.
- Se registro `review_started_at`.
- Se genero el evento `REVIEW_STARTED`.

### Comportamiento esperado

Durante la revision el departamento puede:

- Consultar documentos e historial autorizado.
- Agregar observaciones internas.
- Solicitar o registrar la informacion permitida por el contrato futuro.
- Preparar una decision.

### Salidas posibles

- `approved_by_department`: la solicitud es aprobada y no requiere
  intervencion del despacho.
- `rejected_by_department`: la solicitud es rechazada por el departamento.
- `awaiting_mayor_signature`: requiere decision o firma del Despacho del
  Alcalde.

### Restricciones

- Rechazar requiere un motivo.
- Enviar al despacho requiere justificar o identificar la causa de
  intervencion.
- No puede firmarse ni cerrarse directamente.
- Un usuario de otro departamento no puede decidir sobre la solicitud.

## approved_by_department

### Significado

El departamento concluyo favorablemente el analisis y determino que la
solicitud no necesita una decision ni firma del Despacho del Alcalde.

### Clasificacion

Intermedio de resultado.

### Actor responsable

Secretaria para comunicar o registrar el resultado y completar el cierre
administrativo.

### Condiciones de entrada

- La solicitud estaba en `in_review`.
- La decision fue tomada por personal autorizado del departamento.
- La solicitud no cumple un criterio de intervencion obligatoria del despacho.
- Se registro `decision_at`.
- Se generaron los eventos de aprobacion y cambio de estado definidos por la
  politica de auditoria.

### Comportamiento esperado

La decision departamental queda preservada como resultado visible y auditable.
Secretaria puede consultar el resultado, responder al ciudadano y preparar el
cierre.

### Salida esperada

Pasa a `closed` mediante una accion explicita de cierre administrativo.

### Decision funcional

`approved_by_department` no cambia automaticamente a `closed`.

Se mantiene como estado de resultado hasta que Secretaria confirme que el
resultado fue comunicado o que el expediente cumple las condiciones
administrativas de cierre. Esta separacion evita perder la diferencia entre
"aprobada" y "cerrada".

### Restricciones

- No puede enviarse posteriormente al despacho por el flujo ordinario.
- No puede volver a revision sin una reapertura, que queda fuera del MVP.

## rejected_by_department

### Significado

El departamento concluyo desfavorablemente el analisis y rechazo la solicitud.

### Clasificacion

Intermedio de resultado.

### Actor responsable

Secretaria para comunicar o registrar el resultado y completar el cierre
administrativo.

### Condiciones de entrada

- La solicitud estaba en `in_review`.
- La decision fue tomada por personal autorizado del departamento.
- Existe un motivo obligatorio de rechazo.
- Se registro `decision_at`.
- Se generaron los eventos correspondientes.

### Comportamiento esperado

El motivo y la decision quedan disponibles en la auditoria interna. La
informacion publica debe presentar un resultado adecuado sin exponer
observaciones confidenciales.

### Salida esperada

Pasa a `closed` mediante una accion explicita de cierre administrativo.

### Decision funcional

El rechazo departamental no cierra automaticamente la solicitud. Secretaria
debe completar el paso administrativo de comunicacion o registro de respuesta.

### Restricciones

- No puede enviarse al despacho despues del rechazo ordinario.
- No puede volver a revision sin una reapertura fuera del MVP.

## awaiting_mayor_signature

### Significado

El departamento completo su revision y envio la solicitud al Despacho del
Alcalde porque requiere decision superior, firma logica o una actuacion que
excede la competencia departamental.

Aunque el codigo menciona "signature", el estado representa la espera de una
decision del despacho y no garantiza que el resultado final sea una firma.

### Clasificacion

Intermedio operativo.

### Actor responsable

Despacho del Alcalde.

### Condiciones de entrada

- La solicitud estaba en `in_review`.
- El departamento autorizo el envio.
- Existe una causa de intervencion documentada.
- Se genero `SENT_TO_MAYOR_OFFICE`.

### Comportamiento esperado

El despacho puede revisar toda la solicitud, su historial y los documentos
necesarios. La visibilidad global no permite decidir sin el permiso
correspondiente.

### Salidas posibles

- `signed`: el despacho aprueba y realiza la firma logica.
- `returned_to_department`: requiere correccion, ampliacion o nueva revision.
- `rejected_by_mayor_office`: el despacho rechaza la solicitud.
- `assigned_to_department`: solo mediante reasignacion explicita a otro
  departamento.

### Restricciones

- No puede cerrarse sin registrar primero un resultado.
- Devolver, rechazar o reasignar exige motivo.
- La firma requiere identificar al usuario autorizado.

## returned_to_department

### Significado

El Despacho del Alcalde devolvio la solicitud al departamento responsable para
corregir, ampliar informacion o realizar una revision adicional.

### Clasificacion

Intermedio operativo.

### Actor responsable

Personal del departamento al que fue devuelta.

### Condiciones de entrada

- La solicitud estaba en `awaiting_mayor_signature`.
- El despacho registro un motivo obligatorio.
- Se genero `RETURNED_TO_DEPARTMENT`.

### Comportamiento esperado

La solicitud queda nuevamente bajo responsabilidad departamental. El motivo de
devolucion debe ser visible para el personal autorizado y conservarse en la
auditoria.

Marcarla como vista despues de la devolucion puede generar un nuevo evento,
pero no cambia el estado.

### Salida esperada

Pasa a `in_review` cuando el departamento reinicia formalmente la revision.

### Decision funcional

`returned_to_department` no vuelve automaticamente a `in_review`.

Se mantiene como etapa diferenciada hasta que el departamento reconozca la
devolucion e inicie una nueva revision. Al reiniciar:

- Se actualiza `review_started_at` con el nuevo ciclo o se registra el nuevo
  inicio en auditoria.
- Se conserva todo el historial anterior.
- La solicitud puede volver a aprobarse, rechazarse o enviarse al despacho.

### Restricciones

- El despacho no puede firmarla mientras siga devuelta.
- No puede cerrarse ni producir una nueva decision sin reiniciar la revision.

## rejected_by_mayor_office

### Significado

El Despacho del Alcalde rechazo la solicitud despues de revisar el expediente
escalado.

### Clasificacion

Intermedio de resultado.

### Actor responsable

Secretaria para comunicar o registrar el resultado y completar el cierre
administrativo.

### Condiciones de entrada

- La solicitud estaba en `awaiting_mayor_signature`.
- Un usuario autorizado del despacho tomo la decision.
- Existe un motivo obligatorio.
- Se registro `decision_at`.
- Se genero `REJECTED_BY_MAYOR_OFFICE`.

### Comportamiento esperado

La decision superior queda preservada antes del cierre. Secretaria puede
consultar el resultado para responder al ciudadano.

### Salida esperada

Pasa a `closed` mediante una accion explicita.

### Restricciones

- No vuelve al departamento mediante el flujo ordinario.
- No puede firmarse despues del rechazo.
- Una reapertura queda fuera del MVP.

## signed

### Significado

El Despacho del Alcalde aprobo la solicitud escalada y un usuario autorizado
realizo la firma logica.

### Clasificacion

Intermedio de resultado.

### Actor responsable

Secretaria para comunicar o registrar el resultado y completar el cierre
administrativo.

### Condiciones de entrada

- La solicitud estaba en `awaiting_mayor_signature`.
- El usuario tenia permiso explicito de firma.
- Se registro `signed_at`.
- Se registro `signed_by_id`.
- Se genero `SIGNED`.

### Comportamiento esperado

El sistema conserva la identidad del firmante y la fecha. La firma representa
una actuacion logica del MVP, no una integracion de firma digital certificada.

### Salida esperada

Pasa a `closed` mediante una accion explicita de cierre administrativo.

### Decision funcional

`signed` no cambia automaticamente a `closed`.

La firma es un resultado relevante que debe permanecer identificable hasta que
Secretaria complete la comunicacion o cierre del expediente.

### Restricciones

- No puede firmarse una segunda vez por el flujo ordinario.
- No puede volver a revision sin una reapertura fuera del MVP.

## closed

### Significado

La solicitud completo su ciclo operativo y administrativo. Existe un resultado
registrado y no quedan acciones ordinarias pendientes.

### Clasificacion

Final o terminal.

### Actor responsable

Ninguno. La solicitud permanece disponible para consulta y auditoria segun los
permisos aplicables.

### Condiciones de entrada

La solicitud debe estar en uno de estos estados de resultado:

- `approved_by_department`.
- `rejected_by_department`.
- `rejected_by_mayor_office`.
- `signed`.

Adicionalmente:

- El resultado debe estar completo.
- Los motivos obligatorios deben existir.
- La respuesta o comunicacion administrativa debe estar registrada segun el
  contrato que se defina.
- Un usuario de Secretaria con permiso de cierre ejecuta la accion.
- Se genera `CLOSED`.

### Comportamiento esperado

- Se conserva la consulta y auditoria.
- No se permiten cambios de prioridad, fecha, departamento o decision.
- No se permiten nuevas observaciones operativas ordinarias.
- El tracking publico muestra que el proceso termino y conserva el resultado
  publico permitido.

### Decision funcional

El cierre es manual y corresponde a Secretaria durante el MVP.

Esta decision separa:

- La autoridad que toma la decision.
- La responsabilidad de comunicar y cerrar administrativamente el expediente.

El Despacho del Alcalde no obtiene permiso de cierre automaticamente. La Issue
4 puede definir un permiso excepcional de contingencia sin cambiar al actor
responsable ordinario.

### Reapertura

La reapertura de solicitudes cerradas queda fuera del MVP.

Si se aprueba posteriormente, debe ser una accion explicita, altamente
restringida y auditada. No debe implementarse como cambio generico de estado.

## Comportamiento de acciones que no son estados

| Accion | Cambia estado | Efecto esperado |
| --- | --- | --- |
| Crear solicitud | Si | Crea en `received`. |
| Asociar documento | No | Registra documento y auditoria. |
| Cambiar prioridad | No | Actualiza valor y auditoria si el estado lo permite. |
| Definir o cambiar fecha limite | No | Actualiza valor y auditoria. |
| Marcar como vista | No | Registra `viewed_at` y `REQUEST_VIEWED`. |
| Agregar observacion interna | No | Registra `INTERNAL_OBSERVATION`. |
| Iniciar revision | Si | Cambia a `in_review`. |
| Reasignar departamento desde el despacho | Si | Cambia a `assigned_to_department`. |
| Cerrar | Si | Cambia desde un resultado valido a `closed`. |

## Flujo funcional consolidado

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

La matriz formal de transiciones, permisos y errores corresponde a la Issue 3.
Este diagrama solo consolida los caminos funcionales aprobados en esta
subissue.

## Criterios de intervencion del Despacho del Alcalde

Una solicitud pasa a `awaiting_mayor_signature` cuando, despues de la revision
departamental, se cumple al menos una de estas condiciones:

- Requiere firma logica del alcalde o personal autorizado.
- La decision excede la competencia del departamento.
- Tiene impacto institucional, presupuestal, juridico o interdepartamental que
  exige decision superior.
- Una politica, categoria o regla administrativa exige revision del despacho.
- El departamento justifica una escalacion excepcional.

No requieren intervencion ordinaria:

- Solicitudes que el departamento puede aprobar dentro de su competencia.
- Solicitudes que el departamento puede rechazar de forma motivada.
- Correcciones administrativas previas a la revision.

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

## Decisiones pendientes de validacion externa

Las siguientes decisiones requieren confirmacion del cliente, profesor o lider
funcional antes de implementar la maquina de estados:

1. Que categorias o reglas concretas obligan a intervenir al Despacho del
   Alcalde.
2. Donde se configura esa obligacion: categoria, solicitud, politica externa o
   decision manual autorizada.
3. Que evidencia representa la comunicacion al ciudadano antes del cierre.
4. Si existe un plazo maximo entre un estado de resultado y `closed`.
5. Si debe existir un permiso excepcional de cierre para el Despacho en caso de
   contingencia.
6. Si una solicitud aprobada por departamento necesita un documento de
   respuesta antes del cierre.

### Impacto de los pendientes

- Los diez estados y sus significados no estan bloqueados.
- El flujo principal puede utilizarse para disenar la matriz de transiciones.
- No debe implementarse la regla automatica de escalamiento hasta resolver los
  puntos 1 y 2.
- El endpoint de cierre no debe congelar su DTO definitivo hasta resolver los
  puntos 3 y 6.

## Estados heredados

| Estado actual | Tratamiento | Equivalencia o motivo |
| --- | --- | --- |
| `Pendiente` | Retirar mediante normalizacion | Puede corresponder a `received`, pero es ambiguo. |
| `En Proceso` | Retirar mediante normalizacion | Mezcla asignacion y revision. |
| `Resuelto` | Retirar mediante normalizacion | No distingue aprobacion, rechazo o firma. |
| `Cerrado` | Migrar a `closed` cuando corresponda | Debe normalizarse el codigo tecnico. |
| `received` | Conservar | Coincide con el catalogo oficial. |
| `in_review` | Conservar y corregir descripcion | No significa solamente usuario asignado. |
| `approved_by_officer` | Reemplazar | El estado oficial es `approved_by_department`. |
| `awaiting_mayor_signature` | Conservar | Su descripcion debe incluir decision del despacho. |
| `signed` | Conservar | Debe diferenciarse de `closed`. |

La estrategia de migracion y normalizacion corresponde a la Issue 2. No deben
modificarse migraciones ya ejecutadas sin una estrategia aprobada.

## Implicaciones para las siguientes issues

### Issue 2: modelo de datos

- Permitir `department_id` nulo en `received`.
- Incorporar las fechas operativas.
- Registrar `signed_by_id`.
- Normalizar estados heredados.
- Definir como registrar ciclos repetidos de revision.

### Issue 3: maquina de estados

- Convertir el flujo consolidado en una matriz formal.
- Asociar cada transicion con actor, permiso y condiciones.
- Rechazar saltos de estado.
- Centralizar reglas en un servicio transaccional.

### Issue 4: permisos

- Asignar permisos de acciones, no permisos para escoger estados.
- Reservar el cierre ordinario a Secretaria.
- Separar visibilidad global del despacho de la capacidad de firmar.
- Validar el departamento en las acciones departamentales.

### Issue 5: auditoria

- Definir eventos especificos por accion.
- Mantener valores anterior y nuevo.
- Registrar motivos obligatorios.
- Diferenciar acciones sin cambio de estado.

### Issue 6: contrato API

- Disenar endpoints de acciones explicitas.
- No exponer un cambio generico de `statusId`.
- Documentar errores por estado incompatible.
- Disenar el cierre con evidencia administrativa pendiente de confirmar.

## Fuera de alcance

- Implementar la maquina de estados.
- Implementar transiciones.
- Crear endpoints.
- Implementar permisos.
- Implementar auditoria.
- Crear o modificar migraciones.
- Modificar la base de datos.
- Cambiar seeds existentes.
- Implementar validaciones de flujo.

## Cobertura de criterios de aceptacion

- Los diez estados oficiales estan documentados.
- Cada estado tiene una descripcion inequivoca.
- Cada estado identifica un actor responsable.
- Se diferencian estados iniciales, intermedios operativos, intermedios de
  resultado y finales.
- Se documentaron condiciones de entrada, comportamiento, salidas y
  restricciones.
- Las reglas de cierre y devolucion fueron resueltas.
- Los criterios generales de intervencion del despacho estan definidos.
- Las decisiones que requieren validacion externa estan registradas con su
  impacto.
- La definicion esta lista para disenar la matriz de transiciones de la Issue
  3.
