# Rumi

Monolithic MVC app: React (Vite) frontend + Express backend with MongoDB.

## Setup

1. **Environment**  
   Copy `.env.example` to `.env` and set `MONGODB_URI` (and optionally `PORT`, `VITE_API_URL`).

2. **Backend**  
   ```bash
   cd backend && npm install && npm run dev
   ```
   Server runs at `http://localhost:4000`.

3. **Frontend**  
   From project root:
   ```bash
   npm install && npm run dev
   ```
   App runs at `http://localhost:3000`. API calls are proxied from `/api` to the backend when `VITE_API_URL=/api`.

## Structure

- **Frontend** (`src/`): React app — onboarding (signup, signin, OTP), profile setup.
- **Backend** (`backend/`): MVC
  - `config/db.js` — MongoDB connection
  - `models/User.js` — User schema (profile, preferences, verificationDocuments, trustScore, blockedUsers)
  - `controllers/userController.js` — profile and verification logic
  - `routes/userRoutes.js` — user APIs

## User APIs

| Method | Path | Description |
|--------|------|-------------|
| POST | `/user/register` | Register (email) → returns user with `_id` |
| POST | `/user/create-profile` | Create/complete profile (body + `userId` or `x-user-id`) |
| GET | `/user/profile/:userId?` | Get profile |
| PUT | `/user/update-profile` | Update profile |
| POST | `/user/upload-profile-picture` | Upload profile photo (multipart) |
| POST | `/user/upload-verification` | Upload Aadhar/College ID (multipart, `type`: aadhar \| college_id) |

## Profile flow

1. Sign up → backend `POST /user/register` → store `rumi_user_id` in localStorage → open Profile setup.
2. Profile setup: photo, bio, age, gender, location, lifestyle, budget range, verification file → `create-profile` and optionally `upload-verification`.
