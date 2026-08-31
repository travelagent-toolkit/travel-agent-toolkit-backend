# Travel Agent Toolkit — Backend (Phase 2A)

REST API backend for the Travel Agent Toolkit SaaS, built for Indian travel agents and small travel agencies. This phase adds a real PostgreSQL-backed API behind the already-live Phase 1 frontend. The frontend is not part of this repository and was not modified.

## 1. Project overview

The backend provides:

- Email/password authentication with JWT
- Agency, user, customer, quotation, quotation-item and itinerary management
- Server-side pricing (selling price is always recalculated from cost price + markup — never trusted from the client)
- Per-agency data isolation (a user can only ever see their own agency's data)
- Basic usage counters and a default FREE subscription per agency, ready for plan limits and billing in a later phase

AI generation, payments, WhatsApp/email integrations and real currency rates are explicitly **out of scope** for this phase.

## 2. Tech stack

- Node.js + Express 5
- PostgreSQL (via `pg`)
- `bcrypt` for password hashing
- `jsonwebtoken` for auth
- `express-validator` for request validation
- `helmet`, `cors`, `express-rate-limit` for baseline security
- `dotenv` for configuration
- `jest` + `supertest` for integration tests

## 3. Folder structure

```
src/
  config/        env loader (fails fast if required vars are missing) and the PostgreSQL pool
  controllers/   thin HTTP handlers — parse req, call a service, shape the response
  middleware/    requireAuth (JWT), centralized error handler, rate limiters, validation handler
  routes/        one router per resource, mounted under /api in routes/index.js
  services/      business logic: auth, pricing, quotation numbering, usage tracking
  models/        SQL queries only — every query that touches agency-owned data is scoped by agency_id
  validators/    express-validator rule sets per resource
  utils/         ApiError, response helpers, async handler wrapper, pricing math
  db/
    migrations/  numbered .sql migration files
    migrate.js   migration runner (idempotent — safe to run on every deploy)
  app.js         Express app: middleware + routes + error handling (no listen())
  server.js      boots the DB check and starts the HTTP server
tests/
  api.test.js    integration tests (Jest + Supertest) against a real database
```

## 4. Local installation

Requirements: Node.js 18+, a running PostgreSQL instance (local or remote).

```bash
git clone <this-repo>
cd travel-agent-toolkit-backend
npm install
cp .env.example .env
# edit .env with your local DATABASE_URL and a JWT_SECRET
npm run migrate
npm run dev
```

The API listens on `http://localhost:4000` by default (or whatever `PORT` you set).

## 5. Environment variables

See `.env.example` for the full list. Summary:

| Variable | Required | Notes |
|---|---|---|
| `PORT` | No | Defaults to `4000` locally. Render sets this automatically. |
| `NODE_ENV` | No | `development`, `production`, or `test`. |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string. Never commit a real value. |
| `DATABASE_SSL` | No | Set to `true` for providers that require SSL (Render does). |
| `JWT_SECRET` | **Yes** | Long random string. Generate with `openssl rand -base64 48`. |
| `JWT_EXPIRES_IN` | No | Defaults to `7d`. |
| `FRONTEND_URL` | No | Exact origin of the deployed frontend, used for CORS. Defaults to `http://localhost:5173`. |
| `BCRYPT_SALT_ROUNDS` | No | Defaults to `10`. |

The app refuses to start (outside of `NODE_ENV=test`) if `DATABASE_URL` or `JWT_SECRET` is missing, rather than running with an insecure default.

## 6. PostgreSQL setup

Any PostgreSQL 13+ instance works, local or hosted. For local development:

```bash
createdb travel_agent_toolkit
```

Then point `DATABASE_URL` at it, e.g.:

```
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/travel_agent_toolkit
```

## 7. Database migration / setup

Migrations live in `src/db/migrations/*.sql` and are applied in filename order by a small custom runner (no external migration framework needed for this phase):

```bash
npm run migrate
```

This is idempotent — it tracks applied migrations in a `schema_migrations` table, so it's safe to run every time the app deploys.

## 8. Development command

```bash
npm run dev
```

Runs the server with `nodemon`, restarting on file changes.

## 9. Production command

```bash
npm start
```

Runs `node src/server.js` directly — this is what Render's Web Service should use as its start command.

## 10. API endpoints

All responses use the shape:

```json
{ "success": true, "data": { } }
```

or

```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "..." } }
```

### Health

| Method | Path | Auth |
|---|---|---|
| GET | `/health` | No |
| GET | `/api/health` | No |

### Auth

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | No | Creates an agency + user, returns a JWT. Rate-limited. |
| POST | `/api/auth/login` | No | Returns a JWT. Rate-limited. |
| GET | `/api/auth/me` | Yes | Returns the authenticated user and their agency. |

### Agency

| Method | Path | Auth |
|---|---|---|
| GET | `/api/agency` | Yes |
| PUT | `/api/agency` | Yes |

### Users

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/users/me` | Yes | |
| PUT | `/api/users/me` | Yes | Only `full_name` and `phone` are updatable. |

### Customers

| Method | Path | Auth |
|---|---|---|
| GET | `/api/customers` | Yes |
| POST | `/api/customers` | Yes |
| GET | `/api/customers/:id` | Yes |
| PUT | `/api/customers/:id` | Yes |
| DELETE | `/api/customers/:id` | Yes |

### Quotations

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/quotations` | Yes | Filter with `?status=` and `?customerId=`. |
| POST | `/api/quotations` | Yes | Accepts nested `items[]`. Selling price is always recalculated server-side from `costPrice` and `markupPercentage`. |
| GET | `/api/quotations/:id` | Yes | Includes `items[]`. |
| PUT | `/api/quotations/:id` | Yes | Partial update; passing `items` replaces the full item list. |
| DELETE | `/api/quotations/:id` | Yes | |

### Itineraries

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/itineraries` | Yes | |
| POST | `/api/itineraries` | Yes | `content` is freeform JSON (day/title/details entries) supplied by the caller — no AI generation in this phase. |
| GET | `/api/itineraries/:id` | Yes | |
| PUT | `/api/itineraries/:id` | Yes | |
| DELETE | `/api/itineraries/:id` | Yes | |

### Usage

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/usage` | Yes | Current calendar month's quotation/itinerary counts for the caller's agency. No plan limits are enforced yet. |

## 11. Render deployment

1. Push this repository to GitHub as `travel-agent-toolkit-backend`.
2. In Render, create a **PostgreSQL** instance first. Copy its **Internal Database URL**.
3. Create a **Web Service** connected to the repo.
   - Build command: `npm install`
   - Start command: `npm start`
   - Add a **Pre-Deploy Command** (or run once manually via the Render shell) of `npm run migrate` so schema changes apply on every deploy.
4. Set environment variables in the Render dashboard:
   - `DATABASE_URL` → the Render PostgreSQL internal URL
   - `DATABASE_SSL` → `true`
   - `JWT_SECRET` → a long random value generated specifically for this environment
   - `FRONTEND_URL` → the exact origin of the deployed Phase 1 frontend (e.g. `https://travel-agent-toolkit.onrender.com`, no trailing slash)
   - `NODE_ENV` → `production`
5. Render provides `PORT` automatically; the app already reads it from the environment.

## 12. Security notes

- Passwords are hashed with bcrypt (`BCRYPT_SALT_ROUNDS`, default 10) and `password_hash` is never selected into any API response.
- JWTs contain only the user id (`sub`) and agency id (`agencyId`) — no email, name, or role information.
- Every model query that touches agency-owned data (customers, quotations, quotation items, itineraries) filters by `agency_id` taken from the verified JWT (`req.user.agencyId`), never from a client-supplied id, so one agency cannot read, modify, or delete another agency's records. Attempting to do so returns `404 NOT_FOUND` rather than `403`, so a caller cannot even confirm another agency's record exists.
- All authentication endpoints are rate-limited (20 requests / 15 minutes / IP) to slow down brute-force and credential-stuffing attempts.
- `helmet` sets standard security headers; CORS is restricted to the single configured `FRONTEND_URL` rather than `*`.
- The centralized error handler never returns a raw database error or stack trace to the client — Postgres error codes are mapped to safe, generic messages, and unexpected errors return a plain `500 INTERNAL_ERROR`.
- Request bodies are capped at 1MB and validated with `express-validator` before touching the database; invalid input never reaches a query.
- `.env` is git-ignored; only `.env.example` (variable names, no values) is committed.

## 13. Testing

An automated integration suite is included:

```bash
npm test
```

This runs Jest + Supertest against the database configured in your `.env` (point it at a disposable/test database — the suite truncates all tables before running). It covers:

- Register / duplicate email / weak password
- Login (success and failure) / `/me` / missing or invalid token
- Customer create/list/get scoped to the caller's agency
- Quotation create with server-side pricing (the ₹43,000 + 20% → ₹51,600 example from the spec), update with pricing recalculation, delete, and the generated quotation number format
- Itinerary create with defaulted optional fields
- Cross-agency access attempts on customers and quotations (expect `404`, not `403` or `200`)
- Agency and user profile updates, confirming protected fields (`id`, `agency_id`, `password_hash`) cannot be overwritten by the client

For manual API testing, a Postman/Insomnia collection can be built directly from the endpoint table in section 10; each authenticated request needs an `Authorization: Bearer <token>` header from a prior `/api/auth/login` or `/api/auth/register` call.

## 14. Known limitations (Phase 2A scope)

- No AI itinerary generation (manual/mock content only, as specified).
- No payment gateway or Razorpay integration; subscriptions default to `FREE` / `ACTIVE` with no enforcement of plan limits yet.
- No password reset / change-password flow.
- No email or WhatsApp sending.
- No live currency conversion.
- `usage` counts are tracked but not yet used to block requests once a plan's limit is reached.
