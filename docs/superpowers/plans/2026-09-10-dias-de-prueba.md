# Días de prueba configurables — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El administrador da de alta a un cliente eligiendo entre 1 y 7 días de prueba o acceso ilimitado, el reloj arranca en el primer ingreso del cliente, y al vencer queda fuera con una pantalla que lo manda a WhatsApp a comprar.

**Architecture:** Toda la regla de negocio vive en una función pura `computeAccess` en el backend, probada con el runner de Node. El login la consulta al emitir el token y un middleware la reconsulta en cada pedido protegido, porque el JWT dura 2 horas y sobreviviría al vencimiento. El frontend nunca recalcula días: recibe el estado ya resuelto del servidor. El número de WhatsApp vive en una tabla de ajustes y se edita desde el panel.

**Tech Stack:** Backend Express 5 + Postgres (`pg`) + JWT, ESM, sin dependencias nuevas. Frontend React 19 + Vite + Tailwind, sin router. Pruebas con `node --test`.

**Repos y rutas absolutas:**
- Backend: `D:\PROGRAMAS\xamp\htdocs\gastritis-backend`
- Frontend: `D:\PROGRAMAS\xamp\htdocs\gastritis-frontend`

**Spec:** `docs/superpowers/specs/2026-09-10-dias-de-prueba-design.md` (en el repo del frontend)

---

## Estructura de archivos

**Backend** (`gastritis-backend`)

| Archivo | Responsabilidad |
|---|---|
| `access.js` | **Nuevo.** La función pura `computeAccess` y la validación `normalizeTrialDays`. Sin base de datos, sin HTTP. Aquí vive toda la regla. |
| `test/access.test.js` | **Nuevo.** Pruebas de `computeAccess` y `normalizeTrialDays`. |
| `migrations/001-trial-days.sql` | **Nuevo.** Las dos columnas, la tabla de ajustes y la restricción de rango. Idempotente. |
| `index.js` | **Modificar.** Importa `access.js`, cambia el login, agrega el middleware `verifyAccess`, cambia los endpoints de administración y agrega los dos de ajustes. |
| `package.json` | **Modificar.** Agrega el script de pruebas. |

`index.js` ya tiene 68KB y sigue siendo un monolito. Este plan **no** lo reorganiza, pero saca la lógica de acceso a su propio módulo porque sin eso no hay forma de probarla.

**Frontend** (`gastritis-frontend`)

| Archivo | Responsabilidad |
|---|---|
| `src/config.js` | **Nuevo.** La constante `BACKEND_URL`, hoy repetida en cuatro archivos. |
| `src/TrialCounter.jsx` | **Nuevo.** El contador de 1 a 7 con `--`. Componente controlado, sin saber nada de la red. |
| `src/TrialExpired.jsx` | **Nuevo.** La pantalla de prueba terminada con el botón de WhatsApp. |
| `src/App.jsx` | **Modificar.** Estado `expired` y la función `onExpired` que baja a los hijos. |
| `src/LoginScreen.jsx` | **Modificar.** Distingue el 403 del 401, usa `config.js`. |
| `src/AdminApp.jsx` | **Modificar.** Contador al dar de alta, columna de estado, contador por fila, campo de WhatsApp. |
| `src/RecipesApp.jsx` | **Modificar.** Corta con `onExpired` al recibir 403, usa `config.js`. |
| `src/ChatWidget.jsx` | **Modificar.** Igual que arriba. |

---

## PARTE A — BACKEND

Todo lo de esta parte se hace en `D:\PROGRAMAS\xamp\htdocs\gastritis-backend`.

### Task 1: La función de acceso, con pruebas

**Files:**
- Create: `access.js`
- Create: `test/access.test.js`
- Modify: `package.json`

- [ ] **Step 1: Agregar el script de pruebas**

En `package.json`, dentro de `"scripts"`, junto al `"start"` que ya existe:

```json
  "scripts": {
    "start": "node index.js",
    "test": "node --test"
  },
```

- [ ] **Step 2: Escribir las pruebas que fallan**

Crear `test/access.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { computeAccess, normalizeTrialDays } from "../access.js";

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-09-10T12:00:00Z");
const hace = (ms) => new Date(NOW.getTime() - ms);

test("usuario sin registro devuelve desactivado", () => {
  const r = computeAccess(undefined, NOW);
  assert.equal(r.allowed, false);
  assert.equal(r.status, "disabled");
});

test("usuario desactivado a mano no entra aunque su prueba siga vigente", () => {
  const r = computeAccess(
    { role: "user", active: false, trial_days: 7, first_login_at: hace(DAY) },
    NOW
  );
  assert.equal(r.allowed, false);
  assert.equal(r.status, "disabled");
});

test("trial_days en NULL es acceso ilimitado", () => {
  const r = computeAccess(
    { role: "user", active: true, trial_days: null, first_login_at: hace(90 * DAY) },
    NOW
  );
  assert.equal(r.allowed, true);
  assert.equal(r.status, "unlimited");
  assert.equal(r.daysLeft, null);
});

test("administrador con prueba vencida igual entra", () => {
  const r = computeAccess(
    { role: "admin", active: true, trial_days: 1, first_login_at: hace(30 * DAY) },
    NOW
  );
  assert.equal(r.allowed, true);
  assert.equal(r.status, "unlimited");
});

test("usuario que nunca entró conserva sus días completos", () => {
  const r = computeAccess(
    { role: "user", active: true, trial_days: 7, first_login_at: null },
    NOW
  );
  assert.equal(r.allowed, true);
  assert.equal(r.status, "not_started");
  assert.equal(r.daysLeft, 7);
});

test("prueba vigente informa los días restantes", () => {
  const r = computeAccess(
    { role: "user", active: true, trial_days: 7, first_login_at: hace(2 * DAY) },
    NOW
  );
  assert.equal(r.allowed, true);
  assert.equal(r.status, "active");
  assert.equal(r.daysLeft, 5);
});

test("quedan horas y se muestra un día, no cero", () => {
  const r = computeAccess(
    { role: "user", active: true, trial_days: 7, first_login_at: hace(7 * DAY - 3600 * 1000) },
    NOW
  );
  assert.equal(r.allowed, true);
  assert.equal(r.daysLeft, 1);
});

test("vence al segundo exacto del límite", () => {
  const r = computeAccess(
    { role: "user", active: true, trial_days: 7, first_login_at: hace(7 * DAY) },
    NOW
  );
  assert.equal(r.allowed, false);
  assert.equal(r.status, "expired");
  assert.equal(r.daysLeft, null);
});

test("prueba vencida hace días", () => {
  const r = computeAccess(
    { role: "user", active: true, trial_days: 7, first_login_at: hace(30 * DAY) },
    NOW
  );
  assert.equal(r.allowed, false);
  assert.equal(r.status, "expired");
});

test("extender los días devuelve el acceso a una cuenta vencida", () => {
  const user = { role: "user", active: true, trial_days: 7, first_login_at: hace(10 * DAY) };
  assert.equal(computeAccess(user, NOW).allowed, false);
  assert.equal(computeAccess({ ...user, trial_days: null }, NOW).allowed, true);
});

test("acepta la fecha como texto, que es como la devuelve Postgres", () => {
  const r = computeAccess(
    { role: "user", active: true, trial_days: 7, first_login_at: "2026-09-08T12:00:00Z" },
    NOW
  );
  assert.equal(r.status, "active");
  assert.equal(r.daysLeft, 5);
});

test("normalizeTrialDays acepta null como ilimitado", () => {
  assert.equal(normalizeTrialDays(null), null);
});

test("normalizeTrialDays acepta de 1 a 7", () => {
  assert.equal(normalizeTrialDays(1), 1);
  assert.equal(normalizeTrialDays(7), 7);
});

test("normalizeTrialDays rechaza fuera de rango, decimales y basura", () => {
  assert.equal(normalizeTrialDays(0), undefined);
  assert.equal(normalizeTrialDays(8), undefined);
  assert.equal(normalizeTrialDays(3.5), undefined);
  assert.equal(normalizeTrialDays("7"), undefined);
  assert.equal(normalizeTrialDays(undefined), undefined);
});
```

- [ ] **Step 3: Correr las pruebas y confirmar que fallan**

```bash
npm test
```

Esperado: falla al importar, con un mensaje del tipo `Cannot find module '../access.js'`.

- [ ] **Step 4: Escribir la implementación mínima**

Crear `access.js`:

```js
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MAX_TRIAL_DAYS = 7;

const DENIED = { allowed: false, status: "disabled", daysLeft: null };

export function computeAccess(user, now = new Date()) {
  if (!user || user.active === false) return DENIED;

  if (user.role === "admin" || user.trial_days === null || user.trial_days === undefined) {
    return { allowed: true, status: "unlimited", daysLeft: null };
  }

  if (!user.first_login_at) {
    return { allowed: true, status: "not_started", daysLeft: user.trial_days };
  }

  const startedAt = new Date(user.first_login_at).getTime();
  const expiresAt = startedAt + user.trial_days * MS_PER_DAY;
  const remaining = expiresAt - now.getTime();

  if (remaining <= 0) {
    return { allowed: false, status: "expired", daysLeft: null };
  }

  return { allowed: true, status: "active", daysLeft: Math.ceil(remaining / MS_PER_DAY) };
}

export function normalizeTrialDays(value) {
  if (value === null) return null;
  if (!Number.isInteger(value)) return undefined;
  if (value < 1 || value > MAX_TRIAL_DAYS) return undefined;
  return value;
}
```

`normalizeTrialDays` devuelve `undefined` para lo inválido y `null` para ilimitado. Son
dos cosas distintas y el llamador las distingue: `undefined` es un 400, `null` se guarda
tal cual.

- [ ] **Step 5: Correr las pruebas y confirmar que pasan**

```bash
npm test
```

Esperado: `pass 14`, `fail 0`.

- [ ] **Step 6: Commit**

```bash
git add access.js test/access.test.js package.json
git commit -m "feat: add trial access rule with tests"
```

---

### Task 2: La migración SQL

**Files:**
- Create: `migrations/001-trial-days.sql`

- [ ] **Step 1: Escribir la migración**

Crear `migrations/001-trial-days.sql`:

```sql
-- Días de prueba configurables. Idempotente: se puede correr dos veces sin daño.

ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_days     INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_login_at TIMESTAMPTZ;

DO $$ BEGIN
  ALTER TABLE users ADD CONSTRAINT users_trial_days_range
    CHECK (trial_days IS NULL OR (trial_days >= 1 AND trial_days <= 7));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

INSERT INTO settings (key, value) VALUES ('whatsapp', '')
ON CONFLICT (key) DO NOTHING;
```

Las cinco cuentas que ya existen quedan con `trial_days` en NULL, que es acceso
ilimitado. Nadie pierde acceso al correr esto.

- [ ] **Step 2: Verificar que el archivo es SQL válido leyéndolo entero**

No se corre todavía. Se aplica en la Task 7, contra la base de Coolify, antes de
desplegar el backend.

- [ ] **Step 3: Commit**

```bash
git add migrations/001-trial-days.sql
git commit -m "feat: add migration for trial days and settings"
```

---

### Task 3: Login con verificación de prueba

**Files:**
- Modify: `index.js` (el bloque `app.post("/login", ...)`, alrededor de la línea 72)

- [ ] **Step 1: Importar el módulo de acceso**

En la cabecera de `index.js`, después de `import pkg from "pg";`:

```js
import { computeAccess, normalizeTrialDays } from "./access.js";
```

- [ ] **Step 2: Reemplazar el manejador de login completo**

Buscar el bloque que empieza en `app.post("/login", async (req, res) => {` y reemplazarlo
entero por:

```js
app.post("/login", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email requerido" });
    }

    const result = await pool.query(
      "SELECT * FROM users WHERE LOWER(email) = LOWER($1) AND active = true",
      [email.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "No autorizado" });
    }

    let user = result.rows[0];

    // El reloj de la prueba arranca en el primer ingreso, no al crear la cuenta.
    if (!user.first_login_at) {
      const updated = await pool.query(
        "UPDATE users SET first_login_at = now() WHERE id = $1 RETURNING *",
        [user.id]
      );
      user = updated.rows[0];
    }

    const access = computeAccess(user);

    if (!access.allowed) {
      return res.status(403).json({
        error: "Tu período de prueba terminó",
        code: "TRIAL_EXPIRED"
      });
    }

    const token = jwt.sign(
      { email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({ token });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "Error servidor" });
  }
});
```

El 403 lleva un código propio. Sin él, el frontend no puede distinguir "tu prueba
terminó" de "ese correo no está autorizado", que son dos mensajes distintos para el
cliente.

- [ ] **Step 3: Verificar que el archivo sigue siendo válido**

```bash
node --check index.js
```

Esperado: sin salida, que es como Node dice que está bien.

- [ ] **Step 4: Commit**

```bash
git add index.js
git commit -m "feat: enforce trial expiry on login"
```

---

### Task 4: Corte durante la sesión

**Files:**
- Modify: `index.js` (después de la función `verifyAdmin`, y las tres rutas protegidas)

- [ ] **Step 1: Agregar el middleware**

En `index.js`, justo después de la función `verifyAdmin` que ya existe:

```js
async function verifyAccess(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT id, email, role, active, trial_days, first_login_at
       FROM users WHERE LOWER(email) = LOWER($1)`,
      [req.user.email]
    );

    const access = computeAccess(result.rows[0]);

    if (!access.allowed) {
      return res.status(403).json({
        error: "Tu período de prueba terminó",
        code: "TRIAL_EXPIRED"
      });
    }

    next();

  } catch (err) {
    console.error("VERIFY ACCESS ERROR:", err);
    res.status(500).json({ error: "Error servidor" });
  }
}
```

Busca por correo y no por identificador a propósito: los tokens que ya están en
circulación no llevan identificador, así que buscar por correo evita cerrar las sesiones
abiertas al desplegar. Si el correo ya no existe, `result.rows[0]` es `undefined` y
`computeAccess` lo rechaza.

- [ ] **Step 2: Aplicarlo a las tres rutas protegidas**

Cambiar estas tres líneas en `index.js`:

```js
app.get("/recipes", verifyToken, (req, res) => {
app.post("/gemini", verifyToken, async (req, res) => {
app.post("/chat", verifyToken, async (req, res) => {
```

por:

```js
app.get("/recipes", verifyToken, verifyAccess, (req, res) => {
app.post("/gemini", verifyToken, verifyAccess, async (req, res) => {
app.post("/chat", verifyToken, verifyAccess, async (req, res) => {
```

Las rutas de administración **no** llevan `verifyAccess`: `verifyAdmin` ya cubre eso y
los administradores nunca vencen.

- [ ] **Step 3: Verificar el archivo**

```bash
node --check index.js
```

Esperado: sin salida.

- [ ] **Step 4: Commit**

```bash
git add index.js
git commit -m "feat: cut access mid-session when trial expires"
```

---

### Task 5: Endpoints de administración

**Files:**
- Modify: `index.js` (los bloques `/admin/users` y `/admin/add-user`, y una ruta nueva)

- [ ] **Step 1: Reemplazar el listado de usuarios**

Buscar `app.get("/admin/users", ...)` y reemplazarlo entero por:

```js
app.get("/admin/users", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, role, active, trial_days, first_login_at
       FROM users ORDER BY id ASC`
    );

    res.json(result.rows.map((u) => {
      const access = computeAccess(u);
      return {
        id: u.id,
        email: u.email,
        role: u.role,
        active: u.active,
        trialDays: u.trial_days,
        status: access.status,
        daysLeft: access.daysLeft
      };
    }));

  } catch (err) {
    console.error("GET USERS ERROR:", err);
    res.status(500).json({ error: "Error servidor" });
  }
});
```

El servidor manda el estado ya calculado. El frontend no repite la regla, así no hay dos
implementaciones que se puedan separar con el tiempo.

- [ ] **Step 2: Reemplazar el alta de usuario**

Buscar `app.post("/admin/add-user", ...)` y reemplazarlo entero por:

```js
app.post("/admin/add-user", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { email, trialDays = 7 } = req.body ?? {};

    if (!email) {
      return res.status(400).json({ error: "Email requerido" });
    }

    const days = normalizeTrialDays(trialDays);

    if (days === undefined) {
      return res.status(400).json({ error: "trialDays debe ser de 1 a 7, o null" });
    }

    const existing = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER($1)",
      [email.trim()]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Usuario ya existe" });
    }

    await pool.query(
      "INSERT INTO users (email, role, active, trial_days) VALUES ($1, 'user', true, $2)",
      [email.trim(), days]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("ADD USER ERROR:", err);
    res.status(500).json({ error: "Error servidor" });
  }
});
```

- [ ] **Step 3: Agregar el cambio de días**

Justo después del bloque de `add-user`:

```js
app.put("/admin/user/:id/trial", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const days = normalizeTrialDays(req.body?.trialDays);

    if (days === undefined) {
      return res.status(400).json({ error: "trialDays debe ser de 1 a 7, o null" });
    }

    // No toca first_login_at: extender la prueba cuenta desde el ingreso original.
    const result = await pool.query(
      "UPDATE users SET trial_days = $1 WHERE id = $2 RETURNING id",
      [days, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ success: true });

  } catch (err) {
    console.error("UPDATE TRIAL ERROR:", err);
    res.status(500).json({ error: "Error servidor" });
  }
});
```

- [ ] **Step 4: Verificar el archivo**

```bash
node --check index.js
```

Esperado: sin salida.

- [ ] **Step 5: Commit**

```bash
git add index.js
git commit -m "feat: manage trial days from admin endpoints"
```

---

### Task 6: Ajuste del número de WhatsApp

**Files:**
- Modify: `index.js` (dos rutas nuevas)

- [ ] **Step 1: Agregar la lectura pública**

En `index.js`, después del bloque de `/health`:

```js
// Público a propósito: la pantalla de prueba vencida aparece cuando el cliente
// no tiene sesión, así que no puede pedir un dato protegido.
app.get("/public-config", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT value FROM settings WHERE key = 'whatsapp'"
    );
    res.json({ whatsapp: result.rows[0]?.value ?? "" });

  } catch (err) {
    console.error("PUBLIC CONFIG ERROR:", err);
    res.status(500).json({ error: "Error servidor" });
  }
});
```

- [ ] **Step 2: Agregar la escritura de administrador**

Después del bloque de `/admin/user/:id/trial`:

```js
app.put("/admin/settings", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { whatsapp } = req.body ?? {};

    if (typeof whatsapp !== "string" || !/^[0-9]{0,15}$/.test(whatsapp)) {
      return res.status(400).json({ error: "Número inválido: solo dígitos, hasta 15" });
    }

    await pool.query(
      `INSERT INTO settings (key, value) VALUES ('whatsapp', $1)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [whatsapp]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("UPDATE SETTINGS ERROR:", err);
    res.status(500).json({ error: "Error servidor" });
  }
});
```

El vacío es válido: significa que todavía no se configuró y la pantalla de vencimiento
muestra el aviso sin botón, en vez de un enlace roto.

- [ ] **Step 3: Verificar el archivo**

```bash
node --check index.js
```

Esperado: sin salida.

- [ ] **Step 4: Commit**

```bash
git add index.js
git commit -m "feat: store whatsapp contact in settings table"
```

---

### Task 7: Migrar la base y desplegar el backend

**Files:** ninguno. Es operación.

- [ ] **Step 1: Correr la migración en Coolify**

En el terminal del servicio de Postgres, pegar el contenido de
`migrations/001-trial-days.sql` dentro de:

```sh
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```

- [ ] **Step 2: Confirmar que las columnas existen**

```sh
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position;" \
  -c "SELECT * FROM settings;"
```

Esperado: seis columnas en `users`, las cuatro de antes más `trial_days` y
`first_login_at`, y una fila en `settings` con la clave `whatsapp` y valor vacío.

El backend que está corriendo todavía es el viejo y no conoce esas columnas. No pasa
nada: las ignora.

- [ ] **Step 3: Correr las pruebas una vez más antes de subir**

```bash
npm test
```

Esperado: `pass 14`, `fail 0`.

- [ ] **Step 4: Empujar el backend**

```bash
git push
```

Esto dispara el redespliegue del servicio del backend en Coolify, y solo de ese.

- [ ] **Step 5: Confirmar que el servicio revivió**

```bash
curl -s https://api-gas.duckdns.org/health
curl -s https://api-gas.duckdns.org/public-config
```

Esperado: `{"ok":true}` y `{"whatsapp":""}`.

---

## PARTE B — FRONTEND

Todo lo de esta parte se hace en `D:\PROGRAMAS\xamp\htdocs\gastritis-frontend`.

### Task 8: Centralizar la dirección del backend

**Files:**
- Create: `src/config.js`
- Modify: `src/LoginScreen.jsx`, `src/AdminApp.jsx`, `src/RecipesApp.jsx`, `src/ChatWidget.jsx`

- [ ] **Step 1: Crear el módulo**

Crear `src/config.js`:

```js
export const BACKEND_URL = "https://api-gas.duckdns.org";
```

- [ ] **Step 2: Reemplazar las cuatro copias**

En cada uno de `src/LoginScreen.jsx`, `src/AdminApp.jsx`, `src/RecipesApp.jsx` y
`src/ChatWidget.jsx`, borrar esta línea:

```js
const BACKEND_URL = "https://api-gas.duckdns.org";
```

y agregar el import debajo de los que ya hay en cada archivo:

```js
import { BACKEND_URL } from "./config";
```

Mismo valor, mismo comportamiento. Evita que un cambio de dominio se aplique en tres
archivos y se olvide el cuarto.

- [ ] **Step 3: Confirmar que compila**

```bash
npm run build
```

Esperado: termina con `built in ...` y sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/config.js src/LoginScreen.jsx src/AdminApp.jsx src/RecipesApp.jsx src/ChatWidget.jsx
git commit -m "refactor: centralize backend url"
```

---

### Task 9: El contador de días

**Files:**
- Create: `src/TrialCounter.jsx`

- [ ] **Step 1: Escribir el componente**

Crear `src/TrialCounter.jsx`:

```jsx
import React from "react";

const MAX_DAYS = 7;

// value: número de 1 a 7, o null para ilimitado.
const TrialCounter = ({ value, onChange }) => {
  const down = () => {
    if (value === null) return onChange(MAX_DAYS);
    onChange(Math.max(1, value - 1));
  };

  const up = () => {
    if (value === null) return;          // ya es ilimitado, no hay nada arriba
    if (value >= MAX_DAYS) return onChange(null);
    onChange(value + 1);
  };

  return (
    <div className="flex items-center gap-1 bg-slate-800 rounded px-2 py-1">
      <button
        type="button"
        onClick={down}
        className="px-2 text-lg leading-none"
        aria-label="Menos días"
      >
        −
      </button>

      <span className="w-24 text-center text-sm">
        {value === null ? "-- ilimitado" : `${value} días`}
      </span>

      <button
        type="button"
        onClick={up}
        className="px-2 text-lg leading-none"
        aria-label="Más días"
      >
        +
      </button>
    </div>
  );
};

export default TrialCounter;
```

Bajar desde 1 se queda en 1. Subir desde 7 pasa a ilimitado. Bajar desde ilimitado vuelve
a 7. Subir desde ilimitado no hace nada.

- [ ] **Step 2: Confirmar que compila**

```bash
npm run build
```

Esperado: termina sin errores. Todavía nadie lo usa, así que Vite no lo incluye en el
paquete; lo que se comprueba aquí es que la sintaxis es válida.

- [ ] **Step 3: Commit**

```bash
git add src/TrialCounter.jsx
git commit -m "feat: add trial days counter component"
```

---

### Task 10: El panel de administración

**Files:**
- Modify: `src/AdminApp.jsx` (reemplazo completo)

- [ ] **Step 1: Reemplazar el archivo entero**

Contenido nuevo de `src/AdminApp.jsx`:

```jsx
import React, { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { BACKEND_URL } from "./config";
import TrialCounter from "./TrialCounter";

const statusLabel = (u) => {
  if (u.status === "disabled") return "Desactivado";
  if (u.status === "unlimited") return "Ilimitado";
  if (u.status === "not_started") return `Sin entrar aún, ${u.daysLeft} días`;
  if (u.status === "active") return `Quedan ${u.daysLeft} días`;
  return "Vencida";
};

const AdminApp = ({ token, logout }) => {
  const [users, setUsers] = useState([]);
  const [newEmail, setNewEmail] = useState("");
  const [newTrialDays, setNewTrialDays] = useState(7);
  const [whatsapp, setWhatsapp] = useState("");
  const [whatsappSaved, setWhatsappSaved] = useState(false);

  const auth = { Authorization: `Bearer ${token}` };
  const jsonAuth = { "Content-Type": "application/json", ...auth };

  const loadUsers = async () => {
    const res = await fetch(`${BACKEND_URL}/admin/users`, { headers: auth });
    const data = await res.json();
    if (Array.isArray(data)) setUsers(data);
  };

  const loadWhatsapp = async () => {
    const res = await fetch(`${BACKEND_URL}/public-config`);
    const data = await res.json();
    setWhatsapp(data.whatsapp ?? "");
  };

  const addUser = async () => {
    if (!newEmail.trim()) return;

    await fetch(`${BACKEND_URL}/admin/add-user`, {
      method: "POST",
      headers: jsonAuth,
      body: JSON.stringify({ email: newEmail.trim(), trialDays: newTrialDays })
    });

    setNewEmail("");
    setNewTrialDays(7);
    loadUsers();
  };

  const updateTrial = async (id, trialDays) => {
    await fetch(`${BACKEND_URL}/admin/user/${id}/trial`, {
      method: "PUT",
      headers: jsonAuth,
      body: JSON.stringify({ trialDays })
    });

    loadUsers();
  };

  const toggleUser = async (id) => {
    await fetch(`${BACKEND_URL}/admin/toggle-user/${id}`, {
      method: "PUT",
      headers: auth
    });

    loadUsers();
  };

  const saveWhatsapp = async () => {
    const res = await fetch(`${BACKEND_URL}/admin/settings`, {
      method: "PUT",
      headers: jsonAuth,
      body: JSON.stringify({ whatsapp: whatsapp.trim() })
    });

    if (res.ok) {
      setWhatsappSaved(true);
      setTimeout(() => setWhatsappSaved(false), 2000);
    }
  };

  useEffect(() => {
    loadUsers();
    loadWhatsapp();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Panel Administrador</h1>
        <button onClick={logout}>
          <LogOut />
        </button>
      </div>

      {/* ALTA DE CLIENTE */}
      <div className="flex flex-wrap gap-2 mb-6 items-center">
        <input
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="Nuevo usuario"
          className="p-2 rounded text-black flex-1 min-w-[200px]"
        />

        <TrialCounter value={newTrialDays} onChange={setNewTrialDays} />

        <button onClick={addUser} className="bg-emerald-600 px-4 py-2 rounded">
          Agregar
        </button>
      </div>

      {/* NÚMERO DE WHATSAPP */}
      <div className="flex flex-wrap gap-2 mb-8 items-center">
        <span className="text-sm text-slate-400">WhatsApp de ventas</span>

        <input
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ""))}
          placeholder="59171234567"
          className="p-2 rounded text-black w-48"
        />

        <button onClick={saveWhatsapp} className="bg-slate-700 px-4 py-2 rounded">
          Guardar
        </button>

        {whatsappSaved && <span className="text-emerald-400 text-sm">Guardado</span>}
      </div>

      {/* LISTA */}
      <div className="space-y-2">
        {users.map((u) => (
          <div
            key={u.id}
            className="bg-slate-800 p-3 rounded flex flex-wrap gap-3 justify-between items-center"
          >
            <div className="min-w-[220px]">
              <div>{u.email}</div>
              <div className="text-xs text-slate-400">{statusLabel(u)}</div>
            </div>

            <div className="flex gap-2 items-center">
              <TrialCounter
                value={u.trialDays ?? null}
                onChange={(days) => updateTrial(u.id, days)}
              />

              <button
                onClick={() => toggleUser(u.id)}
                className="bg-slate-700 text-white px-3 py-2 rounded"
              >
                {u.active ? "Desactivar" : "Activar"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminApp;
```

Tres cambios respecto al archivo viejo, además del contador: `h-screen` pasa a
`min-h-screen` porque la lista ahora crece y antes se cortaba, la clase inexistente
`bg-blue` pasa a `bg-slate-800`, y el campo de WhatsApp descarta todo lo que no sea
dígito mientras se escribe.

- [ ] **Step 2: Confirmar que compila**

```bash
npm run build
```

Esperado: termina sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/AdminApp.jsx
git commit -m "feat: set and edit trial days from admin panel"
```

---

### Task 11: La pantalla de prueba terminada

**Files:**
- Create: `src/TrialExpired.jsx`

- [ ] **Step 1: Escribir el componente**

Crear `src/TrialExpired.jsx`:

```jsx
import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { BACKEND_URL } from "./config";

const MESSAGE = "Hola, mi prueba del plan de gastritis terminó y quiero el acceso completo.";

const TrialExpired = ({ onBack }) => {
  const [whatsapp, setWhatsapp] = useState("");

  useEffect(() => {
    fetch(`${BACKEND_URL}/public-config`)
      .then((res) => res.json())
      .then((data) => setWhatsapp(data.whatsapp ?? ""))
      .catch(() => setWhatsapp(""));
  }, []);

  return (
    <div className="h-screen flex items-center justify-center bg-slate-900 p-6">
      <div className="bg-white p-8 rounded-2xl space-y-5 w-full max-w-sm text-center">
        <Clock size={48} className="text-emerald-600 mx-auto" />

        <h2 className="font-black text-xl">Tu prueba terminó</h2>

        <p className="text-slate-600 text-sm">
          Esperamos que las recetas te hayan ayudado. Para seguir con acceso completo al
          plan y al asistente, escríbenos y te lo activamos.
        </p>

        {whatsapp && (
          <a
            href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(MESSAGE)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-emerald-600 text-white px-4 py-3 rounded-xl font-bold"
          >
            Escribir por WhatsApp
          </a>
        )}

        <button onClick={onBack} className="text-slate-500 text-sm underline">
          Volver al inicio
        </button>
      </div>
    </div>
  );
};

export default TrialExpired;
```

Si el número está vacío, el botón no aparece. Mejor eso que un enlace a `wa.me/` que no
lleva a ningún lado.

- [ ] **Step 2: Confirmar que compila**

```bash
npm run build
```

Esperado: termina sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/TrialExpired.jsx
git commit -m "feat: add trial expired screen"
```

---

### Task 12: Conectar el 403 en toda la aplicación

**Files:**
- Modify: `src/App.jsx` (reemplazo completo)
- Modify: `src/LoginScreen.jsx` (el manejo de la respuesta)
- Modify: `src/RecipesApp.jsx` (la carga de recetas)
- Modify: `src/ChatWidget.jsx` (el envío de mensajes)

- [ ] **Step 1: Reemplazar `src/App.jsx` entero**

```jsx
import React, { useState, useMemo } from "react";
import LoginScreen from "./LoginScreen";
import RecipesApp from "./RecipesApp";
import AdminApp from "./AdminApp";
import TrialExpired from "./TrialExpired";

const decodeToken = (token) => {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

const App = () => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [expired, setExpired] = useState(false);

  const user = useMemo(() => {
    return token ? decodeToken(token) : null;
  }, [token]);

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setExpired(false);
  };

  // Se llama cuando el servidor responde 403 con código TRIAL_EXPIRED.
  const onExpired = () => {
    localStorage.removeItem("token");
    setToken(null);
    setExpired(true);
  };

  if (expired) {
    return <TrialExpired onBack={() => setExpired(false)} />;
  }

  if (!token) {
    return <LoginScreen setToken={setToken} onExpired={onExpired} />;
  }

  if (user?.role === "admin") {
    return <AdminApp token={token} logout={logout} />;
  }

  return <RecipesApp token={token} logout={logout} onExpired={onExpired} />;
};

export default App;
```

El estado de vencimiento vive en `App` porque puede dispararse desde tres lugares
distintos y el resultado es siempre el mismo: borrar el token y mostrar una pantalla.

- [ ] **Step 2: Distinguir el 403 en `src/LoginScreen.jsx`**

Cambiar la firma del componente:

```jsx
const LoginScreen = ({ setToken, onExpired }) => {
```

Y dentro de `handleLogin`, reemplazar el bloque que hoy dice:

```jsx
      if (res.status === 401) {
        setError("Correo no autorizado");
        return;
      }
```

por:

```jsx
      if (res.status === 403) {
        onExpired();
        return;
      }

      if (res.status === 401) {
        setError("Correo no autorizado");
        return;
      }
```

- [ ] **Step 3: Cortar en `src/RecipesApp.jsx`**

Cambiar la firma del componente:

```jsx
const RecipesApp = ({ token, logout, onExpired }) => {
```

Reemplazar el efecto que carga las recetas por:

```jsx
  useEffect(() => {
    fetch(`${BACKEND_URL}/recipes`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 403) {
          onExpired();
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) setMenu(data);
      })
      .catch(() => alert("Error cargando recetas"));
  }, [token]);
```

Y pasar la función al chat, cambiando la línea que hoy dice
`<ChatWidget token={token} currentRecipe={pageData} />` por:

```jsx
      <ChatWidget token={token} currentRecipe={pageData} onExpired={onExpired} />
```

- [ ] **Step 4: Cortar en `src/ChatWidget.jsx`**

Cambiar la firma del componente:

```jsx
const ChatWidget = ({ token, currentRecipe, onExpired }) => {
```

Dentro de `send`, justo después de la línea que obtiene la respuesta
(`const res = await fetch(...)`, cerrando en `});`), agregar antes de leer el cuerpo:

```jsx
      if (res.status === 403) {
        onExpired();
        return;
      }
```

- [ ] **Step 5: Confirmar que compila**

```bash
npm run build
```

Esperado: termina sin errores.

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx src/LoginScreen.jsx src/RecipesApp.jsx src/ChatWidget.jsx
git commit -m "feat: show expired screen when backend rejects access"
```

---

### Task 13: Desplegar el frontend y probar de punta a punta

**Files:** ninguno. Es operación.

- [ ] **Step 1: Empujar el frontend**

```bash
git push
```

Dispara el redespliegue del servicio del frontend, y solo de ese. El backend ya está
arriba desde la Task 7.

- [ ] **Step 2: Configurar el número de WhatsApp**

Entrar al panel como administrador, escribir el número con código de país y sin signos,
por ejemplo `59171234567`, y guardar. Recargar y confirmar que el número sigue ahí.

- [ ] **Step 3: Probar el ciclo completo con una cuenta desechable**

1. Dar de alta un correo de prueba con el contador en 1 día. La lista debe decir
   `Sin entrar aún, 1 días`.
2. Entrar con ese correo en una ventana privada. Las recetas deben cargar.
3. Volver al panel y recargar. La misma fila debe decir ahora `Quedan 1 días`.
4. En el terminal de Postgres, envejecer esa cuenta a mano:

```sh
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -c "UPDATE users SET first_login_at = now() - interval '2 days' WHERE email = 'correo-de-prueba@ejemplo.com';"
```

5. Recargar la ventana privada. Debe aparecer la pantalla de prueba terminada con el
   botón de WhatsApp.
6. En el panel, subir el contador de esa fila hasta `-- ilimitado`.
7. Volver a entrar con ese correo. Debe funcionar de nuevo.

- [ ] **Step 4: Confirmar que las cuentas reales no se movieron**

```sh
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -c "SELECT email, role, active, trial_days FROM users ORDER BY id;"
```

Esperado: las cinco cuentas originales con `trial_days` vacío, que es ilimitado. Solo la
cuenta de prueba debe tener un número.

- [ ] **Step 5: Borrar la cuenta de prueba**

```sh
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -c "DELETE FROM users WHERE email = 'correo-de-prueba@ejemplo.com';"
```

---

## Lo que este plan no hace

- No reorganiza el `index.js` del backend.
- No agrega contraseñas: el correo sigue siendo la credencial, por decisión del dueño.
- No toca Libélula ni el cobro automático.
- No mueve las recetas a la base de datos. Es el trabajo siguiente, con su propio spec.
- No avisa por correo antes de que venza la prueba: no hay servicio de envío.
