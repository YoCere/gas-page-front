# Spec: Días de prueba configurables

Fecha: 2026-09-10
Repos: `gastritis-frontend` (React 19 + Vite + Tailwind), `gastritis-backend` (Express 5 + Postgres + JWT)

## Objetivo

Hoy toda cuenta que existe y está `active` tiene acceso para siempre. Se quiere probar si
regalar unos días de acceso convierte en ventas. El administrador da de alta al cliente y
elige en ese momento cuántos días de prueba recibe, entre 1 y 7, o acceso ilimitado.
Cuando el plazo termina el cliente queda fuera y ve una pantalla que le explica cómo
comprar.

La pasarela de pagos queda congelada hasta que esta prueba demuestre ser rentable.

## Estado actual verificado

Consulta corrida contra la base de Coolify el 2026-09-10.

La base tiene una sola tabla, `users`, con cuatro columnas: `id`, `email`, `role`
(por defecto `user`), `active` (por defecto verdadero).

| rol | activo | cuántos |
|---|---|---|
| admin | sí | 2 |
| user | sí | 2 |
| user | no | 1 |

Cinco cuentas en total. La migración es de bajo riesgo por el volumen.

`POST /login` recibe solo el correo y emite un JWT de 2 horas con el correo y el rol. No
hay contraseñas. **Es una decisión deliberada del dueño del producto:** el correo cumple
la función de contraseña, el contenido son recetas y la prioridad es que entrar sea
rápido. Este spec no la cambia.

## Decisiones

1. **Alta manual.** No hay registro público. El administrador crea la cuenta desde el
   panel. No hace falta landing ni control de abuso.
2. **El reloj arranca en el primer ingreso**, no al crear la cuenta. Si das de alta a
   alguien un lunes y entra el viernes, recibe sus 7 días completos.
3. **El contador va de 1 a 7.** Un paso arriba de 7 pasa a ilimitado y se muestra `--`.
   Bajar desde ilimitado vuelve a 7. Bajar desde 1 se queda en 1. El formulario de alta
   abre en 7.
4. **Al vencer, pantalla con aviso** y el contacto del vendedor. La cuenta sobrevive y el
   administrador extiende los días desde el panel.
5. **Los administradores nunca vencen**, sin importar qué diga su columna. Evita que el
   dueño quede fuera de su propio panel.
6. **`active` sigue siendo el interruptor manual** y es independiente del vencimiento. Un
   usuario desactivado a mano queda fuera aunque su prueba siga vigente.

## Modelo de datos

```sql
ALTER TABLE users ADD COLUMN trial_days     INTEGER;      -- NULL = ilimitado
ALTER TABLE users ADD COLUMN first_login_at TIMESTAMPTZ;  -- NULL = nunca entró

CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);
INSERT INTO settings (key, value) VALUES ('whatsapp', '') ON CONFLICT DO NOTHING;
```

La tabla `settings` guarda el número de WhatsApp que aparece en la pantalla de prueba
terminada, para que se pueda cambiar desde el panel sin tocar código ni redesplegar. Es
una tabla de clave y valor a propósito: el día que haga falta otro ajuste editable entra
como una fila más, sin migración.

La fecha de vencimiento **no se guarda**, se calcula como
`first_login_at + trial_days`. Una sola fuente de verdad: extender la prueba es subir el
número, y no hay dos campos que puedan contradecirse.

Las cinco cuentas existentes quedan con `trial_days` en NULL, es decir ilimitado. Nadie
pierde acceso. El usuario que hoy está desactivado sigue bloqueado.

Rango válido de `trial_days`: NULL, o un entero entre 1 y 7. El backend rechaza cualquier
otro valor con 400.

## Lógica de acceso

Toda la decisión vive en una función pura, sin base de datos ni HTTP:

```
computeAccess({ role, active, trial_days, first_login_at }, now)
  -> { allowed, status, daysLeft }
```

`status` es uno de:

| status | condición | allowed |
|---|---|---|
| `disabled` | la cuenta está desactivada a mano | no |
| `unlimited` | es administrador, o `trial_days` es NULL | sí |
| `not_started` | `first_login_at` es NULL | sí |
| `active` | ahora es anterior al vencimiento | sí |
| `expired` | ahora alcanzó o pasó el vencimiento | no |

`daysLeft` es un entero redondeado hacia arriba para `active`, el número de días
contratados para `not_started`, y NULL en el resto. Redondear hacia arriba evita mostrar
"quedan 0 días" a alguien que todavía tiene acceso.

El orden de evaluación importa: la cuenta desactivada se comprueba primero, y el
privilegio de administrador antes que cualquier cálculo de fechas.

## Backend

### Login

`POST /login` mantiene su contrato de entrada, solo el correo.

1. Busca el correo, sin distinguir mayúsculas, entre las cuentas activas. Si no aparece,
   responde 401 como hoy.
2. Si `first_login_at` está vacío, lo escribe con la hora actual. Aquí arranca el reloj.
   Se hace antes de evaluar el acceso, con la fila ya actualizada.
3. Evalúa `computeAccess`. Si no está permitido, responde 403 con el código
   `TRIAL_EXPIRED`.
4. Si está permitido, emite el JWT igual que hoy.

El 403 con código propio es lo que permite al frontend distinguir "tu prueba terminó" de
"ese correo no está autorizado". Son mensajes distintos para el cliente.

### Corte durante la sesión

El JWT dura 2 horas, así que un token emitido antes del vencimiento seguiría sirviendo.
Un middleware `verifyAccess` corre después de `verifyToken` en `/recipes`, `/gemini` y
`/chat`: busca al usuario por el correo del token, aplica `computeAccess` y corta con el
mismo 403.

Se busca por correo y no por identificador a propósito: los tokens que ya están en
circulación no llevan el identificador, y así el despliegue no cierra las sesiones
abiertas.

Cuesta una consulta por pedido. Con cinco usuarios es irrelevante, y es lo único que
impide que alguien siga dentro hasta dos horas después de vencer.

### Endpoints de administración

| Método | Ruta | Cambio |
|---|---|---|
| GET | `/admin/users` | agrega `status` y `daysLeft` ya calculados |
| POST | `/admin/add-user` | acepta `trialDays` además del correo |
| PUT | `/admin/user/:id/trial` | nuevo: cambia los días de un usuario existente |
| PUT | `/admin/toggle-user/:id` | sin cambios |
| GET | `/public-config` | nuevo y **público**: devuelve el número de WhatsApp |
| PUT | `/admin/settings` | nuevo: cambia el número de WhatsApp |

`/public-config` no lleva token a propósito. La pantalla de prueba terminada aparece
justamente cuando el cliente no consiguió sesión, así que no puede pedir un dato
protegido. Lo único que expone es un número de contacto comercial, que de todos modos es
público.

`trialDays` viaja como número entre 1 y 7, o NULL para ilimitado. El frontend no repite el
cálculo de días restantes: lo recibe resuelto del servidor, para que no existan dos
implementaciones de la misma regla.

`PUT /admin/user/:id/trial` no toca `first_login_at`. Extender la prueba de alguien que ya
venció le devuelve el acceso contando desde su primer ingreso original.

## Frontend

### Panel de administración

El formulario de alta suma el contador al lado del campo de correo. Abre en 7 días, con
flechas para subir y bajar. Un paso arriba de 7 muestra `--`, que significa acceso
ilimitado.

```
  Agregar cliente
  ------------------------------------
  correo:  juan@mail.com
  Prueba:    <   7 dias   >
  ------------------------------------

  <  baja:  6, 5, 4, 3, 2, 1   (se detiene en 1)
  >  sube:  pasa de 7  ->  "--"  ilimitado
```

La lista de usuarios gana una columna de estado, leída de `status` y `daysLeft`:

| status | qué se muestra |
|---|---|
| `unlimited` | Ilimitado |
| `not_started` | Sin entrar aún, 7 días |
| `active` | Quedan 3 días |
| `expired` | Vencida |
| `disabled` | Desactivado |

Cada fila lleva el mismo contador para cambiarle los días a una cuenta ya creada. El botón
de activar y desactivar se mantiene tal cual.

### Pantalla de prueba terminada

Un componente nuevo que se muestra cuando llega un 403 con el código `TRIAL_EXPIRED`, en
dos momentos: al intentar iniciar sesión, y estando dentro de la aplicación cuando falla
una petición. Explica que el período terminó y ofrece volver al inicio. La sesión se
limpia del almacenamiento del navegador para que no quede un token muerto dando vueltas.

El botón de contacto lee el número desde `/public-config`. Si el número está vacío, la
pantalla muestra el aviso sin botón, en vez de un enlace roto.

### Ajuste del número de WhatsApp

El panel gana un campo para escribir el número, con código de país y sin signos, por
ejemplo `59171234567`. Se guarda con `PUT /admin/settings`. El botón de la pantalla de
vencimiento abre `https://wa.me/<número>` con un mensaje inicial ya escrito.

### Limpieza incluida

`BACKEND_URL` está repetida en cuatro archivos del frontend. Se centraliza en un módulo
único que todos importan. Es el mismo valor, sin cambio de comportamiento, y evita que un
cambio de dominio se aplique en tres archivos y se olvide el cuarto.

## Pruebas

El backend es un `index.js` de 68KB sin exportaciones, así que probarlo por HTTP exigiría
reorganizarlo, y eso está fuera de alcance. En cambio `computeAccess` se extrae a su
propio módulo y se prueba a fondo con el runner que ya trae Node, sin dependencias nuevas.
Ahí vive toda la regla de negocio.

Casos cubiertos:

- usuario sin entrar nunca, con prueba pendiente
- prueba vigente, con los días restantes correctos
- prueba vencida al segundo exacto del límite
- prueba vencida hace días
- `trial_days` en NULL, acceso ilimitado
- administrador con prueba vencida, que igual entra
- usuario desactivado a mano con prueba vigente, que no entra
- extender los días a una cuenta vencida le devuelve el acceso
- redondeo hacia arriba: a quien le quedan horas se le muestra 1 día, no 0

Se agrega el script de pruebas al backend usando el runner incorporado de Node.

## Despliegue

Los dos repos son servicios separados en Coolify y cada push redespliega solo el suyo. El
orden importa:

1. **Migración SQL** en el terminal de Postgres de Coolify. Solo agrega columnas, y el
   backend que está corriendo las ignora sin enterarse.
2. **Push al backend.** Empieza a marcar el primer ingreso y a cortar a los vencidos. Los
   cinco usuarios actuales quedan en ilimitado, así que en la práctica nadie nota nada.
3. **Push al frontend.** Aparece el contador en el panel y la pantalla de vencido.

Si el trabajo se detiene después del paso 2, el sistema queda estable: nada se rompe,
simplemente el panel todavía no deja elegir días.

## Fuera de alcance

- **Contraseñas y cuentas de Google.** Decisión explícita del dueño del producto: el
  correo funciona como contraseña y la prioridad es que entrar sea rápido.
- **Libélula y cobro automático.** Congelado hasta que la prueba demuestre ser rentable.
  El spec del 2026-08-19 sigue archivado y vigente para cuando llegue el momento.
- **Recetas en base de datos, editables desde el panel con un botón por receta.** Es el
  trabajo que sigue a este, con su propio spec.
- **Avisos por correo** de que la prueba está por vencer. No hay servicio de envío
  configurado.
- **Reorganizar el `index.js` del backend.** Necesario algún día, innecesario para esto.

## Cambios surgidos durante la implementación

Seis decisiones que no estaban en el diseño original y que ahora forman parte del sistema.
Todas salieron de revisiones de código, no de un cambio de requisitos.

**La regla de acceso falla cerrada.** Si `first_login_at` tuviera un valor que no se puede
interpretar como fecha, el cálculo daba un número indefinido y el usuario entraba. Un
control de acceso nunca debe fallar hacia el lado abierto, así que ese caso ahora bloquea.

**Los administradores sí se bloquean por desactivación.** El diseño decía que los
administradores nunca vencen, y eso sigue siendo cierto para la prueba. Pero antes el
control de rol leía únicamente el token, así que un administrador desactivado conservaba
el panel completo durante las dos horas de vida del token. Las tres rutas de
administración ahora consultan la base igual que las de usuario.

**Un administrador no puede desactivarse a sí mismo.** Consecuencia directa del punto
anterior: sin ese seguro, quien se desactivara perdía el panel y no tenía forma de
deshacerlo salvo entrando a la base a mano.

**Dos códigos de rechazo, no uno.** Una cuenta desactivada devuelve `ACCOUNT_DISABLED` y
una prueba vencida devuelve `TRIAL_EXPIRED`. El frontend distingue por el código de estado
HTTP y no por el código propio, así que ambos llevan a la misma pantalla. Existen para que
los registros y los datos no llamen "prueba vencida" a lo que no lo es.

**Índice sobre el correo en minúsculas.** La comprobación de acceso pasó a ser la consulta
más frecuente de todo el sistema, y compara el correo en minúsculas, lo que impide usar un
índice normal. La migración crea el índice apropiado.

**El contador del panel espera antes de guardar.** Cada clic disparaba una petición y una
recarga de la lista. Bajar de 7 a 1 mandaba seis, y las respuestas podían llegar
desordenadas y dejar la fila mostrando un valor que el administrador no eligió. Ahora el
cambio se pinta al instante y se guarda una sola vez al terminar la ráfaga.
