# V3-3.5 Definir las reglas de cierre y estados terminales

## Metadatos

| Campo | Valor |
| --- | --- |
| **Revisor** | @Fradeh |
| **Tipo** | Diseno funcional |
| **Dependencias** | V3-3.1 — Documentar el catalogo tecnico de estados; V3-3.3 — Definir las transiciones del Departamento; V3-3.4 — Definir las transiciones del Despacho del Alcalde |
| **Fuentes** | `docs/sprint-03-official-states.md`, `docs/sprint-03-official-roles.md`, `docs/sprint-03-permission-matrix.md`, `docs/v3-3-1-documentar-catalogo-estados.md`, `docs/v3-3-2-definir-transiciones-secretaria.md`, `docs/v3-3-3-definir-transiciones-departamento.md`, `docs/v3-3-4-definir-transiciones-despacho-alcalde.md`, `docs/v3-4-2-matriz-permisos-secretaria.md`, `docs/v3-4-4-permisos-desapacho-alcalde.md` |

## Proposito

Este documento define formalmente cuales estados son considerados terminales dentro del nuevo flujo de solicitudes y establece las reglas que determinan cuando una solicitud puede considerarse completamente finalizada.

Resuelve las ambiguedades identificadas durante la semana 1 respecto al uso del estado `closed`, asi como el comportamiento esperado para solicitudes firmadas, rechazadas o finalizadas por otras vias.

El resultado permite garantizar que todas las solicitudes tengan un cierre consistente, auditable y compatible con los reportes futuros.

## Fuera de alcance

- Implementar logica de cierre.
- Implementar reapertura de solicitudes.
- Implementar endpoints.
- Implementar auditoria.
- Implementar permisos.
- Crear migraciones.
- Implementar servicios de transicion.
- Modificar controladores.
- Implementar logica de negocio.

---

## Criterios de aceptacion

- [x] Los estados terminales estan identificados.
- [x] El comportamiento de `closed` esta documentado.
- [x] Esta definido quien puede cerrar una solicitud.
- [x] Esta definido cuando una solicitud puede cerrarse.
- [x] Esta definido si el cierre es automatico o manual.
- [x] Se resolvio el comportamiento de `approved_by_department`.
- [x] Se resolvio el comportamiento de `signed`.
- [x] Se resolvio el comportamiento de `returned_to_department`.
- [x] Las transiciones prohibidas desde estados terminales estan documentadas.
- [x] Los eventos de auditoria asociados al cierre estan definidos.
- [x] Todas las rutas validas del flujo terminan en un estado claramente definido.

---

## 1. Definicion de estados terminales

### Estado terminal unico

**`closed` es el unico estado terminal del ciclo operativo.**

Esta es la regla oficial del catalogo de estados (`docs/v3-3-1-documentar-catalogo-estados.md`) y debe considerarse la fuente de verdad para la clasificacion de estados.

### Resolucion de discrepancias

Se identifico una inconsistencia en los documentos `v3-4-2-matriz-permisos-secretaria.md` y `v3-4-4-permisos-desapacho-alcalde.md`, donde los estados `rejected_by_department` y `rejected_by_mayor_office` fueron clasificados como "Terminal". Esta clasificacion es **incorrecta** segun el catalogo oficial de estados.

| Estado | Clasificacion correcta | Justificacion |
| --- | --- | --- |
| `received` | Inicial | Punto de entrada al flujo. |
| `assigned_to_department` | Intermedio operativo | El departamento debe actuar. |
| `in_review` | Intermedio operativo | El departamento debe decidir. |
| `approved_by_department` | **Intermedio de resultado** | Registra la decision pero requiere cierre administrativo. |
| `rejected_by_department` | **Intermedio de resultado** | Registra la decision pero requiere cierre administrativo. |
| `awaiting_mayor_signature` | Intermedio operativo | El Despacho debe decidir. |
| `returned_to_department` | Intermedio operativo | El departamento debe reiniciar revision. |
| `rejected_by_mayor_office` | **Intermedio de resultado** | Registra la decision pero requiere cierre administrativo. |
| `signed` | **Intermedio de resultado** | Registra la firma pero requiere cierre administrativo. |
| `closed` | **Final o terminal** | Finaliza el ciclo operativo y bloquea nuevas acciones ordinarias. |

### Diferencia entre estado de resultado y estado terminal

| Concepto | Definicion | Ejemplos |
| --- | --- | --- |
| **Estado de resultado** | Registra el resultado de una decision o actuacion importante, pero el ciclo administrativo aun no esta completo. | `approved_by_department`, `rejected_by_department`, `rejected_by_mayor_office`, `signed` |
| **Estado terminal** | Finaliza definitivamente el ciclo operativo y administrativo. No quedan acciones ordinarias pendientes. | `closed` |

**Regla clave:** Todo estado de resultado debe eventualmente transitar a `closed` para considerarse finalizado. Permanecer en un estado de resultado no equivale a estar cerrado.

---

## 2. Cierre operativo vs cierre administrativo

### Cierre operativo

El cierre operativo ocurre cuando una decision formal ha sido tomada sobre la solicitud:

- El departamento aprueba (`approved_by_department`).
- El departamento rechaza (`rejected_by_department`).
- El departamento envia al despacho (`awaiting_mayor_signature`).
- El Despacho firma (`signed`).
- El Despacho rechaza (`rejected_by_mayor_office`).

El cierre operativo **no termina el ciclo administrativo**. La solicitud aun requiere acciones de seguimiento, comunicacion al ciudadano y registro formal de finalizacion.

### Cierre administrativo

El cierre administrativo es la transicion al estado `closed`. Representa:

- El resultado ha sido comunicado o registrado formalmente.
- El expediente cumple las condiciones administrativas de cierre.
- No quedan acciones ordinarias pendientes.
- La solicitud esta disponible unicamente para consulta y auditoria.

### Separacion de responsabilidades

| Aspecto | Quien decide | Quien cierra |
| --- | --- | --- |
| Aprobacion departamental | Departamento | Secretaria |
| Rechazo departamental | Departamento | Secretaria |
| Firma del Despacho | Despacho | Secretaria (ordinario) / Despacho (contingencia) |
| Rechazo del Despacho | Despacho | Secretaria (ordinario) / Despacho (contingencia) |

Esta separacion evita confundir la autoridad que toma la decision con la responsabilidad de comunicar y cerrar administrativamente el expediente.

---

## 3. Comportamiento de `closed`

### Significado

La solicitud completo su ciclo operativo y administrativo. Existe un resultado registrado y no quedan acciones ordinarias pendientes.

### Actor responsable

**Ninguno.** La solicitud permanece disponible para consulta y auditoria segun los permisos aplicables.

### Comportamiento esperado

- Se conserva la consulta y auditoria.
- **No se permiten cambios** de prioridad, fecha, departamento o decision.
- **No se permiten nuevas observaciones operativas ordinarias.**
- El tracking publico muestra que el proceso termino y conserva el resultado publico permitido.
- No puede eliminarse ni archivarse fuera del sistema de auditoria.

### Condiciones de entrada

La solicitud debe estar en uno de estos estados de resultado:

- `approved_by_department`
- `rejected_by_department`
- `rejected_by_mayor_office`
- `signed`

Adicionalmente:

- El resultado debe estar completo.
- Los motivos obligatorios deben existir (si aplica).
- La respuesta o comunicacion administrativa debe estar registrada segun el contrato que se defina.
- Un usuario autorizado ejecuta la accion de cierre.
- Se genera el evento `REQUEST_CLOSED`.

### Condiciones de salida

**Ninguna.** `closed` es el estado terminal. No existe transicion ordinaria hacia otro estado.

---

## 4. Reglas de cierre

### Actor ordinario: Secretaria

| Aspecto | Regla |
| --- | --- |
| **Actor** | Secretaria (`SECRETARY`) con permiso `requests:close`. |
| **Modo** | **Manual** durante el MVP. |
| **Estados desde los cuales puede cerrar** | `approved_by_department`, `rejected_by_department`, `rejected_by_mayor_office`, `signed`. |
| **Requisitos** | Resultado completo, motivos obligatorios existentes, comunicacion registrada (segun contrato futuro). |

Secretaria es el actor responsable ordinario del cierre administrativo porque:

- Es el punto de contacto con el ciudadano.
- Debe confirmar que el resultado fue comunicado.
- Debe verificar que el expediente cumple las condiciones administrativas de cierre.

### Actor de contingencia: Despacho del Alcalde

| Aspecto | Regla |
| --- | --- |
| **Actor** | Despacho del Alcalde (`MAYOR_OFFICE`) con permiso `requests:close`. |
| **Modo** | **Manual** y restringido a contingencias. |
| **Estados desde los cuales puede cerrar** | `signed`, `rejected_by_mayor_office`. |
| **Requisitos** | Resultado completo, permiso explicito, estado compatible. |

El Despacho puede cerrar solicitudes cuando:

- La solicitud fue firmada o rechazada por el Despacho y requiere cierre inmediato.
- Existe una contingencia operativa que justifica el cierre desde el Despacho.
- Se aprueba una regla especial que asigne esta responsabilidad al Despacho.

**Nota:** El Despacho no obtiene permiso de cierre automaticamente como funcion ordinaria. El cierre desde el Despacho es una excepcion controlada.

### Actor excluido: Administrador

| Aspecto | Regla |
| --- | --- |
| **Actor** | Administrador (`ADMIN`) |
| **Puede cerrar** | **No.** El Administrador no tiene capacidad operativa sobre solicitudes. |
| **Justificacion** | El cierre es una accion operativa, no administrativa. El Administrador gestiona usuarios, roles y configuracion, no el flujo de solicitudes. |

### Actor excluido: Departamento

| Aspecto | Regla |
| --- | --- |
| **Actor** | Personal de Departamento (`DEPARTMENT_STAFF`) |
| **Puede cerrar** | **No.** El Departamento toma decisiones pero no cierra administrativamente. |
| **Justificacion** | La separacion de responsabilidades requiere que otro actor (Secretaria) verifique la comunicacion y complete el cierre. |

### Cierre automatico vs manual

| Tipo | Estado | Aplica en MVP | Justificacion |
| --- | --- | --- | --- |
| **Manual** | Todos los cierres | **Si** | Durante el MVP, todo cierre requiere una accion explicita de un usuario autorizado. |
| **Automatico** | Ninguno | **No** | No se implementa cierre automatico en el MVP para evitar cierres prematuros sin comunicacion al ciudadano. |

**Decision funcional:** El cierre es manual durante el MVP. Esta decision separa la autoridad que toma la decision de la responsabilidad de comunicar y cerrar administrativamente el expediente.

---

## 5. Estados desde los cuales se puede cerrar

### Estados de resultado validos para cierre

| Estado de resultado | Tipo de resultado | Actor que decidio | Actor que cierra (ordinario) | Actor que cierra (contingencia) |
| --- | --- | --- | --- | --- |
| `approved_by_department` | Aprobacion departamental | Departamento | Secretaria | No aplica |
| `rejected_by_department` | Rechazo departamental | Departamento | Secretaria | No aplica |
| `rejected_by_mayor_office` | Rechazo del Despacho | Despacho | Secretaria | Despacho |
| `signed` | Firma del Despacho | Despacho | Secretaria | Despacho |

### Estados desde los cuales NO se puede cerrar directamente

| Estado | Razon |
| --- | --- |
| `received` | No tiene departamento, prioridad ni resultado. |
| `assigned_to_department` | El departamento aun no inicia revision. |
| `in_review` | El departamento aun no decide. |
| `awaiting_mayor_signature` | El Despacho aun no decide. |
| `returned_to_department` | El departamento debe reiniciar revision. |

### Flujo completo de cierre

```text
Estado de resultado
  |
  +-- Secretaria verifica:
  |     +-- Resultado completo
  |     +-- Motivos existen (si aplica)
  |     +-- Comunicacion registrada (segun contrato)
  |
  +-- Secretaria ejecuta cierre
  |     +-- Transicion: [resultado] -> closed
  |     +-- Evento: REQUEST_CLOSED
  |     +-- Datos: previousStatus, newStatus, usuario, fecha
  |
  +-- Estado: closed (terminal)
```

---

## 6. Transiciones de cierre por actor

### Secretaria (cierre ordinario)

| Estado origen | Estado destino | Accion | Permiso | Evento |
| --- | --- | --- | --- | --- |
| `approved_by_department` | `closed` | Cerrar solicitud aprobada | `requests:close` | `REQUEST_CLOSED` |
| `rejected_by_department` | `closed` | Cerrar solicitud rechazada | `requests:close` | `REQUEST_CLOSED` |
| `rejected_by_mayor_office` | `closed` | Cerrar solicitud rechazada por Despacho | `requests:close` | `REQUEST_CLOSED` |
| `signed` | `closed` | Cerrar solicitud firmada | `requests:close` | `REQUEST_CLOSED` |

### Despacho del Alcalde (cierre de contingencia)

| Estado origen | Estado destino | Accion | Permiso | Evento | Condicion |
| --- | --- | --- | --- | --- | --- |
| `signed` | `closed` | Cerrar firma | `requests:close` | `REQUEST_CLOSED` | Contingencia o regla especial |
| `rejected_by_mayor_office` | `closed` | Cerrar rechazo propio | `requests:close` | `REQUEST_CLOSED` | Contingencia o regla especial |

**Restriccion:** El Despacho **no** puede cerrar `approved_by_department` ni `rejected_by_department` en el flujo ordinario. Esos resultados corresponden a Secretaria.

---

## 7. Resolucion de ambiguedades

### `approved_by_department`

| Ambiguedad | Resolucion |
| --- | --- |
| **Pasa automaticamente a `closed`?** | **No.** `approved_by_department` es un estado intermedio de resultado. Se mantiene hasta que Secretaria confirme que el resultado fue comunicado o que el expediente cumple las condiciones administrativas de cierre. |
| **Quien cierra?** | Secretaria (ordinario). Despacho no aplica. |
| **Puede volver a revision?** | **No** en el MVP. Reapertura fuera del alcance. |
| **Puede enviarse al despacho despues?** | **No** por el flujo ordinario. |

### `signed`

| Ambiguedad | Resolucion |
| --- | --- |
| **Pasa automaticamente a `closed`?** | **No.** `signed` es un estado intermedio de resultado. La firma es un resultado relevante que debe permanecer identificable hasta que Secretaria (o Despacho en contingencia) complete la comunicacion o cierre del expediente. |
| **Quien cierra?** | Secretaria (ordinario). Despacho (contingencia). |
| **Puede volver a revision?** | **No** en el MVP. |
| **Puede firmarse dos veces?** | **No** por el flujo ordinario. |

### `returned_to_department`

| Ambiguedad | Resolucion |
| --- | --- |
| **Es un estado terminal?** | **No.** `returned_to_department` es un estado intermedio operativo. El departamento debe reiniciar formalmente la revision. |
| **Pasa automaticamente a `in_review`?** | **No.** Se mantiene como etapa diferenciada hasta que el departamento reconozca la devolucion e inicie una nueva revision. |
| **Puede cerrarse desde aqui?** | **No.** El departamento debe volver a `in_review`, decidir y llegar a un estado de resultado antes del cierre. |
| **Que ocurre despues?** | El departamento reinicia revision (`-> in_review`), y desde ahi puede aprobar, rechazar o enviar al despacho nuevamente. |

---

## 8. Estados que reabren el flujo

### Reanudacion del flujo operativo (permitida)

| Transicion | Descripcion | Tipo |
| --- | --- | --- |
| `returned_to_department -> in_review` | El departamento reinicia revision tras devolucion del Despacho. | **Reanudacion del flujo** |

Esta transicion no es una "reapertura". Es una **reanudacion** del flujo operativo porque la solicitud nunca llego a un estado terminal ni a un estado de resultado final.

### Reapertura (fuera del MVP)

| Concepto | Estado | Aplica en MVP |
| --- | --- | --- |
| **Reapertura** | `closed -> cualquier estado` | **No** |
| **Reapertura** | Estado de resultado -> `in_review` | **No** |

**Regla:** La reapertura de solicitudes cerradas queda fuera del MVP. Si se aprueba posteriormente, debe ser una accion explicita, altamente restringida y auditada. No debe implementarse como cambio generico de estado.

---

## 9. Estados que terminan definitivamente el flujo

### Estados de resultado (ciclo operativo terminado, administrativo pendiente)

Estos estados registran una decision final pero **no terminan el ciclo administrativo**:

| Estado | Resultado | Requiere cierre administrativo |
| --- | --- | --- |
| `approved_by_department` | Aprobacion departamental | **Si** (Secretaria) |
| `rejected_by_department` | Rechazo departamental | **Si** (Secretaria) |
| `rejected_by_mayor_office` | Rechazo del Despacho | **Si** (Secretaria o Despacho) |
| `signed` | Firma del Despacho | **Si** (Secretaria o Despacho) |

Desde estos estados:
- No pueden iniciarse nuevas revisiones.
- No pueden tomarse nuevas decisiones.
- No pueden enviarse al despacho nuevamente.
- **Solo pueden transitar a `closed`.**

### Estado terminal (ciclo completamente terminado)

| Estado | Significado |
| --- | --- |
| `closed` | El ciclo operativo y administrativo estan completos. No quedan acciones ordinarias. |

Desde `closed`:
- No se permiten cambios de estado.
- No se permiten modificaciones.
- Solo consulta y auditoria.

---

## 10. Restricciones desde estados terminales

### Transiciones prohibidas desde `closed`

| Transicion prohibida | Razon |
| --- | --- |
| `closed -> received` | El flujo no puede reiniciarse desde el cierre. |
| `closed -> assigned_to_department` | No puede reasignarse una solicitud cerrada. |
| `closed -> in_review` | No puede volver a revision una solicitud cerrada. |
| `closed -> approved_by_department` | No puede aprobarse una solicitud cerrada. |
| `closed -> rejected_by_department` | No puede rechazarse una solicitud cerrada. |
| `closed -> awaiting_mayor_signature` | No puede escalarse una solicitud cerrada. |
| `closed -> returned_to_department` | No puede devolverse una solicitud cerrada. |
| `closed -> rejected_by_mayor_office` | No puede rechazarse desde el despacho una solicitud cerrada. |
| `closed -> signed` | No puede firmarse una solicitud cerrada. |
| `closed -> closed` | Redundante; ya esta cerrada. |

### Acciones prohibidas desde `closed`

| Accion prohibida | Razon |
| --- | --- |
| Editar datos | Los datos deben permanecer inmutables para auditoria. |
| Cambiar prioridad | La prioridad ya no tiene efecto operativo. |
| Cambiar fecha limite | La fecha limite ya no tiene efecto operativo. |
| Reasignar departamento | El departamento responsable ya no cambia. |
| Agregar observaciones operativas | Las observaciones operativas ordinarias estan bloqueadas. |
| Subir documentos operativos | Los documentos operativos nuevos no se asocian a solicitudes cerradas. |
| Aprobar, rechazar o firmar | La decision ya fue tomada y registrada. |
| Cerrar nuevamente | Ya esta cerrada. |

### Acciones permitidas desde `closed`

| Accion permitida | Actor | Justificacion |
| --- | --- | --- |
| Consultar solicitud | Segun permisos de lectura | La consulta historica es necesaria. |
| Consultar auditoria | Segun permisos de auditoria | La trazabilidad debe conservarse. |
| Tracking publico | Publico | El ciudadano debe poder verificar el estado final. |

---

## 11. Excepciones administrativas

### Reapertura (fuera del MVP)

| Aspecto | Regla |
| --- | --- |
| **Permitida en MVP** | **No.** |
| **Futura implementacion** | Si se aprueba, debe ser una accion explicita, altamente restringida y auditada. |
| **Como no hacerlo** | No debe implementarse como cambio generico de estado (`STATUS_CHANGED`). |
| **Requisitos futuros** | Permiso especial, motivo obligatorio, aprobacion de un superior, registro completo en auditoria. |

### Cierre de contingencia desde el Despacho

| Aspecto | Regla |
| --- | --- |
| **Permitida en MVP** | **Si**, pero restringida. |
| **Condicion** | La solicitud debe estar en `signed` o `rejected_by_mayor_office`. |
| **Permiso** | `requests:close` asignado a `MAYOR_OFFICE`. |
| **Justificacion** | Emergencias operativas, ausencia de Secretaria, o reglas especiales aprobadas. |

### Correcciones administrativas

| Aspecto | Regla |
| --- | --- |
| **Cambio de estado para correccion** | Solo mediante `STATUS_CHANGED` como accion excepcional y altamente restringida. |
| **Quien puede ejecutarla** | Solo Administrador o actor con permiso especial de correccion. |
| **Requisitos** | Motivo obligatorio, aprobacion documentada, registro completo en auditoria. |

---

## 12. Auditoria del cierre

### Evento de auditoria

| Evento | Codigo | Descripcion |
| --- | --- | --- |
| Cierre de solicitud | `REQUEST_CLOSED` | Se usa al finalizar el caso. Motivo recomendado si el cierre no deriva de una aprobacion natural. |

### Informacion minima a registrar

| Campo | Descripcion | Obligatorio |
| --- | --- | --- |
| `previous_status` | Estado anterior (debe ser un estado de resultado). | Si |
| `new_status` | `closed` | Si |
| `user_id` | Identificador del usuario que ejecuto el cierre. | Si |
| `closed_at` | Fecha y hora del cierre. | Si |
| `motivo` | Justificacion del cierre (recomendado si no deriva de aprobacion natural). | Recomendado |
| `observacion` | Detalles adicionales sobre el cierre. | Opcional |

### Regla de no duplicidad

- Si el cierre se ejecuta como accion ordinaria desde un estado de resultado, **no se debe registrar ademas** `STATUS_CHANGED`.
- `STATUS_CHANGED` solo se usa como respaldo para correcciones manuales fuera del flujo oficial.

### Informacion visible en el historial

El historial de auditoria debe mostrar:

- Estado anterior y nuevo.
- Usuario que ejecuto la accion.
- Fecha y hora.
- Motivo (si aplica).
- Observacion (si aplica).

El tracking publico solo debe mostrar que el proceso termino y conservar el resultado publico permitido, sin exponer datos internos ni observaciones confidenciales.

---

## 13. Compatibilidad con la matriz de permisos

### Permisos relacionados con el cierre

| Permiso | SECRETARY | DEPARTMENT_STAFF | MAYOR_OFFICE | ADMIN | Observacion |
|---|---|---|---|---|---|
| `requests:close` | **Si** (ordinario) | **No** | **Si** (contingencia) | **No** | Secretaria cierra ordinariamente; Despacho en contingencia. |

### Validacion de compatibilidad

| Criterio | Resultado |
| --- | --- |
| Actor ordinario tiene permiso | **Si**. `SECRETARY` tiene `requests:close` asignado en la matriz. |
| Actor de contingencia tiene permiso | **Si**. `MAYOR_OFFICE` tiene `requests:close` asignado en la matriz. |
| Actor excluido no tiene permiso | **Si**. `DEPARTMENT_STAFF` y `ADMIN` no tienen `requests:close`. |
| Alcance apropiado | **Si**. Secretaria cierra desde cualquier estado de resultado; Despacho solo desde `signed` y `rejected_by_mayor_office`. |

### Correccion de documentos previos

Los documentos `v3-4-2-matriz-permisos-secretaria.md` y `v3-4-4-permisos-desapacho-alcalde.md` clasifican incorrectamente `rejected_by_department` y `rejected_by_mayor_office` como "Terminal". Esta clasificacion debe corregirse para alinearse con este documento (V3-3.5) y con el catalogo oficial de estados (V3-3.1).

| Documento | Estado | Clasificacion incorrecta | Clasificacion correcta |
|---|---|---|---|
| `v3-4-2` | `rejected_by_department` | Terminal | Intermedio de resultado |
| `v3-4-2` | `rejected_by_mayor_office` | Terminal | Intermedio de resultado |
| `v3-4-4` | `rejected_by_department` | Terminal | Intermedio de resultado |
| `v3-4-4` | `rejected_by_mayor_office` | Terminal | Intermedio de resultado |

---

## 14. Flujo de cierre consolidado

```text
FLUJO COMPLETO DE CIERRE

Departamento decide:
  |
  +-- Aprobar
  |     +-- Estado: approved_by_department
  |     +-- Actor decisor: Departamento
  |     +-- Actor cierre: Secretaria (ordinario)
  |     +-- Transicion: approved_by_department -> closed
  |
  +-- Rechazar
  |     +-- Estado: rejected_by_department
  |     +-- Actor decisor: Departamento
  |     +-- Actor cierre: Secretaria (ordinario)
  |     +-- Transicion: rejected_by_department -> closed
  |
  +-- Enviar al Despacho
        +-- Estado: awaiting_mayor_signature
        +-- Actor: Departamento
        |
        +-- Despacho decide:
              |
              +-- Firmar
              |     +-- Estado: signed
              |     +-- Actor decisor: Despacho
              |     +-- Actor cierre: Secretaria (ordinario) / Despacho (contingencia)
              |     +-- Transicion: signed -> closed
              |
              +-- Rechazar
              |     +-- Estado: rejected_by_mayor_office
              |     +-- Actor decisor: Despacho
              |     +-- Actor cierre: Secretaria (ordinario) / Despacho (contingencia)
              |     +-- Transicion: rejected_by_mayor_office -> closed
              |
              +-- Devolver
                    +-- Estado: returned_to_department
                    +-- Actor: Despacho
                    +-- NOTA: NO se cierra desde aqui
                    |
                    +-- Departamento reinicia:
                          +-- Transicion: returned_to_department -> in_review
                          +-- (El ciclo vuelve a comenzar)

ESTADO TERMINAL UNICO: closed
  +-- No permite transiciones salientes
  +-- Solo consulta y auditoria
  +-- Reapertura fuera del MVP
```

---

## 15. Decisiones resueltas

| Decision | Resolucion |
| --- | --- |
| Estado terminal unico | `closed` es el unico estado terminal del ciclo operativo. |
| Cierre automatico vs manual | El cierre es **manual** durante el MVP. |
| Actor ordinario de cierre | **Secretaria** con permiso `requests:close`. |
| Actor de contingencia | **Despacho del Alcalde** con permiso `requests:close`, solo desde `signed` o `rejected_by_mayor_office`. |
| `approved_by_department` | No cambia automaticamente a `closed`. Requiere cierre manual por Secretaria. |
| `signed` | No cambia automaticamente a `closed`. Requiere cierre manual. |
| `returned_to_department` | No es terminal. El departamento debe reiniciar revision (`-> in_review`). |
| Reapertura | Fuera del MVP. |
| Reanudacion desde devolucion | Permitida (`returned_to_department -> in_review`). |

---

## 16. Decisiones pendientes de validacion externa

| Punto | Impacto en el cierre |
| --- | --- |
| **Que evidencia representa la comunicacion al ciudadano antes del cierre** | Define si Secretaria necesita registrar un documento o respuesta especifica antes de ejecutar `REQUEST_CLOSED`. |
| **Si una solicitud aprobada por departamento necesita un documento de respuesta antes del cierre** | Afecta los datos que Secretaria debe completar antes de cerrar. |
| **Si existe un plazo maximo entre estado de resultado y `closed`** | Define si Secretaria tiene un tiempo limite para completar el cierre administrativo. |
| **Si debe existir un permiso excepcional de cierre para el Despacho en caso de contingencia** | Define las condiciones exactas bajo las cuales el Despacho puede cerrar solicitudes. |
| **Formato de la reapertura futura** | Si se aprueba post-MVP, define si requiere permiso especial, aprobacion superior o proceso de apelacion. |

---

## 17. Referencias

- `docs/v3-3-1-documentar-catalogo-estados.md` — Catalogo tecnico de los 10 estados oficiales y clasificacion por tipo.
- `docs/v3-3-2-definir-transiciones-secretaria.md` — Transiciones de Secretaria (incluye cierre ordinario).
- `docs/v3-3-3-definir-transiciones-departamento.md` — Transiciones del Departamento (estados de resultado departamentales).
- `docs/v3-3-4-definir-transiciones-despacho-alcalde.md` — Transiciones del Despacho (incluye cierre de contingencia).
- `docs/sprint-03-official-states.md` — Comportamiento detallado de `closed` y estados de resultado.
- `docs/sprint-03-official-roles.md` — Responsabilidades y restricciones de cada actor.
- `docs/sprint-03-permission-matrix.md` — Matriz oficial de permisos (`requests:close`).
- `docs/v3-4-2-matriz-permisos-secretaria.md` — Matriz de permisos de Secretaria (requiere correccion de clasificacion de estados).
- `docs/v3-4-4-permisos-desapacho-alcalde.md` — Matriz de permisos del Despacho (requiere correccion de clasificacion de estados).

---

## Resultado esperado

Disponer de una definicion unica y consistente para el cierre de solicitudes, eliminando ambiguedades sobre estados terminales y garantizando que todas las rutas del flujo finalicen de forma controlada, auditable y compatible con los requisitos funcionales del Sprint 3.

---

*Documento generado para la subissue V3-3.5. Este documento es la fuente oficial para la clasificacion de estados terminales y corrige las inconsistencias identificadas en `v3-4-2` y `v3-4-4`.*
