# DevPulse — Internal Tech Issue & Feature Tracker

A collaborative backend platform for software teams to report bugs, suggest features, and coordinate their resolution. Team members register as **contributors** or **maintainers**, log in to receive a JWT, and manage issues through a role-aware REST API.

- **Live API:** https://dev-pulse-azure-ten.vercel.app
- **Repository:** https://github.com/Nurunnabi87/DevPulse

---

## Features

- **JWT authentication** — signup and login with signed tokens; passwords hashed with bcrypt and never returned in any response or log.
- **Role-based authorization** — two roles, `contributor` and `maintainer`, enforced by middleware and business logic.
- **Issue management** — create, read, update, and delete bug reports and feature requests.
- **Sorting & filtering** — list issues by `sort` (newest/oldest), `type`, and `status` via query parameters.
- **Reporter details without JOINs** — each issue embeds its reporter (`id`, `name`, `role`) using a batched second query, per the assignment's raw-SQL constraint.
- **Granular edit rules** — maintainers can edit any issue and change workflow status; contributors can edit only their own issues and only while the status is `open`.
- **Centralized error handling** — every response follows a consistent `{ success, message, ... }` envelope.
- **Strict TypeScript** — no `any` types; typed request/response interfaces throughout.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Runtime | Node.js (24.x LTS) |
| Language | TypeScript (strict mode) |
| Framework | Express.js (modular routers) |
| Database | PostgreSQL (Neon), native `pg` driver only |
| Data access | Raw SQL via `pool.query()` — no ORM, no query builder, no JOINs |
| Auth | `jsonwebtoken` (JWT), `bcrypt` (password hashing) |
| Status codes | `http-status-codes` |
| Dev tooling | `tsx` (watch/run), `dotenv` |

---

## Project Structure

```
src/
├── app.ts                 # Express app: middleware, route mounting, error handlers
├── server.ts              # Entry point: DB connectivity check + listen
├── config/
│   ├── index.ts           # Typed, validated environment configuration
│   ├── db.ts              # Shared pg connection Pool
│   └── initDB.ts          # One-time table creation script (npm run db:init)
├── middleware/
│   ├── auth.ts            # JWT verification + role enforcement
│   ├── globalErrorHandler.ts
│   └── notFound.ts
├── utils/
│   ├── sendResponse.ts    # Standard success-response formatter
│   ├── AppError.ts        # Operational error with HTTP status code
│   └── catchAsync.ts      # Async handler wrapper → next(err)
├── types/
│   └── express.d.ts       # Adds req.user to Express's Request type
└── modules/
    ├── auth/              # interface, validation, service, controller, route
    ├── user/             # user types + reporter lookup service
    └── issue/            # interface, validation, service, controller, route
```

---

## Getting Started (Local)

### Prerequisites
- Node.js 24.x or higher
- A PostgreSQL database (a free [Neon](https://neon.tech) project works well)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your environment file
cp .env.example .env
# then edit .env and set DATABASE_URL, JWT_SECRET, etc.

# 3. Create the database tables (run once)
npm run db:init

# 4. Start the dev server (hot reload)
npm run dev
```

The server starts on `http://localhost:5000` by default.

### Environment Variables

| Variable | Description | Example |
| --- | --- | --- |
| `PORT` | Server port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db?sslmode=require` |
| `JWT_SECRET` | Secret used to sign JWTs | a long random string |
| `JWT_EXPIRES_IN` | Token lifetime | `7d` |
| `BCRYPT_SALT_ROUNDS` | bcrypt cost factor (8–12) | `10` |

### Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start dev server with hot reload (`tsx watch`) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled server (`node dist/server.js`) |
| `npm run typecheck` | Type-check without emitting |
| `npm run db:init` | Create the `users` and `issues` tables |

---

## Authentication

After logging in, attach the returned token to protected requests using the `Authorization` header (the raw token, no `Bearer` prefix is required):

```
Authorization: <JWT_TOKEN>
```

---

## API Endpoints

Base path: `/api`

### Auth

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | Public | Register a new user (`contributor` or `maintainer`) |
| POST | `/api/auth/login` | Public | Authenticate and receive a JWT |

### Issues

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| POST | `/api/issues` | Authenticated | Create a bug report or feature request |
| GET | `/api/issues` | Public | List issues (supports `sort`, `type`, `status` query params) |
| GET | `/api/issues/:id` | Public | Retrieve a single issue |
| PATCH | `/api/issues/:id` | Maintainer (any) / Contributor (own & open) | Update title, description, type (status: maintainer only) |
| DELETE | `/api/issues/:id` | Maintainer only | Permanently delete an issue |

#### Query parameters for `GET /api/issues`

| Param | Values | Default |
| --- | --- | --- |
| `sort` | `newest`, `oldest` | `newest` |
| `type` | `bug`, `feature_request` | (none) |
| `status` | `open`, `in_progress`, `resolved` | (none) |

### Response format

Success:
```json
{ "success": true, "message": "Operation description", "data": "..." }
```

Error:
```json
{ "success": false, "message": "Error description", "errors": "Error details" }
```

---

## Database Schema

> No foreign key constraint on `issues.reporter_id` — reporter existence is validated in application logic, per the assignment specification.

### `users`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | SERIAL | Primary key |
| `name` | VARCHAR(100) | Required |
| `email` | VARCHAR(255) | Required, unique |
| `password` | TEXT | Required, bcrypt hash, never returned |
| `role` | VARCHAR(20) | Default `contributor`; `contributor` or `maintainer` |
| `created_at` | TIMESTAMPTZ | Defaults to insert time |
| `updated_at` | TIMESTAMPTZ | Refreshed on update |

### `issues`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | SERIAL | Primary key |
| `title` | VARCHAR(150) | Required, max 150 chars |
| `description` | TEXT | Required, min 20 chars |
| `type` | VARCHAR(20) | `bug` or `feature_request` |
| `status` | VARCHAR(20) | Default `open`; `open`, `in_progress`, or `resolved` |
| `reporter_id` | INTEGER | References a user id (validated in app logic) |
| `created_at` | TIMESTAMPTZ | Defaults to insert time |
| `updated_at` | TIMESTAMPTZ | Refreshed on update |

---

## License

ISC
