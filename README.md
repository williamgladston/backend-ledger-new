# Backend Ledger

A production-style **double-entry ledger backend** built with Node.js, Express, and MongoDB. It implements a real banking-style money-transfer system: users have accounts, money moves between them as atomic transactions, and balances are derived from an immutable ledger of CREDIT/DEBIT entries — never from a stored number that can drift out of sync.

The project is intentionally structured like a small fintech service: explicit controllers, models, routes, middleware, an email service, and a strict transactional flow for moving money.

---

## Table of Contents

- [What This Project Is](#what-this-project-is)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
- [Configuration & Environment](#configuration--environment)
- [Running the Project](#running-the-project)
- [Data Models](#data-models)
- [Authentication & Authorization](#authentication--authorization)
- [API Reference](#api-reference)
- [The 10-Step Transfer Flow](#the-10-step-transfer-flow)
- [Email Service](#email-service)
- [Security Notes](#security-notes)
- [Known Quirks & Limitations](#known-quirks--limitations)

---

## What This Project Is

`backend-ledger` is the backend half of a personal-finance / wallet app (the `frontend/` directory is the Vite + React client that pairs with it). Its responsibilities are:

1. **Identity** — register, log in, log out, password reset (with emailed tokens).
2. **Accounts** — each user can have one or more accounts; accounts have a status (`ACTIVE`, `FROZEN`, `CLOSED`) and a currency.
3. **Money movement** — transfer funds between accounts with a strict, idempotent, multi-step flow backed by a MongoDB transaction.
4. **Double-entry ledger** — every transfer writes two immutable ledger rows (one DEBIT, one CREDIT) and a transaction record. Balances are computed on demand from the ledger, not stored.
5. **System-funded onboarding** — a privileged "system user" can credit new accounts with initial funds.

---

## Tech Stack

| Layer | Technology | Why It Was Chosen / Where It's Used |
|---|---|---|
| **Runtime** | Node.js (CommonJS) | The whole server runs on Node. The entry point is `server.js`. |
| **Web framework** | **Express 5** (`express`) | `src/app.js` builds the HTTP server: JSON body parsing, cookie parsing, CORS, and the three route mounts. Express 5 is the actively maintained major version. |
| **Database** | **MongoDB** via **Mongoose 9** (`mongoose`) | All persistence. The connection is opened in `src/config/db.js` using `MONGO_URI` from `.env`. Mongoose gives us schemas, validation, indexes, and — critically — **multi-document ACID transactions** via sessions, which the transfer flow relies on. |
| **Auth** | **JWT** with `jsonwebtoken` | Stateless session tokens signed with `JWT_SECRET`, valid for 3 days. The token is read from the `token` cookie **or** the `Authorization: Bearer …` header (`src/middleware/auth.middleware.js`). |
| **Password hashing** | **bcryptjs** | Used in `src/models/user.model.js` (pre-save hook hashes passwords with cost factor 10) and in `src/controllers/auth.controller.js` (hashing/verifying the password-reset token, and `comparePassword` on login). Pure-JS, no native build step. |
| **Cross-origin** | **cors** | Configured in `src/app.js` with an allow-list built from `FRONTEND_URL` (comma-separated). `credentials: true` so cookies work with the Vite dev server. |
| **Cookies** | `cookie-parser` | Lets the auth middleware read `req.cookies.token`. |
| **Env config** | **dotenv** | Loaded at the very top of `server.js` so `process.env.*` is populated before anything else runs. |
| **Transactional email** | **nodemailer** + **Gmail SMTP with OAuth2** | `src/services/email.service.js` sends registration, transaction success/failure, and password-reset emails through `smtp.gmail.com:465` using a refresh token from `.env`. |
| **Crypto** | Node's built-in `crypto` | Generates the 32-byte random raw password-reset token in `forgotPasswordController`. |
| **Dev runner** | **nodemon** (via `npx`) | `npm run dev` watches files and restarts on change. |

**Why a double-entry ledger?** Storing a `balance` field on an account and incrementing it works until a process crashes, a request times out, or two requests race. By writing immutable DEBIT/CREDIT rows in a MongoDB transaction, the system is self-healing: balances are always `SUM(CREDIT) − SUM(DEBIT)`, computed in `accountSchema.methods.getBalance` using a Mongo aggregation pipeline.

---

## Project Structure

```
backend-ledger-new/
├── server.js                  # Entry point — loads .env, connects to DB, starts app on :3000
├── package.json               # Dependencies and npm scripts
├── .env.example               # Template for required env vars
├── .gitignore                 # Ignores .env and node_modules
├── frontend/                  # Vite + React client (paired with this API)
└── src/
    ├── app.js                 # Express app: CORS, JSON, cookies, route mounts
    ├── config/
    │   └── db.js              # Mongoose connection helper
    ├── controllers/
    │   ├── account.controller.js     # Create/list accounts, get balance
    │   ├── auth.controller.js        # Register, login, logout, forgot/reset password
    │   └── transaction.controller.js # Create transfer, create initial-funds transfer
    ├── middleware/
    │   └── auth.middleware.js        # JWT verification + blacklist check (+ system-user variant)
    ├── models/
    │   ├── user.model.js            # User schema with bcrypt pre-save hook
    │   ├── account.model.js         # Account schema + getBalance() aggregation
    │   ├── ledger.model.js          # Immutable CREDIT/DEBIT rows
    │   ├── transaction.model.js     # Transaction with idempotency key
    │   └── blackList.model.js       # JWT blacklist with TTL = 3 days
    ├── routes/
    │   ├── auth.routes.js           # /api/auth/*
    │   ├── account.routes.js        # /api/accounts/*
    │   └── transaction.routes.js    # /api/transactions/*
    └── services/
        └── email.service.js         # Nodemailer transport + transactional templates
```

---

## Architecture Overview

The server is intentionally small and layered:

- **`server.js`** is a 10-line bootstrapper: load `.env`, connect to MongoDB, hand the `app` over to Express's listener on port 3000.
- **`src/app.js`** builds the Express app: a strict CORS allow-list (with a clear error if a request comes from an unknown origin), `express.json()` for body parsing, `cookieParser`, and three mounted routers.
- **`src/routes/*`** are thin: they map HTTP verbs + paths to controller functions and apply auth middleware where needed.
- **`src/controllers/*`** contain the actual business logic — validation, DB lookups, calling the right model methods, shaping the response.
- **`src/models/*`** define the Mongoose schemas, indexes, instance methods (e.g. `account.getBalance()`, `user.comparePassword()`), and the immutability hooks on the ledger.
- **`src/middleware/auth.middleware.js`** is the gatekeeper: extract token → check it isn't blacklisted → verify signature → load the user → attach to `req.user` (or `req.user` *and* assert `systemUser === true` for the privileged variant).
- **`src/services/email.service.js`** wraps nodemailer with a Gmail OAuth2 transport, a "is SMTP configured?" guard, and four pre-written templates.

A request flows like this:

```
client → CORS → JSON parser → router → authMiddleware (if protected)
       → controller → mongoose models → ledger aggregation → response
                                          ↘ email service (fire-and-forget)
```

---

## Configuration & Environment

Copy `.env.example` to `.env` and fill in real values:

| Variable | Required? | Purpose |
|---|---|---|
| `MONGO_URI` | Yes | MongoDB connection string. The server calls `process.exit(1)` if it can't connect. |
| `JWT_SECRET` | Yes | Secret used to sign and verify JWTs. Use a long, random string. |
| `FRONTEND_URL` | Recommended | Comma-separated allow-list for CORS. Also used as the base URL embedded in password-reset emails. Defaults to `http://localhost:5173` (Vite). |
| `EMAIL_USER` | For email | Gmail address used as the sender. |
| `CLIENT_ID` | For email | Google OAuth client ID. |
| `CLIENT_SECRET` | For email | Google OAuth client secret. |
| `REFRESH_TOKEN` | For email | Gmail OAuth refresh token. If it's a placeholder, the email service logs a warning and becomes a no-op instead of crashing. |

`.env` is git-ignored; only `.env.example` is committed.

---

## Running the Project

```bash
# Install dependencies
npm install

# Development (auto-restart on file change)
npm run dev

# Production
npm start
```

The server listens on **port 3000**. The root route `GET /` returns the text `Ledger Service is up and running` as a health check.

---

## Data Models

### `user` (`src/models/user.model.js`)
- `email` — required, unique, validated by regex, lowercased + trimmed.
- `name` — required.
- `password` — required, min length 6, **`select: false`** (never returned by default queries), hashed automatically by a `pre("save")` hook.
- `systemUser` — boolean, `select: false`, defaults to `false`, `immutable`. Used to gate the "system" endpoints.
- `resetPasswordToken` / `resetPasswordExpires` — both `select: false`. Set during forgot-password, cleared on a successful reset.
- **Instance method** `comparePassword(plain)` — bcrypt compare.
- **Pre-save hook** — hashes the password only when it's modified (so the password-reset flow, which assigns a new plaintext password, also triggers a fresh hash).

### `account` (`src/models/account.model.js`)
- `user` — ObjectId ref to `user`, indexed. A compound `{ user: 1, status: 1 }` index speeds up "list this user's active accounts".
- `status` — enum `ACTIVE | FROZEN | CLOSED` (default `ACTIVE`). The transfer flow refuses to move money into or out of a non-`ACTIVE` account.
- `currency` — defaults to `INR`.
- **Instance method** `getBalance()` — runs a Mongo aggregation that sums CREDITs and DEBITs from the `ledger` collection and returns `CREDIT − DEBIT`. This is the only place the balance is ever computed, which keeps it provably correct even if the system crashes mid-transfer.

### `ledger` (`src/models/ledger.model.js`)
- Stores the actual money movement as **immutable** rows: `{ account, amount, transaction, type: "CREDIT" | "DEBIT" }`.
- Every field is `immutable: true` (Mongoose-level).
- Seven `pre` hooks (`findOneAndUpdate`, `updateOne`, `deleteOne`, `remove`, `deleteMany`, `updateMany`, `findOneAndDelete`, `findOneAndReplace`) all throw a hard error on any attempt to mutate or delete a ledger row. **Once written, a ledger entry can never be edited or removed** — corrections require new reversing entries.
- Indexed on `account` and `transaction`.

### `transaction` (`src/models/transaction.model.js`)
- `fromAccount`, `toAccount` — refs to `account`, both indexed.
- `status` — enum `PENDING | COMPLETED | FAILED | REVERSED`, default `PENDING`.
- `amount` — non-negative.
- `idempotencyKey` — **required, unique, indexed**. The transfer flow rejects duplicates: if a request comes in with the same key it returns the existing transaction's status rather than re-running the side effects.

### `tokenBlackList` (`src/models/blackList.model.js`)
- Stores revoked JWTs. A **TTL index on `createdAt` with `expireAfterSeconds` of 3 days** automatically prunes entries when the underlying JWT would have expired anyway. So the blacklist can never grow unbounded.

---

## Authentication & Authorization

JWTs are issued on register and login (`src/controllers/auth.controller.js`) and set both as a `token` cookie **and** returned in the JSON body (so non-browser clients can put them in `Authorization: Bearer …`).

`src/middleware/auth.middleware.js` exports two middlewares:

1. **`authMiddleware`** — used by almost every protected route. Reads the token from cookie or header, rejects if missing, looks it up in the blacklist, verifies the signature with `JWT_SECRET`, loads the user, and attaches it to `req.user`. Any error → 401.
2. **`authSystemUserMiddleware`** — same flow, but additionally asserts `user.systemUser === true`; otherwise 403. Used only by the initial-funds endpoint.

`POST /api/auth/logout` adds the current token to the blacklist, clears the cookie, and returns 200. The token then becomes unusable for the remainder of its natural 3-day lifetime, after which the TTL index on `tokenBlackList` removes it automatically.

Password reset uses a separate, one-time token:
- `forgotPasswordController` generates a 32-byte random token, stores its **bcrypt hash** on the user (with a 1-hour expiry), and emails the **raw** token in the reset link.
- `resetPasswordController` re-hashes the supplied token, compares against the stored hash, checks expiry, and on success updates the password (the pre-save hook re-hashes it) and clears the reset fields.
- The endpoint **always** returns 200 even if the email doesn't exist, so the API can't be used to enumerate accounts.

---

## API Reference

All routes are JSON. Authenticated routes expect either a `token` cookie or an `Authorization: Bearer <token>` header.

### Auth — `/api/auth` (public)

| Method | Path | Body | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | `{ email, password, name }` | Creates the user, issues a JWT, sets the cookie, fires a welcome email. |
| `POST` | `/api/auth/login` | `{ email, password }` | Verifies credentials, issues a JWT, sets the cookie. |
| `POST` | `/api/auth/logout` | — | Blacklists the current token and clears the cookie. |
| `POST` | `/api/auth/forgot-password` | `{ email }` | If the email exists, emails a 1-hour reset link. Always returns 200. |
| `POST` | `/api/auth/reset-password` | `{ token, email, newPassword }` | Validates the reset token and updates the password. |

### Accounts — `/api/accounts` (authenticated)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/accounts/` | Create a new account for the logged-in user. |
| `GET` | `/api/accounts/` | List the logged-in user's accounts. |
| `GET` | `/api/accounts/balance/:accountId` | Return the live, ledger-derived balance for one of the user's accounts. 404 if the account isn't owned by the caller. |

### Transactions — `/api/transactions` (authenticated)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/transactions/` | Transfer funds. Body: `{ fromAccount, toAccount, amount, idempotencyKey }`. Implements the 10-step flow below. |
| `POST` | `/api/transactions/system/initial-funds` | **System-user only.** Credit an account with initial funds. Body: `{ toAccount, amount, idempotencyKey }`. |

### Health

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Returns the literal string `Ledger Service is up and running`. |

---

## The 10-Step Transfer Flow

`POST /api/transactions/` runs `createTransaction` in `src/controllers/transaction.controller.js`. The controller comment block documents the full sequence, which is the heart of the system:

1. **Validate request** — `fromAccount`, `toAccount`, `amount`, `idempotencyKey` are all required.
2. **Validate idempotency key** — look the key up first. If a transaction with that key already exists, return whatever its current status is (200 for COMPLETED/PENDING, 500 for FAILED/REVERSED). The side effects never run twice.
3. **Check account status** — both `fromAccount` and `toAccount` must exist and be `ACTIVE`.
4. **Derive sender balance from ledger** — call `fromUserAccount.getBalance()` (the aggregation). If it's less than `amount`, return 400.
5. **Create transaction (PENDING)** — inside a Mongoose session, create the `transaction` doc with status `PENDING`.
6. **Create DEBIT ledger entry** — a row in `ledger` for the sender with `type: "DEBIT"`.
7. **Create CREDIT ledger entry** — a row in `ledger` for the receiver with `type: "CREDIT"`.
8. **Mark transaction COMPLETED** — update the transaction's status inside the same session.
9. **Commit the MongoDB session** — `session.commitTransaction()`. If anything in steps 5–8 throws, the session aborts and **none** of the rows are written. This is what makes the move atomic.
10. **Send email notification** — fire-and-forget. The transfer is already committed; SMTP failures must not 500 the API.

> The current implementation has a deliberate `setTimeout(15 * 1000)` between the DEBIT and CREDIT inserts in step 6→7, simulating a slow external dependency (good for testing that the transaction actually rolls back on a crash). It is **not** a production pattern — see "Known Quirks".

### Initial funds

`createInitialFundsTransaction` is the same shape but with two differences: it loads the sender as the caller's *own* account (the system user is supposed to own a single source account), and the flow is wrapped in a session with the explicit `new transactionModel({...})` + `save({ session })` pattern rather than `Model.create([...], { session })`.

---

## Email Service

`src/services/email.service.js` is a single nodemailer transport with four pre-built templates:

- `sendRegistrationEmail(email, name)` — welcome message.
- `sendTransactionEmail(email, name, amount, toAccount)` — transfer success.
- `sendTransactionFailureEmail(email, name, amount, toAccount)` — transfer failure.
- `sendPasswordResetEmail(email, name, resetLink)` — the 1-hour reset link.

The transport uses **Gmail SMTP over 465 with OAuth2** (host/port spelled out explicitly because the `service: "gmail"` shorthand has been flaky across nodemailer versions). On startup, `transporter.verify()` is called only if real credentials are present — if `REFRESH_TOKEN` is missing or still a placeholder, the service logs a warning and turns into a no-op so local dev never has to set up Gmail.

`sendEmail` swallows nothing: it throws on failure, but every caller (registration, transaction success) wraps the call in `.catch(...)` and logs, so an SMTP outage can never break the user-facing request.

---

## Security Notes

- **Passwords** are bcrypt-hashed at cost 10 in a `pre("save")` hook, and the field is `select: false` so it isn't returned by default queries. The login path explicitly opts back in with `.select("+password")`.
- **JWTs** are signed with `JWT_SECRET` from the environment and carry a 3-day expiry. A logout puts the token on a **blacklist with a TTL index** that exactly matches the expiry, so the list can never grow without bound.
- **Password-reset tokens** are random 32-byte hex values; only their **bcrypt hash** is stored on the user, with a 1-hour expiry. The raw token is sent by email and is single-use (cleared on successful reset).
- **CORS** uses a strict, configurable allow-list. Unknown origins are rejected with a clear error.
- **Idempotency keys** are unique at the database level, so two simultaneous identical transfer requests can't both succeed.
- **Ledger immutability** is enforced both at the schema level (`immutable: true` on every field) and via pre-hooks on every update/delete operation. There is no code path that edits a ledger row.
- **Auth ownership**: account-balance and account-fetch endpoints filter by both `_id` and `user: req.user._id`, so a token can never read another user's account even if you know its id.

---

## Known Quirks & Limitations

- **The 15-second sleep in `createTransaction`** — there is a deliberate `setTimeout(15 * 1000)` between the DEBIT and CREDIT ledger writes. This is intended to simulate a slow dependency for testing; the comments make the intent clear, but it should be removed or moved behind a feature flag for any real use.
- **No global error handler / no async error wrapper** — every controller uses `try/catch` only where needed. A few endpoints (e.g. `createTransaction`'s catch) swallow the underlying error and return a generic message. Adding an Express error-handling middleware would surface real failures better.
- **No request validation library** — input checks are hand-rolled. Bringing in `zod` or `joi` would harden the boundary.
- **Two cookie parsers in `package.json`** — `cookie-parser` (used) and `cookieparser` (installed but unused). The latter can be removed.
- **The system-user onboarding is manual** — `systemUser: true` must be set directly in the database; there is no API to grant it. This is intentional, but worth documenting.
- **Email delivery is best-effort** — every email send is fire-and-forget. If Gmail's SMTP is down, users won't get their registration or transaction notifications; the API still succeeds.
- **No automated tests** — `npm test` is the default `echo` placeholder. The flow's logic is testable, but a Jest/Mocha setup is not included.
- **The `console.log(password, this.password)` inside `userSchema.methods.comparePassword`** leaks the candidate password and the bcrypt hash to stdout on every login. It is harmless from a security standpoint (the hash is already in the DB) but should be removed before going anywhere visible.
