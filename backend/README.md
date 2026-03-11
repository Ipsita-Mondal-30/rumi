# Rumi Backend

Production-ready Node.js backend for the Rumi flatmate compatibility platform.

## Tech Stack

- Node.js, Express.js
- MongoDB, Mongoose
- JWT (jsonwebtoken), bcrypt
- Socket.io (chat)
- Google Gemini API (optional, for AI compatibility explanations)

## Setup

1. Copy `.env.example` to `.env` in project root and set:
   - `MONGODB_URI`
   - `JWT_SECRET` (strong secret in production)
   - `GEMINI_API_KEY` (optional)

2. Install and run:
   ```bash
   npm install
   npm run dev
   ```

## API Overview

### Auth (`/auth`)
- `POST /auth/register` — Body: `{ email, password, name?, phone? }`
- `POST /auth/login` — Body: `{ email, password }` → returns `token`
- `POST /auth/otp/send` — Body: `{ email }` (simulated OTP)
- `POST /auth/otp/verify` — Body: `{ email, code }`

### User (`/user`) — requires `Authorization: Bearer <token>`
- `GET /user/profile` — current user profile
- `PUT /user/profile` — update profile

### Matches (`/matches`) — requires auth
- `GET /matches` — list compatible users sorted by match %
- `GET /matches/explain?userId=<id>` — match score + Gemini explanation

### Request (`/request`) — requires auth
- `POST /request/send` — Body: `{ toUserId }`
- `POST /request/accept` — Body: `{ requestId }` or `{ fromUserId }`
- `POST /request/reject` — Body: `{ requestId }` or `{ fromUserId }`
- `GET /request/received` — pending requests received
- `GET /request/sent` — requests sent

### Chat (`/chat`) — requires auth
- `GET /chat/history?userId=<id>` — message history (only if connected)

### Report (`/report`) — requires auth
- `POST /report` — Body: `{ reportedUserId, reason, description? }`  
  `reason`: `fake_profile` | `harassment` | `spam`

## Socket.io (Chat)

Connect with auth: `auth: { token: '<jwt>' }` or `query: { token: '<jwt>' }`.

- **Event `message`**: send `{ receiverId, message }`. Allowed only if both users are accepted connections. Message is stored and emitted to the receiver room.

## Matching Algorithm

`services/matchingService.js` computes a weighted score from:
- budget overlap
- food preference, sleep schedule, smoking, cleanliness, guest policy, drinking, pets

Returns `{ matchScore, reasons }`.

## Project Structure

- `config/db.js` — MongoDB connection
- `models/` — User, Request, Message, Report
- `controllers/` — auth, user, match, request, chat, report
- `routes/` — route definitions
- `middleware/authMiddleware.js` — JWT verify, signToken
- `services/matchingService.js` — compatibility score
- `services/geminiService.js` — Gemini compatibility explanation
- `socket/chatHandler.js` — Socket.io chat logic
