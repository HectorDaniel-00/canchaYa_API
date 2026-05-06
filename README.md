# ⚽ CanchaYa — Backend API

> Plataforma de reserva de canchas de fútbol. API REST construida con **NestJS v11**, **PostgreSQL** y **Prisma ORM v7**.

---

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Tecnologías](#-tecnologías)
- [Requisitos](#-requisitos)
- [Instalación](#-instalación)
- [Docker](#-docker)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Base de Datos](#-base-de-datos)
- [Módulos Implementados](#-módulos-implementados)
- [Scripts](#-scripts)
- [Testing](#-testing)
- [Variables de Entorno](#-variables-de-entorno)

---

## 📖 Descripción

**CanchaYa** es una plataforma web que permite a los usuarios encontrar, reservar y pagar canchas de fútbol en línea. Los dueños de canchas pueden publicar sus instalaciones bajo un sistema de suscripciones.

### Funcionalidades principales

| Funcionalidad         | Estado        | Descripción                                       |
| --------------------- | ------------- | ------------------------------------------------- |
| 🔐 Autenticación      | 🔄 En progreso | Login/Registro con email o Google OAuth           |
| 🏟️ Gestión de canchas | 📋 Planificado | CRUD completo con imágenes, ubicación y horarios  |
| 📅 Reservas           | 📋 Planificado | Sistema de disponibilidad por bloques horarios    |
| 💳 Pagos              | 📋 Planificado | Integración con Stripe (reservas + suscripciones) |
| 📱 QR                 | 📋 Planificado | Generación y envío de código QR al confirmar pago |
| 🔔 Notificaciones     | 📋 Planificado | Tiempo real con WebSockets + email + WhatsApp     |
| ⭐ Reseñas            | 📋 Planificado | Calificaciones de canchas por usuarios            |
| 📦 Suscripciones      | 📋 Planificado | Planes Basic, Pro y Premium para publicar canchas |
| 🗺️ Geolocalización    | 📋 Planificado | Búsqueda de canchas por ciudad/ubicación          |

---

## 🛠️ Tecnologías

### Core

| Tecnología                                    | Versión | Uso                       |
| --------------------------------------------- | ------- | ------------------------- |
| [NestJS](https://nestjs.com/)                 | v11     | Framework principal       |
| [TypeScript](https://www.typescriptlang.org/) | ^5.1    | Lenguaje principal        |
| [PostgreSQL](https://www.postgresql.org/)     | 15+     | Base de datos relacional  |
| [Prisma ORM](https://www.prisma.io/)          | v7      | Acceso y migraciones a BD |
| [Node.js](https://nodejs.org/)                | 24      | Runtime (Alpine en Docker)|

### Librerías principales

| Tecnología              | Uso                            |
| ----------------------- | ------------------------------ |
| `@prisma/adapter-pg`    | Adaptador PostgreSQL nativo    |
| `@nestjs/jwt`           | Generación y validación de JWT |
| `bcryptjs`              | Hash de contraseñas            |
| `class-validator`       | Validación de DTOs             |
| `class-transformer`     | Transformación de payloads     |
| `@nestjs/swagger`       | Documentación automática API   |

---

## 📌 Requisitos

- **Node.js** v24+ o **Docker** + Docker Compose
- **PostgreSQL** 15+ (o usar Docker)
- **npm** v9+

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/canchaya-backend.git
cd canchaya-backend
```

### 2. Levantar base de datos con Docker

```bash
docker compose up -d
```

### 3. Instalar dependencias (desde `app/`)

```bash
cd app
npm install
```

### 4. Configurar variables de entorno

```bash
cp ../.env .env
```

Edita `app/.env` con tus credenciales. Las variables reales se toman del archivo `.env` en la raíz.

### 5. Generar cliente Prisma y ejecutar migraciones

```bash
npx prisma generate
npx prisma migrate dev
```

### 6. (Opcional) Poblar base de datos

```bash
npm run seed
```

### 7. Iniciar en modo desarrollo

```bash
npm run start:dev
```

La API estará disponible en: `http://localhost:3007/v1/api`

---

## 🐳 Docker

### Levantar todo el proyecto (app + base de datos)

```bash
# Desde la raíz del proyecto
docker compose up -d
```

### Servicios incluidos

| Servicio   | Imagen            | Puerto | Descripción                |
| ---------- | ----------------- | ------ | -------------------------- |
| `db`       | postgres:15-alpine| 5432   | Base de datos PostgreSQL   |
| `app`      | Node 24 Alpine    | 3007   | Aplicación NestJS          |

---

## 📁 Estructura del Proyecto

```
Backend/
├── docker-compose.yaml       ← Ejecutar desde aquí
├── .env                     ← Variables de entorno (raíz)
├── app/                     ← Todo el código y comandos npm
│   ├── src/
│   │   ├── main.ts                 Entry point; prefijo global `v1/api`
│   │   ├── app.module.ts           Imports: PrismaModule, UsersModule
│   │   ├── config/prisma/
│   │   │   ├── prisma.service.ts   PrismaService con @prisma/adapter-pg
│   │   │   └── prisma.module.ts
│   │   ├── common/                 Interceptors, filters, decorators, enums
│   │   ├── modules/
│   │   │   └── users/              Único módulo implementado
│   │   │       ├── dto/
│   │   │       ├── entities/
│   │   │       ├── users.controller.ts
│   │   │       ├── users.service.ts
│   │   │       └── users.module.ts
│   │   └── generated/prisma/       Cliente Prisma generado (gitignored)
│   ├── prisma/
│   │   ├── schema.prisma           Modelos: User, Court, TimeSlot, Booking, etc.
│   │   └── seed.ts                 Datos de prueba
│   ├── test/                       Configuración de tests
│   ├── .env                        Variables locales (vacío, usa raíz)
│   └── package.json
└── AGENTS.md                 Instrucciones para agentes de IA
```

---

## 🗄️ Base de Datos

### Modelos (Prisma Schema)

| Modelo         | Key Fields                                    | Relations                         |
| -------------- | --------------------------------------------- | ---------------------------------- |
| **User**       | id (uuid), email, phone, role (ADMIN/OWNER/PLAYER) | courts[], bookings[], reviews[], subscription? |
| **Court**      | id, price, surface (SYNTHETIC/NATURAL/FUTSAL) | owner→User, timeSlots[], bookings[] |
| **TimeSlot**   | id, startTime, endTime, isBooked              | court→Court, booking?              |
| **Booking**    | id, date, status (PENDING/CONFIRMED/CANCELLED)| user→User, court→Court, timeSlot→TimeSlot |
| **Payment**    | id, amount, status (PENDING/PAID/REFUNDED)    | booking→Booking (unique)           |
| **Review**     | id, rating, comment                           | user→User, court→Court             |
| **Subscription**| id, plan (BASIC/PRO/PREMIUM), status          | user→User (unique)                 |
| **Notification**| id, title, message, read                      | user→User                          |

### Comandos útiles

```bash
# Desde app/
npx prisma generate          # Generar cliente
npx prisma migrate dev       # Crear y aplicar migración
npx prisma migrate deploy    # Aplicar migraciones (producción)
npx prisma studio            # GUI de base de datos
npm run seed                 # Poblar datos de prueba
```

---

## 🧩 Módulos Implementados

Base URL: `http://localhost:3007/v1/api`

### `AuthModule` ✅

Autenticación con JWT y refresh tokens en cookies HttpOnly.

| Método | Endpoint                  | Descripción                | Auth | Rate Limit     |
| ------ | ------------------------- | -------------------------- | ---- | -------------- |
| POST   | `/auth/register`          | Registrar usuario          | ❌   | 3 req/min     |
| POST   | `/auth/login`             | Iniciar sesión             | ❌   | 5 req/min     |
| POST   | `/auth/refresh`           | Renovar access token       | ❌   | 10 req/min    |
| POST   | `/auth/logout`            | Cerrar sesión              | ✅   | -             |
| POST   | `/auth/change-password`   | Cambiar contraseña         | ✅   | -             |

**Notas:**
- `register` y `login` retornan `{ user, accessToken }` y setean `refreshToken` en cookie HttpOnly
- `refresh` lee el `refreshToken` desde cookie y retorna nuevo `{ accessToken }`
- `logout` limpia la cookie y invalida el refresh token

---

### `UsersModule` ✅

Gestión de usuarios con paginación y búsqueda.

| Método | Endpoint                  | Descripción                     | Auth        |
| ------ | ------------------------- | ------------------------------- | ----------- |
| POST   | `/users`                  | Crear usuario                   | ✅          |
| GET    | `/users`                  | Listar usuarios (paginado)      | ✅          |
| GET    | `/users/search?email=`    | Buscar usuario por email        | ✅          |
| GET    | `/users/:id`              | Obtener usuario por ID          | ✅          |
| PATCH  | `/users/:id`              | Actualizar usuario             | ✅          |
| PATCH  | `/users/:id/password`     | Cambiar contraseña              | ✅          |
| DELETE | `/users/:id`              | Eliminar usuario                | ✅ ADMIN    |
| POST   | `/users/:id/restore`      | Restaurar usuario eliminado     | ✅ ADMIN    |

**Query params para `GET /users`:**
- `page` (default: 1)
- `limit` (default: 10)
- `search` (búsqueda por nombre o email)

**Respuesta paginada:**
```json
{
  "data": [ ... ],
  "meta": { "total": 100, "page": 1, "limit": 10, "totalPages": 10 }
}
```

---

### `CourtsModule` ✅

Gestión de canchas de fútbol.

| Método | Endpoint         | Descripción           | Auth |
| ------ | ---------------- | --------------------- | ---- |
| POST   | `/courts`        | Crear cancha          | ✅   |
| GET    | `/courts`        | Listar canchas        | ✅   |
| GET    | `/courts/:id`    | Obtener cancha por ID | ✅   |
| PATCH  | `/courts/:id`    | Actualizar cancha     | ✅   |
| DELETE | `/courts/:id`    | Eliminar cancha       | ✅   |

---

### Módulos planificados (no implementados aún)

- **BookingsModule** — Sistema de reservas y disponibilidad
- **PaymentsModule** — Integración con Stripe
- **SubscriptionsModule** — Suscripciones
- **ReviewsModule** — Calificaciones
- **NotificationsModule** — Notificaciones en tiempo real

---

## 📜 Scripts

Todos los comandos se ejecutan desde `app/`:

### Desarrollo

```bash
npm run start:dev      # Servidor con hot-reload
npm run start:debug    # Servidor con debug
npm run start:prod     # Producción (después de build)
```

### Build

```bash
npm run build          # Compilar TypeScript
```

### Calidad de código

```bash
npm run lint           # ESLint
npm run lint --fix     # ESLint con auto-fix
npm run format         # Prettier
```

### Prisma

```bash
npx prisma generate    # Generar cliente Prisma
npx prisma migrate dev # Migración en desarrollo
npm run seed           # Poblar base de datos
```

---

## 🧪 Testing

```bash
npm run test           # Tests unitarios
npm run test -- -t "pattern"  # Test específico
npm run test:e2e       # Tests end-to-end
```

- **Unit tests**: Jest, patrón `*.spec.ts`
- **E2E tests**: Configuración en `test/jest-e2e.json`

---

## 🔑 Variables de Entorno

El archivo `.env` en la **raíz** del proyecto contiene las variables reales. El archivo `app/.env` está vacío (las variables se montan vía Docker).

```env
# ── APP ─────────────────────────────────────
APP_PORT=3007
NODE_ENV=development

# ── DATABASE ─────────────────────────────────
DATABASE_URL="postgresql://postgres:password@localhost:5432/canchaya_db?schema=public"

# ── JWT ──────────────────────────────────────
JWT_SECRET=tu_clave_secreta_jwt
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=tu_clave_secreta_refresh
JWT_REFRESH_EXPIRES_IN=7d

# ── GOOGLE OAUTH ─────────────────────────────
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret

# ── STRIPE ───────────────────────────────────
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ── CLOUDINARY ────────────────────────────────
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# ── REDIS ─────────────────────────────────────
REDIS_HOST=localhost
REDIS_PORT=6379

# ── EMAIL ─────────────────────────────────────
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=tu_email@gmail.com
MAIL_PASSWORD=tu_app_password

# ── TWILIO (WhatsApp) ─────────────────────────
TWILIO_ACCOUNT_SID=tu_account_sid
TWILIO_AUTH_TOKEN=tu_auth_token
```

> ⚠️ **Nunca subas el archivo `.env` al repositorio.**

---

## 📝 Notas Importantes

- **Prisma client output** está en `src/generated/prisma/` (excluido en `.gitignore`)
- Siempre ejecuta `npx prisma generate` después de cambios en el schema
- El proyecto usa `@prisma/adapter-pg` (no el driver nativo de Prisma)
- API base path: `v1/api` (configurado en `main.ts`)
- Solo el módulo `users` está implementado actualmente

---

## 🤝 Contribución

```bash
git checkout -b feature/nombre-de-la-feature
git commit -m "feat: descripción del cambio"
git push origin feature/nombre-de-la-feature
```

### Convención de commits

| Prefijo     | Uso                                         |
| ----------- | ------------------------------------------- |
| `feat:`     | Nueva funcionalidad                         |
| `fix:`      | Corrección de bug                           |
| `docs:`     | Cambios en documentación                    |
| `refactor:` | Refactorización sin cambio de funcionalidad |
| `test:`     | Agregar o modificar tests                   |
| `chore:`    | Cambios de configuración                    |

---

## 📝 Licencia

Este proyecto es privado y su uso está restringido al equipo de desarrollo de **CanchaYa**.

---

<div align="center">
  <strong>⚽ CanchaYa — Reserva tu cancha en segundos</strong><br/>
  Construido con ❤️ usando NestJS + PostgreSQL + Prisma
</div>
