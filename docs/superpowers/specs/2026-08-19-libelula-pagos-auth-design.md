# Spec: Venta automatizada de infoproducto con Libélula

Fecha: 2026-08-19
Repos: `gastritis-frontend` (React 19 + Vite + Tailwind), `gastritis-backend` (Express 5 + Postgres + JWT)

## Objetivo

Hoy los usuarios se cargan a mano en la base de datos y el login no pide contraseña. Se
automatiza el ciclo completo: el cliente llega a la página, compra las 100 recetas, crea
su cuenta, paga por la pasarela de Libélula, y el sistema le da acceso al contenido sin
intervención manual. El precio es editable desde el panel de administración.

## Estado actual

**Backend** — un solo archivo `index.js` de 68KB.

- `POST /login` recibe solo `{email}`, verifica que exista y esté `active`, y emite JWT.
  No hay contraseña en ninguna parte del sistema.
- Tabla `users`: `id, email, role, active`.
- `GET /admin/users`, `POST /admin/add-user`, `PUT /admin/toggle-user/:id`.
- `GET /recipes` sirve un array de recetas incrustado en el mismo `index.js` (~1000 líneas).
- `POST /gemini`, `POST /chat`.
- `app.use(cors())` sin restricción de origen.

**Frontend** — sin router. `App.jsx` decide entre `LoginScreen`, `RecipesApp` y `AdminApp`
según el rol dentro del JWT leído de `localStorage`.

**Carpeta `pagos_todotix_gatewayF_Stop`** — plugin PHP de WordPress/WooCommerce provisto
por Libélula. No es reutilizable con este stack. Se usó como referencia del payload real,
contrastada contra el manual de integración v2.145. Está en `.gitignore`.

## Contrato de Libélula

Base de producción: `https://api.libelula.bo`. Para pruebas se apunta a la misma base con
la llave de pruebas. Un appkey de pruebas nunca debe usarse en producción: esas
recaudaciones no son honradas.

```
POST /rest/deuda/registrar
  { appkey, email_cliente, identificador_deuda, callback_url, url_retorno,
    descripcion, moneda, emite_factura,
    lineas_detalle_deuda: [{ concepto, cantidad, costo_unitario }] }
-> { error, mensaje, id_transaccion, url_pasarela_pagos, codigo_recaudacion, qr_simple_url }

GET  <callback_url>?transaction_id=...   <- Libélula, server-side, al confirmarse el pago
                                            (también en background: QR, BNB, PagosNet
                                             pueden confirmar horas después)
GET  <url_retorno>                       <- redirección del navegador, 5s post-pago

POST /rest/deuda/consultar_deudas/por_identificador
  { appkey, identificador }
-> { error, mensaje, datos: { pagado, valor_total, moneda, fecha_pago, forma_pago, ... } }
```

Canales soportados: tarjetas Visa/Mastercard (Cybersource ATC), QR Simple (BCP/BNB),
botón BCP, Tigo Money, BNBNet, Pago Express.

## Decisión de seguridad central

El `callback_url` de Libélula **no lleva firma ni HMAC**. Llega únicamente
`?transaction_id=...`. Quien conozca esa URL y un transaction_id podría falsificar un pago
y otorgarse acceso.

**Regla no negociable:** el backend nunca confía en los parámetros del callback. Al
recibirlo, vuelve a llamar a `consultar_deudas/por_identificador` con el appkey y exige las
tres condiciones antes de activar nada:

1. `pagado === true`
2. `valor_total * 100 === order.amount_cents`
3. `moneda === order.currency`

`url_retorno` es solo presentación: muestra el estado, nunca otorga acceso.

## Modelo de datos

```sql
-- users: se extiende sin romper lo existente
ALTER TABLE users ADD COLUMN password_hash TEXT;       -- null = legacy, o cuenta solo-Google
ALTER TABLE users ADD COLUMN google_sub    TEXT UNIQUE;
ALTER TABLE users ADD COLUMN created_at    TIMESTAMPTZ DEFAULT now();
```

`active` pasa a significar «tiene acceso al contenido». Un usuario legacy se identifica
de forma derivada, sin columna extra:
`active = true AND password_hash IS NULL AND google_sub IS NULL`.

```sql
CREATE TABLE products (
  id            SERIAL PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,        -- '100-recetas'
  name          TEXT NOT NULL,
  description   TEXT,
  price_cents   INTEGER NOT NULL,            -- centavos; nunca floats para dinero
  currency      TEXT NOT NULL DEFAULT 'BOB',
  emite_factura BOOLEAN NOT NULL DEFAULT false,
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       INTEGER REFERENCES users(id),
  product_id    INTEGER REFERENCES products(id),
  amount_cents  INTEGER NOT NULL,            -- precio CONGELADO al crear la orden
  currency      TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending',  -- pending|paid|failed|expired
  libelula_transaction_id     TEXT,
  libelula_codigo_recaudacion TEXT,
  libelula_url_pasarela       TEXT,
  paid_at           TIMESTAMPTZ,
  paid_amount_cents INTEGER,
  forma_pago        TEXT,
  activated_by      TEXT,                    -- 'libelula' | 'admin:<email>'
  created_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ON orders(libelula_transaction_id);
CREATE INDEX ON orders(status, created_at);

CREATE TABLE payment_events (                -- log crudo, auditoría
  id         SERIAL PRIMARY KEY,
  order_id   UUID REFERENCES orders(id),
  source     TEXT,                           -- callback|retorno|reconcile|admin
  raw        JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Dos decisiones que importan:

- `identificador_deuda` enviado a Libélula es `orders.id` (UUID, no adivinable, no
  enumerable). Eso también permite exponer `GET /orders/:id/status` sin autenticación.
- `amount_cents` se congela al crear la orden. Si el admin cambia el precio mientras
  alguien está pagando, se respeta el precio que el cliente vio, y la verificación compara
  contra ese valor, no contra el precio vigente.

## Estructura del backend

```
index.js               arranque, middlewares globales, monta routers
db.js                  pool de pg
middleware/auth.js     verifyToken, verifyAdmin
routes/auth.js         login, register, google, set-password
routes/checkout.js     checkout, callback de pago, estado de orden
routes/admin.js        usuarios, producto/precio, órdenes
routes/recipes.js      /recipes
routes/ai.js           /gemini, /chat
services/libelula.js   registrarDeuda(), consultarPorIdentificador()
jobs/reconcile.js      barrido de órdenes pendientes
data/recipes.js        el array de recetas
```

La reorganización es mecánica y sin cambio de comportamiento. Es requisito previo: meter
autenticación nueva y pagos dentro del `index.js` actual lo vuelve inmanejable.

## Endpoints

| Método | Ruta | Acceso | Qué hace |
|---|---|---|---|
| GET | `/product` | público | precio y descripción para la landing |
| POST | `/checkout` | público | crea usuario inactivo + orden pendiente |
| GET | `/orders/:id/status` | público | devuelve solo `{status}`; el id es UUID |
| GET | `/pagos/callback` | Libélula | verifica contra la API y activa (Fase 4) |
| POST | `/auth/login` | público | email + password -> JWT |
| POST | `/auth/google` | público | verifica idToken de Google -> JWT |
| POST | `/auth/set-password` | legacy | define contraseña una sola vez |
| GET | `/admin/users` | admin | existente |
| POST | `/admin/add-user` | admin | existente |
| PUT | `/admin/toggle-user/:id` | admin | existente |
| GET/PUT | `/admin/product` | admin | editar precio, nombre, descripción |
| GET | `/admin/orders` | admin | listado de ventas y estados |
| PUT | `/admin/orders/:id/mark-paid` | admin | activación manual (puente, Fase 3) |
| GET | `/recipes` | usuario | existente |
| POST | `/gemini`, `/chat` | usuario | existentes |

`POST /login` (email sin contraseña) **se elimina**. Es la vulnerabilidad de fondo del
sistema actual.

## Flujo de compra

Esta sección describe el estado final, con la Fase 4 ya entregada. En la Fase 3 el flujo
llega hasta el paso 2 y el cliente ve una pantalla de "pedido registrado" con
instrucciones de pago fuera de línea; el admin activa la cuenta a mano desde el listado de
ventas.

1. Landing -> botón **Comprar** -> modal con correo y contraseña, o *Continuar con Google*.
2. `POST /checkout`:
   - correo ya existe y está activo -> `409`, "ya tienes acceso, inicia sesión"
   - correo existe pero inactivo -> reutiliza el usuario y actualiza su contraseña
   - correo nuevo -> crea usuario con `active = false`, contraseña con bcrypt cost 12
   - lee el precio de `products`, crea la `order` con `amount_cents` congelado y estado
     `pending`
   - (Fase 4) llama a `registrar` y guarda `id_transaccion` y `url_pasarela_pagos`
3. El frontend redirige a la pasarela. El cliente paga por el canal que elija.
4. **`GET /pagos/callback?transaction_id=X`** (server-side, Fase 4):
   - busca la orden por `libelula_transaction_id`
   - si no existe: responde 200 y registra el evento, sin revelar nada
   - si ya está `paid`: responde 200, idempotente, no hace nada
   - llama a `consultar_deudas/por_identificador` y aplica las tres condiciones de la
     sección de seguridad
   - si pasan: `order.status = 'paid'`, `users.active = true`, `activated_by = 'libelula'`
   - si no pasan: registra el evento y no activa nada
5. El cliente aterriza en `/pago/retorno?orden=<id>` -> polling a `/orders/:id/status`
   cada 3 s durante 90 s:
   - `paid` -> "¡Listo!" -> login -> contenido
   - sigue `pending` -> "Tu pago se está procesando. Cuando se confirme podrás entrar con
     tu correo." Este es el caso normal de QR y banco.
6. Job de reconciliación cada 15 min (`setInterval` en el proceso Node): toma las órdenes
   `pending` de las últimas 72 h, consulta su estado por identificador y activa las que
   corresponda. Cubre el callback perdido, que es el único fallo que de verdad duele:
   cliente que pagó y no obtiene acceso.

## Frontend

Se agrega `react-router-dom` (hoy no hay rutas).

| Ruta | Contenido |
|---|---|
| `/` | landing de ventas, pública |
| `/pago/retorno` | estado del pago con polling |
| `/login` | contraseña + botón de Google |
| `/app` | `RecipesApp`, protegida |
| `/admin` | `AdminApp`, protegida por rol admin |

**Landing:** hero con la promesa, qué incluye (100 recetas, plan semanal, asistente IA),
precio leído en vivo de `/product`, CTA de compra, logos de canales de pago, FAQ y la
advertencia médica que ya existe en el contenido.

**Usuario legacy:** al iniciar sesión, la app detecta que no tiene contraseña ni cuenta de
Google vinculada y le pide crear una contraseña, una sola vez. Nadie pierde el acceso.

**Panel admin:** se añaden dos pestañas, precio del producto y listado de ventas. La
gestión de usuarios existente se mantiene tal cual.

## Configuración

```
LIBELULA_APPKEY=            # de cmelgar@libelula.bo; pruebas primero
LIBELULA_API_BASE=https://api.libelula.bo
GOOGLE_CLIENT_ID=           # Google Cloud Console
PUBLIC_BACKEND_URL=https://api-gas.duckdns.org
PUBLIC_FRONTEND_URL=        # pendiente; solo se necesita en Fase 4
```

## Seguridad

- `app.use(cors())` está abierto a cualquier origen: se restringe al origen del frontend.
  El callback de Libélula es server-side, así que CORS no lo afecta.
- Rate limit en `/auth/login` y `/checkout`.
- bcrypt cost 12.
- El appkey vive solo en variables de entorno. Nunca en el frontend ni en logs.
- JWT se mantiene en 2 h; se agrega `id` al payload (hoy lleva solo `email` y `role`).
- `/orders/:id/status` devuelve exclusivamente el estado, sin datos del usuario ni montos.

## Pruebas

El foco está en la lógica de verificación de pago, con `fetch` mockeado y sin tocar la API
real de Libélula:

- monto correcto y `pagado:true` -> activa la cuenta
- monto distinto al de la orden -> **no** activa
- moneda distinta -> **no** activa
- `pagado:false` -> no activa
- `transaction_id` de una orden inexistente -> responde 200, no rompe, no activa
- callback repetido sobre una orden ya pagada -> idempotente, sin efectos
- reconciliación activa una orden cuyo callback nunca llegó

Sobre autenticación: login con contraseña correcta e incorrecta, usuario inactivo
rechazado, usuario legacy dirigido a crear contraseña, `/login` viejo ausente.

## Fases

Los pagos automáticos van al final, para que el resto llegue probado y para dar tiempo a
conseguir y validar el appkey.

**Fase 0 — Reorganizar el backend.** Partir `index.js` en los módulos descritos, mover las
recetas a `data/recipes.js`. Sin cambio de comportamiento; los endpoints actuales siguen
respondiendo igual.

**Fase 1 — Autenticación real.** Migración de `users`, bcrypt, `/auth/login`,
`/auth/google`, `/auth/set-password`, flujo de usuario legacy en el frontend, eliminación
de `POST /login`. Restricción de CORS y rate limiting.

**Fase 2 — Producto y precio.** Tabla `products` con el registro de las 100 recetas,
`GET /product`, pestaña de precio en el panel admin.

**Fase 3 — Landing y checkout con activación manual.** Router en el frontend, landing de
ventas, modal de compra, tablas `orders` y `payment_events`, `POST /checkout` creando la
orden en `pending`, listado de ventas en el admin y `mark-paid` manual. Al terminar esta
fase ya se puede vender y activar a mano mientras llega el appkey.

**Fase 4 — Libélula automático.** `services/libelula.js`, registro de deuda dentro de
`/checkout`, `GET /pagos/callback` con verificación, página `/pago/retorno` con polling,
job de reconciliación. La activación manual de la Fase 3 se conserva como respaldo
operativo.

## Fuera de alcance

- Envío de correos. Nada crítico depende del email: el acceso se otorga en pantalla al
  confirmarse el pago. Recuperación de contraseña y correo de compra quedan para después,
  cuando haya un servicio de envío configurado.
- Emisión de facturas. `emite_factura` queda en `false` y configurable desde el panel; no
  se piden NIT ni razón social en el checkout. Activarlo exige dosificación ante el SIN.
- Mover las recetas del array a la base de datos.
- Catálogo de varios productos y carrito. El modelo de datos ya lo admite sin migración.
- Anulación de pagos y regeneración de facturas de la API de Libélula.
