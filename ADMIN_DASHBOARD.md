# Rumi Admin Dashboard

Full-stack admin console for moderating users, listings, matches, and reports. The **client** lives in `Design Rumi Landing Page/`; the **server** is `backend/` (this repo keeps those names instead of a literal `client/` + `server/` folder rename).

## URLs

- **Admin UI:** [http://localhost:3000/admin](http://localhost:3000/admin) (Vite dev; sign in here to reach the dashboard).
- **Admin API base:** `http://localhost:4000/api/admin/...` (or via Vite proxy: same-origin `/api/admin/...` when `VITE_API_URL=/api`).

## Backend setup

```bash
cd backend
cp .env.example .env   # if you do not already have .env
# Edit .env: MONGO_URI, JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD
npm install
npm run dev             # http://localhost:4000
```

### First-time admin login

1. With **zero** `Admin` documents in MongoDB, the first successful login uses **`ADMIN_USERNAME`** and **`ADMIN_PASSWORD`** from `.env` (defaults: `admin` / `admin123`) and creates the `Admin` record.
2. After that, only admins stored in the `admins` collection can sign in (bcrypt password).

### REST endpoints (all JSON; admin routes require `Authorization: Bearer <admin_jwt>` except login)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/admin/login` | Body: `{ username, password }` → `{ token, admin }` |
| GET | `/api/admin/overview` | Stats + 7-day signup trend |
| GET | `/api/admin/users` | Query: `page`, `limit`, `q`, `city`, `foodPreference`, `accountStatus` |
| GET | `/api/admin/users/:id` | User detail |
| PATCH | `/api/admin/users/:id` | Body: `name`, `city`, `accountStatus`, … |
| DELETE | `/api/admin/users/:id` | Hard delete + cascade |
| GET | `/api/admin/rooms` | Query: `page`, `limit`, `city`, `moderationStatus` |
| PATCH | `/api/admin/rooms/:id` | Body: `{ moderationStatus: 'pending' \| 'approved' \| 'rejected' }` |
| DELETE | `/api/admin/rooms/:id` | Delete listing |
| GET | `/api/admin/matches` | Accepted `Request` rows + compatibility score |
| DELETE | `/api/admin/matches/:id` | Remove match (delete request) |
| GET | `/api/admin/reports` | Query: `page`, `limit`, `status` |
| PATCH | `/api/admin/reports/:id/handle` | Body: `{ action: 'warn' \| 'block' \| 'delete' \| 'dismiss', note? }` |

> The brief asked for `/api/users`, `/api/rooms`, etc. Those are implemented **under `/api/admin/...`** so they do not collide with existing `/user`, `/rooms`, … routes.

### Schema additions

- **User:** `accountStatus` (`active` | `blocked`), `adminWarnings` — blocked users cannot sign in (password or Google).
- **Room:** `moderationStatus` (`pending` | `approved` | `rejected`), default `approved` for existing data.
- **Report:** `adminAction`, `adminNote`, `handledAt`, `handledByAdminId`.
- **Admin:** new collection for admin credentials.

## Frontend setup

```bash
cd "Design Rumi Landing Page"
npm install
npm run dev             # http://localhost:3000 — open /admin
```

### Environment

- **`VITE_API_URL`** (optional): e.g. `http://localhost:4000` so the admin client calls the API directly.
- If you use **`VITE_API_URL=/api`**, Vite proxies `/api/*` to the backend; `/api/admin/*` is forwarded **without** stripping `/api` so it matches Express routes under `/api`.

## Production SPA routing

Host the Vite `dist/` behind a server that serves `index.html` for unknown paths so `/admin` and `/admin/dashboard` load the React app.

## Code layout (admin)

- `Design Rumi Landing Page/src/admin/` — admin UI (layout, pages, `RequireAdmin`).
- `Design Rumi Landing Page/src/services/adminApi.ts` — axios client using `rumi_admin_token`.
- `Design Rumi Landing Page/src/RootRoutes.tsx` — `/admin/*` vs main app.
- `backend/controllers/adminController.js`, `backend/routes/adminApiRoutes.js`, `backend/middleware/adminAuthMiddleware.js`, `backend/models/Admin.js`.
