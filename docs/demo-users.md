# Usuarios de Demostracion

Este documento resume los usuarios de prueba creados por el seed del backend
para que frontend pueda autenticar, probar rutas internas y validar roles sin
insertar datos manualmente.

## Credenciales

| Email | Rol funcional | Rol almacenado | Password |
| --- | --- | --- | --- |
| `recepcionista@demo.local` | `RECEPTIONIST` | `recepcionista` | `password-demo` |
| `supervisor@demo.local` | `SUPERVISOR` | `supervisor` | `password-demo` |
| `funcionario@demo.local` | `OFFICER` | `revisor` | `password-demo` |

## Como obtener el token

1. Levanta el backend con la base de datos migrada.
2. Ejecuta el login contra `POST /api/v1/auth/login`.
3. Usa el `access_token` devuelto en el header `Authorization: Bearer <token>`.

## Ejemplo de login

`POST /api/v1/auth/login`

```json
{
  "email": "recepcionista@demo.local",
  "password": "password-demo"
}
```

## Respuesta esperada

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 28800,
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Notas

- El token incluye el rol del usuario en el claim `role`.
- El seed es idempotente: si se ejecuta mas de una vez no duplica usuarios.
- Los tres usuarios estan pensados para probar `RECEPTIONIST`, `SUPERVISOR` y
  `OFFICER` desde frontend.
- El usuario `funcionario@demo.local` se asigna al rol almacenado `revisor`,
  que el backend normaliza como `OFFICER`.
