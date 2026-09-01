# Comparte Viaje — Base del proyecto

Base para una app de viajes compartidos (publicar/buscar viajes + dividir
gastos entre pasajeros), pensada para deployar en **Vercel**, con
**Supabase** como base de datos y autenticación **propia** basada en
DNI + email + clave.

## Stack

- **Frontend**: React + Vite, React Router
- **Backend**: Node + Express, deployado en Vercel como función serverless
- **DB**: Supabase (Postgres)
- **Auth**: propia. El usuario se registra con **DNI, email y una clave
  alfanumérica de 8 caracteres**. El **DNI se usa como ID del usuario**
  en toda la base de datos. La clave se guarda hasheada con bcrypt, y el
  login devuelve un JWT propio (firmado con `JWT_SECRET`) que el
  frontend adjunta en cada request.

## Estructura

```
comparte-viaje/
├── client/          # React (Vite)
├── server/          # API Express (+ api/index.js para Vercel)
└── supabase/
    └── schema.sql   # esquema de base de datos
```

---

## 1. Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com).
2. Andá a **SQL Editor** y ejecutá el contenido de `supabase/schema.sql`.
3. En **Project Settings → API**, copiá:
   - `Project URL` → `SUPABASE_URL`
   - `service_role` key (¡no la `anon`!) → `SUPABASE_SERVICE_ROLE_KEY`

El backend usa la `service_role` key porque es él quien valida el JWT
propio y decide los permisos.

---

## 2. Autenticación (DNI + email + clave)

No hay proveedor externo: la auth vive enteramente en `server/src/routes/auth.js`.

- **Registro** (`POST /api/auth/register`): recibe `dni`, `email`,
  `password` (y opcionalmente `name`). Valida:
  - DNI: 7 u 8 dígitos, sin puntos.
  - Clave: exactamente 8 caracteres alfanuméricos, con al menos una
    letra y un número (ej: `Ab3dEf7g`).
  - Email con formato válido.
  Si todo es correcto, crea el usuario en `profiles` con **`id = dni`**
  y devuelve un JWT.
- **Login** (`POST /api/auth/login`): recibe `dni` y `password`, valida
  contra el hash guardado (bcrypt) y devuelve un JWT.
- **`GET /api/auth/me`**: devuelve el perfil del usuario a partir del
  token, para que el frontend pueda restaurar la sesión al recargar.

El JWT se guarda en `localStorage` en el cliente y se manda como
`Authorization: Bearer <token>` en cada request autenticado.

### Generar el `JWT_SECRET`

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Pegá el resultado en `server/.env` (dev) y en las variables de entorno
del proyecto de Vercel del server (prod). **Usá un valor distinto y
secreto en cada ambiente** — quien tenga este valor puede firmar tokens
válidos para cualquier usuario.

### Sobre la validación de DNI

La validación actual (7-8 dígitos numéricos) es un chequeo de formato,
no una verificación real de identidad contra un padrón. Si el proyecto
lo necesita más adelante, se puede integrar con un servicio de
verificación de identidad (por ejemplo RENAPER en Argentina) sin tocar
el resto del esquema, ya que el DNI ya es la clave primaria del usuario.

---

## 3. Desarrollo local

```bash
# server
cd server
cp .env.example .env   # completá con tus datos de Supabase y un JWT_SECRET
npm install
npm run dev             # http://localhost:3001

# client (en otra terminal)
cd client
cp .env.example .env
npm install
npm run dev              # http://localhost:5173
```

En dev, Vite proxea `/api` hacia `http://localhost:3001` (ver
`client/vite.config.js`), así que no hace falta setear `VITE_API_URL`.

---

## 4. Deploy en Vercel

Se recomienda crear **dos proyectos de Vercel** a partir del mismo repo de
GitHub:

### Proyecto 1: API (`server/`)

- Root Directory: `server`
- Framework Preset: Other
- Variables de entorno: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
  `JWT_SECRET`, `CLIENT_ORIGIN` (URL del proyecto del cliente, para CORS)
- Vercel detecta automáticamente `server/api/index.js` como función
  serverless. `server/vercel.json` redirige todo el tráfico hacia ahí.

### Proyecto 2: Web (`client/`)

- Root Directory: `client`
- Framework Preset: Vite
- Variables de entorno: `VITE_API_URL` (URL del proyecto de la API)

---

## 5. Cómo sigue creciendo

Ideas para extender esta base:

- Recuperación de clave (por ejemplo, un flujo de reseteo por email con
  un token de un solo uso)
- Verificación real de DNI contra un padrón oficial
- Notificaciones cuando alguien se une a tu viaje (email o push)
- Chat entre pasajeros de un mismo viaje
- Calificaciones de conductores/pasajeros
- Tests (Vitest en el cliente, supertest en el server)
# comparte-viaje
# viajemos
# viajemos
# viajemos
# comparte-viaje
