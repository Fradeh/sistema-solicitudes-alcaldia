# V3-4.6 Contrato técnico de autorización — Sprint 3

## Propósito

Este documento define el contrato técnico que utilizará el backend para validar
permisos, roles y alcance departamental antes de permitir la ejecución de
acciones protegidas.

Define cómo interactuarán los futuros guards, decoradores y servicios de
autorización, garantizando que las validaciones de acceso se realicen de forma
consistente y centralizada, sin lógica de autorización distribuida en
controladores o servicios de negocio.

Este documento es técnico. No implementa guards, decoradores, lógica de
autorización, migraciones ni cambios en endpoints.

## Fuentes

- `docs/sprint-03-permission-matrix.md` — Catálogo de 24 permisos y matriz
  rol-permiso.
- `docs/sprint-03-official-roles.md` — Responsabilidades y restricciones de
  cada actor.
- `docs/sprint-03-official-states.md` — Catálogo de estados y reglas de
  transición.
- `docs/v3-4-2-matriz-permisos-secretaria.md` — Permisos de Secretaría.
- `docs/v3-4-3-permisos-departamento.md` — Permisos del Departamento.
- `docs/v3-4-4-permisos-desapacho-alcalde.md` — Permisos del Despacho.
- `docs/v3-4-5-permisos-administrativos.md` — Permisos del Administrador.
- `docs/v3-5-1-catalogo-eventos-auditables.md` — Eventos de auditoría.
- `docs/v3-5-3-catalogo-eventos-administrativos.md` — Eventos administrativos.
- `backend/src/auth/` — Código actual: guards, decoradores, estrategia JWT,
  roles y servicios.

## Arquitectura actual (diagnóstico)

### Componentes existentes

| Componente | Archivo | Propósito |
|---|---|---|
| `JwtStrategy` | `auth/strategies/jwt.strategy.ts` | Extrae y valida JWT, inyecta `{ userId, email, role }` en `request.user` |
| `JwtAuthGuard` | `auth/guards/jwt-auth.guard.ts` | Extiende `AuthGuard('jwt')`, verifica que el token sea válido |
| `Roles` | `auth/roles/roles.decorator.ts` | Decorador `@Roles(...)` que fija metadatos con `SetMetadata(ROLES_KEY, roles)` |
| `RolesGuard` | `auth/roles/roles.guard.ts` | Lee `@Roles` del handler/class, normaliza el rol del usuario y lo compara |
| `normalizeRoleName` | `auth/roles/role-normalizer.ts` | Normaliza alias (español/inglés, mayúsculas/minúsculas) a `AppRole` |
| `AppRole` | `auth/roles/app-role.enum.ts` | Enum con `RECEPTIONIST`, `OFFICER`, `SUPERVISOR`, `ADMIN`, `MAYOR` |
| `JwtPayload` | `auth/interfaces/jwt-payload.interface.ts` | Interfaz con `sub`, `email`, `role` |
| `assertOfficerCanAccess` | `requests/requests.service.ts` | Validación inline: solo OFFICER puede acceder a sus solicitudes asignadas |

### Problemas identificados

1. **Autorización distribuida**: `assertOfficerCanAccess` está hardcodeada en
   `RequestsService`, no es reutilizable ni extensible a otros roles.
2. **JWT sin permisos**: El payload solo contiene `role` como string, sin
   permisos, `departmentId` ni `userId` estructurado.
3. **Roles heredados**: Los roles actuales (`RECEPTIONIST`, `OFFICER`,
   `SUPERVISOR`) no coinciden con los actores del Sprint 3 (`SECRETARY`,
   `DEPARTMENT_STAFF`, `MAYOR_OFFICE`, `ADMIN`).
4. **Sin permisos persistentes**: No existe tabla `permissions` ni
   `role_permissions`. El `RolesGuard` solo compara el nombre del rol, no
   permisos individuales.
5. **Sin validación de alcance**: No existe un mecanismo centralizado para
   validar `departmentId`, visibilidad global o alcance administrativo.
6. **Sin servicio de autorización**: No hay un servicio inyectable que los
   guards o servicios de negocio puedan consultar.

## Flujo de autorización objetivo

### Orden de validación

```
1. Autenticación (JWT)
   ↓ válido
2. Usuario activo
   ↓ activo
3. Rol activo y válido
   ↓ válido
4. Permiso requerido
   ↓ concedido
5. Alcance (departamental, global, administrativo)
   ↓ autorizado
6. Estado compatible (solo para acciones sobre solicitudes)
   ↓ compatible
7. Datos obligatorios presentes
   ↓ completos
8. Registro de auditoría
```

### Pseudocódigo del flujo

```
function authorize(context, requiredPermission):
    # 1. Autenticación
    if not context.isAuthenticated():
        return unauthorized("Authentication required")

    # 2. Usuario activo
    if not context.user.isActive:
        return unauthorized("User is inactive")

    # 3. Rol activo y válido
    if not context.user.role or not isValidRole(context.user.role):
        return forbidden("Invalid role")

    # 4. Permiso requerido
    if not hasPermission(context.user.role, requiredPermission):
        return forbidden("Permission denied")

    # 5. Alcance
    if requiredPermission.hasScope():
        scopeResult = validateScope(context, requiredPermission)
        if not scopeResult.allowed:
            return forbidden(scopeResult.reason)

    # 6. Estado compatible (solicitudes)
    if requiredPermission.isStateDependent():
        if not isValidTransition(requiredResource, requiredPermission):
            return conflict("Invalid transition for current state")

    # 7. Datos obligatorios
    if requiredPermission.requiresMandatoryData():
        if not hasMandatoryData(requiredResource, requiredPermission):
            return badRequest("Missing required data")

    # 8. Auditoría (la ejecuta el servicio después de la acción)
    return authorized()
```

## Contrato de autorización

### AuthorizationContext

Parámetros mínimos necesarios para validar cualquier acción protegida:

| Campo | Tipo | Origen | Descripción |
|---|---|---|---|
| `userId` | `string` (UUID) | JWT (`sub`) | Identificador del usuario autenticado |
| `email` | `string` | JWT (`email`) | Email del usuario autenticado |
| `role` | `AppRole` | JWT (mapeado) | Rol del usuario, normalizado contra el catálogo oficial |
| `departmentId` | `string` (UUID) o `null` | JWT o consulta BD | ID del departamento del usuario (si aplica) |
| `isActive` | `boolean` | Consulta BD | Estado activo del usuario en el momento de la solicitud |
| `permissions` | `string[]` | Consulta BD o JWT | Lista de códigos de permiso que tiene el rol del usuario |
| `resourceId` | `string` (UUID) o `null` | Parámetro de ruta | ID del recurso solicitado (ej. requestId) |
| `resourceType` | `string` | Contexto de la ruta | Tipo de recurso: `request`, `user`, `department`, `role` |
| `requiredPermission` | `string` | Decorador o metadata | Código del permiso requerido (ej. `users:create`) |

### AuthorizationResult

Respuesta estructurada de toda validación:

```typescript
interface AuthorizationResult {
  allowed: boolean;
  statusCode: number;
  errorCode: string;
  message: string;
  details?: Record<string, any>;
}
```

### AuthorizationService

Interfaz del servicio central de autorización:

```typescript
interface AuthorizationService {
  // Valida que el usuario tenga un permiso específico
  checkPermission(context: AuthorizationContext, permission: string): AuthorizationResult;

  // Valida alcance departamental (request.departmentId === user.departmentId)
  validateDepartmentScope(context: AuthorizationContext, requestDepartmentId: string): AuthorizationResult;

  // Valida que el rol activo del usuario sea uno de los permitidos
  validateRole(context: AuthorizationContext, allowedRoles: AppRole[]): AuthorizationResult;

  // Valida que el usuario esté activo
  validateActiveUser(context: AuthorizationContext): AuthorizationResult;

  // Ejecuta el flujo completo de autorización
  authorize(context: AuthorizationContext, permission: string): AuthorizationResult;
}
```

### AuthorizationGuard

Guard genérico que reemplazará a `RolesGuard`:

```typescript
// Uso: @UseGuards(AuthorizationGuard)
// @RequirePermission('users:create')
@Injectable()
class AuthorizationGuard implements CanActivate {
  constructor(
    private authorizationService: AuthorizationService,
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const permission = this.reflector.get<string>(
      PERMISSION_KEY,
      context.getHandler(),
    );

    if (!permission) return true; // Sin permiso requerido

    const request = context.switchToHttp().getRequest();
    const authContext = this.buildContext(request);

    const result = this.authorizationService.authorize(authContext, permission);

    if (!result.allowed) {
      throw new HttpException(result.message, result.statusCode);
    }

    return true;
  }
}
```

## Decoradores

### @RequirePermission

Reemplaza a `@Roles`. Declara el permiso necesario para ejecutar un endpoint.

```typescript
// Uso
@RequirePermission('users:create')
@Post()
async createUser(@Body() dto: CreateUserDto) { ... }

// Definición
@SetMetadata(PERMISSION_KEY, 'users:create')
const RequirePermission = (permission: string) => SetMetadata(PERMISSION_KEY, permission);
```

### @RequirePermissions (múltiples)

Para endpoints que requieren uno de varios permisos alternativos:

```typescript
// Uso: cualquier permiso de la lista autoriza
@RequirePermissions(['users:update', 'users:assign_role'])
@Patch(':id')
async updateUser(@Param('id') id: string, @Body() dto: any) { ... }
```

### @DepartmentScope

Marca un endpoint para validación de alcance departamental:

```typescript
// Uso: valida que request.departmentId === user.departmentId
@DepartmentScope()
@Patch(':id/approve')
async approveRequest(@Param('id') id: string) { ... }
```

### Tabla de decoradores propuestos

| Decorador | Destino | Propósito |
|---|---|---|
| `@RequirePermission(code)` | Handler | Declara el permiso técnico requerido |
| `@RequirePermissions([...])` | Handler | Declara lista de permisos alternativos |
| `@DepartmentScope()` | Handler | Activa validación de alcance departamental |
| `@AdminScope()` | Handler | Activa validación de alcance administrativo |
| `@GlobalScope()` | Handler | Activa validación de alcance global (MAYOR_OFFICE) |
| `@SecretaryScope()` | Handler | Activa validación específica para Secretaría |

## Validación de alcance

### Reglas por tipo de alcance

#### Alcance departamental (DEPARTMENT_STAFF)

```
if user.role != DEPARTMENT_STAFF -> saltar validación
if user.departmentId == null -> DENEGAR (DEPARTMENT_REQUIRED)
if request.departmentId == null -> DENEGAR (REQUEST_HAS_NO_DEPARTMENT)
if user.departmentId != request.departmentId -> DENEGAR (OUT_OF_DEPARTMENT_SCOPE)
if department.isActive == false -> DENEGAR (INACTIVE_DEPARTMENT)
-> AUTORIZAR
```

#### Alcance administrativo (ADMIN)

```
if user.role != ADMIN -> saltar validación
-> AUTORIZAR (restringido a recursos de configuración)
```

La restricción a recursos de configuración se logra mediante los permisos
asignados a ADMIN (P20–P30), no mediante una validación de alcance adicional.
Si ADMIN intenta acceder a un recurso operativo, el permiso correspondiente
(`requests:*`) no estará asignado y la validación de permiso fallará.

#### Alcance global (MAYOR_OFFICE)

```
if user.role != MAYOR_OFFICE -> saltar validación
-> AUTORIZAR (sin restricción de departamento)
```

La visibilidad global permite consultar cualquier solicitud, pero las acciones
operativas (firmar, devolver, rechazar) siguen requiriendo el permiso
específico y un estado compatible.

#### Alcance de Secretaría (SECRETARY)

```
if user.role != SECRETARY -> saltar validación
if accion == edicion && user.id != request.receivedById -> restringir
  (Secretaria solo edita solicitudes que ella misma registró, salvo seguimiento)
-> AUTORIZAR con restricciones según matriz permiso-estado
```

Secretaría tiene visibilidad global para seguimiento pero no puede ejecutar
acciones operativas (aprobar, rechazar, firmar). Las restricciones de edición
por estado están definidas en la matriz de permisos de Secretaría.

### Alcance propio

Para acciones que requieren validación contra el recurso asignado al usuario:

```
if user.role no requiere alcance propio -> saltar validación
if resource.userAssignedId != null && resource.userAssignedId != user.userId
  -> DENEGAR (RESOURCE_NOT_ASSIGNED_TO_USER)
-> AUTORIZAR
```

Este alcance aplica cuando una regla funcional específica lo requiera, no como
validación predeterminada.

## Integración con RequestTransitionService

El `RequestTransitionService` (Issue 3) debe delegar la autorización al
`AuthorizationService` en lugar de implementar sus propias validaciones.

### Flujo integrado

```
POST /requests/:id/approve
  → AuthorizationGuard(@RequirePermission('requests:approve_department'))
      → AuthorizationService.authorize(context, 'requests:approve_department')
          → checkPermission: DEPARTMENT_STAFF tiene el permiso
          → validateDepartmentScope: request.departmentId == user.departmentId
          → ok
  → RequestTransitionService.approve(requestId, user)
      → validateState(request.status, 'in_review')  // máquina de estados
      → validateMandatoryData(request)
      → executeTransition(request, 'approved_by_department')
      → AuditService.register('REQUEST_DEPARTMENT_APPROVED', ...)
```

### Responsabilidades

| Componente | Valida |
|---|---|
| `AuthorizationGuard` + `AuthorizationService` | Autenticación, permiso, alcance |
| `RequestTransitionService` | Estado origen, estado destino, datos obligatorios |
| `AuditService` (Issue 5) | Registrar evento después de la transición |

El `AuthorizationService` nunca valida estados de solicitud. El
`RequestTransitionService` nunca valida permisos o alcance. Ambas
responsabilidades están separadas.

## Integración con guards

### Orden de guards en un endpoint

```typescript
@UseGuards(JwtAuthGuard, AuthorizationGuard)
@RequirePermission('users:create')
@Post()
async createUser(@Body() dto: CreateUserDto) { ... }
```

1. `JwtAuthGuard` — Valida el token JWT, popula `request.user`.
2. `AuthorizationGuard` — Construye el `AuthorizationContext` desde
   `request.user`, consulta permisos y alcance, ejecuta el flujo completo.

### AuthorizationContext building

El `AuthorizationGuard` debe construir el contexto completo antes de validar:

```
request.user = { userId, email, role }  // del JWT (JwtStrategy)

AuthorizationGuard.buildContext(request):
  userId = request.user.userId
  email = request.user.email
  role = normalizeRole(request.user.role)
  departmentId = fetchDepartmentId(userId)  // consulta BD o JWT extendido
  isActive = fetchIsActive(userId)          // consulta BD
  permissions = fetchPermissions(role)      // consulta BD de role_permissions
  resourceId = request.params.requestId || request.params.userId || null
  resourceType = inferResourceType(request.route.path)
  requiredPermission = reflector.get(PERMISSION_KEY, handler)
```

### Optimización JWT

Para evitar consultas BD en cada petición, el JWT puede extenderse para
incluir campos adicionales:

```typescript
interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  departmentId?: string;
  isActive?: boolean;
}
```

Esto permite que el `AuthorizationGuard` construya el contexto sin consultas
BD adicionales para los campos básicos. Sin embargo, los permisos deben
consultarse de la tabla `role_permissions` porque pueden cambiar durante la
sesión.

### Cache de permisos

Para reducir consultas BD repetitivas, el `AuthorizationService` puede
implementar un caché en memoria (ej. `Map<string, string[]>`) con
invalidación por tiempo (TTL) o por evento de cambio de permisos.

```
fetchPermissions(role):
  if cache.has(role):
    return cache.get(role)
  permissions = db.query('SELECT p.code FROM permissions p
                          JOIN role_permissions rp ON rp.permission_id = p.id
                          WHERE rp.role_id = :roleId', { roleId })
  cache.set(role, permissions, TTL=300)
  return permissions
```

## Integración con auditoría

La autorización no registra eventos de auditoría directamente. El registro de
auditoría ocurre después de que la acción se ejecuta exitosamente, en el
servicio de negocio o en el `RequestTransitionService`.

```
Autorización (pre-acción):  AuthorizationService.authorize()
  → solo valida, no registra nada

Ejecución (acción):         Service.execute()
  → persiste el cambio

Auditoría (post-acción):    AuditService.register()
  → registra el evento con actor, acción, valores anterior/nuevo
```

### Excepción: eventos de seguridad

Los intentos de acceso denegado pueden registrarse como eventos de seguridad:

| Evento | Cuándo se registra |
|---|---|
| `ACCESS_DENIED_PERMISSION` | Usuario autenticado sin permiso requerido |
| `ACCESS_DENIED_SCOPE` | Usuario autenticado fuera de alcance |
| `ACCESS_DENIED_INACTIVE` | Usuario inactivo intenta acceder |

Estos eventos son opcionales y pueden implementarse en una fase posterior.

## Respuestas de autorización

### Códigos HTTP y mensajes estandarizados

| Escenario | Código HTTP | errorCode | Mensaje |
|---|---|---|---|
| Acceso autorizado | 200/201 | `OK` | (depende del endpoint) |
| Token inválido o expirado | 401 | `UNAUTHORIZED` | `Token inválido o expirado` |
| Usuario inactivo | 401 | `USER_INACTIVE` | `El usuario no está activo` |
| Rol inválido o no reconocido | 403 | `INVALID_ROLE` | `El rol del usuario no es válido para esta acción` |
| Permiso denegado | 403 | `PERMISSION_DENIED` | `No tienes permiso para realizar esta acción` |
| Fuera de alcance departamental | 403 | `OUT_OF_DEPARTMENT_SCOPE` | `La solicitud no pertenece a tu departamento` |
| Departamento requerido | 403 | `DEPARTMENT_REQUIRED` | `El usuario requiere un departamento activo` |
| Departamento inactivo | 403 | `INACTIVE_DEPARTMENT` | `El departamento del usuario no está activo` |
| Solicitud sin departamento | 403 | `REQUEST_HAS_NO_DEPARTMENT` | `La solicitud no tiene un departamento asignado` |
| Estado incompatible | 409 | `INVALID_TRANSITION` | `La acción no está permitida en el estado actual de la solicitud` |
| Datos obligatorios ausentes | 400 | `MISSING_REQUIRED_DATA` | `Faltan datos obligatorios para completar la acción` |
| Acción de soporte no autorizada | 403 | `SUPPORT_ACCESS_NOT_AUTHORIZED` | `El acceso de soporte no está autorizado` |

### Formato de respuesta de error

```json
{
  "success": false,
  "statusCode": 403,
  "errorCode": "PERMISSION_DENIED",
  "message": "No tienes permiso para realizar esta acción",
  "timestamp": "2026-06-14T12:00:00.000Z",
  "path": "/api/v1/requests/123/approve"
}
```

## Implementación del modelo de permisos

### Tablas requeridas (Issue 2.4)

```
permissions
  id            UUID (PK)
  code          VARCHAR(50) UNIQUE   -- ej: "users:create"
  description   VARCHAR(255)
  domain        VARCHAR(50)          -- ej: "users", "requests", "departments"
  created_at    TIMESTAMP

role_permissions
  role_id       UUID (FK → roles.id)
  permission_id UUID (FK → permissions.id)
  created_at    TIMESTAMP
  PK (role_id, permission_id)

user_roles
  user_id       UUID (FK → users.id)
  role_id       UUID (FK → roles.id)
  created_at    TIMESTAMP
  PK (user_id, role_id)  -- MVP: solo un rol por usuario
```

### Seeds requeridos

Los seeds deben poblar:

1. La tabla `permissions` con los códigos del catálogo (P1–P30).
2. La tabla `role_permissions` según la matriz rol-permiso.
3. La tabla `roles` con los códigos oficiales del Sprint 3 (`SECRETARY`,
   `DEPARTMENT_STAFF`, `MAYOR_OFFICE`, `ADMIN`).

## Integración con el código actual

### Migración de RolesGuard a AuthorizationGuard

| Paso | Acción | Impacto |
|---|---|---|
| 1 | Crear tabla `permissions` y `role_permissions` | Issue 2.4 |
| 2 | Crear `AuthorizationService` con interfaz definida | Este documento |
| 3 | Crear `AuthorizationGuard` que use `AuthorizationService` | Este documento |
| 4 | Crear decoradores `@RequirePermission`, `@DepartmentScope`, etc. | Este documento |
| 5 | Reemplazar `@Roles(AppRole.X)` por `@RequirePermission('x:y')` en controladores | Barrido en todos los controladores |
| 6 | Reemplazar `RolesGuard` por `AuthorizationGuard` en `@UseGuards` | Barrido en todos los controladores |
| 7 | Eliminar `assertOfficerCanAccess` de `RequestsService` | Reemplazar por validación en `AuthorizationGuard` |
| 8 | Extender `JwtPayload` con `departmentId` y `isActive` (opcional) | Mejora de performance |
| 9 | Implementar `normalizeRoleName` para los nuevos roles | Actualizar alias |
| 10 | Eliminar `RolesGuard` y `@Roles` cuando no haya dependencias | Limpieza |

### Compatibilidad durante migración

`RolesGuard` y `AuthorizationGuard` pueden coexistir temporalmente. Los
endpoints migrados usan `AuthorizationGuard`, los no migrados siguen usando
`RolesGuard`. Esto permite una migración progresiva sin bloquear el desarrollo.

## Reglas de consistencia

1. Todo permiso debe estar registrado en la tabla `permissions` antes de
   usarse en un decorador.
2. Todo endpoint protegido debe declarar el permiso requerido mediante
   `@RequirePermission`.
3. Ningún controlador o servicio debe implementar validaciones de permiso
   manuales (comparaciones de rol, consultas de permisos, etc.).
4. Ningún servicio de negocio debe implementar validaciones de alcance
   departamental.
5. La validación de estado de solicitud es responsabilidad exclusiva del
   `RequestTransitionService`.
6. El `AuthorizationService` no debe conocer estados de solicitud, reglas de
   transición ni lógica de negocio.
7. Los errores de autorización deben usar los códigos estandarizados de este
   documento.

## Cobertura de criterios de aceptación

- [x] Existe un flujo documentado para validar permisos (flujo de autorización
      objetivo, pasos 1–8).
- [x] Existe un flujo documentado para validar alcance (reglas por tipo de
      alcance: departamental, administrativo, global, Secretaría, propio).
- [x] El contrato técnico está definido (`AuthorizationContext`,
      `AuthorizationResult`, `AuthorizationService`).
- [x] Los parámetros mínimos de validación están documentados (9 campos en
      `AuthorizationContext`).
- [x] Las reglas departamentales están documentadas (alcance departamental con
      5 condiciones).
- [x] Las reglas administrativas están documentadas (alcance administrativo con
      restricción por permisos).
- [x] Las reglas de Secretaría están documentadas (alcance con restricciones de
      edición por creador y estado).
- [x] Las reglas de Alcaldía están documentadas (alcance global sin restricción
      de departamento).
- [x] Los errores de autorización están definidos (12 códigos de error
      estandarizados con HTTP status y mensaje).
- [x] La integración con guards está documentada (`AuthorizationGuard`, orden
      con `JwtAuthGuard`, construcción de contexto).
- [x] La integración con decoradores está documentada (`@RequirePermission`,
      `@RequirePermissions`, `@DepartmentScope`, `@AdminScope`, `@GlobalScope`,
      `@SecretaryScope`).
- [x] La integración con `RequestTransitionService` está documentada
      (separación de responsabilidades, flujo integrado).
- [x] El diseño evita duplicar lógica de autorización en múltiples componentes
      (validación centralizada en `AuthorizationService`, separación de
      responsabilidades entre guards, servicio de transiciones y auditoría).
- [x] El diseño puede implementarse sin redefinir reglas funcionales (las
      reglas ya están definidas en los docs de permisos de cada rol y en la
      matriz oficial).

## Actualizaciones requeridas a la matriz oficial

La matriz oficial (`docs/sprint-03-permission-matrix.md`) y los docs de cada
rol deben ser la fuente única de qué permisos tiene cada rol. Este documento
define el **cómo** se valida, no el **qué** se valida.

No se requieren cambios a la matriz oficial como consecuencia de este
documento.

## Historial de cambios

| Fecha | Cambio | Autor |
|---|---|---|
| 2026-06-14 | Creación inicial del contrato técnico de autorización | Lucas-Santamaria-Create |
