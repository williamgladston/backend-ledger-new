# Backend Ledger — Frontend

React + Vite + TypeScript SPA that consumes every endpoint of the
`backend-ledger` Express service.

## Setup

```bash
cd backend-ledger/frontend
cp .env.example .env       # then edit VITE_API_BASE_URL
npm install
npm run dev
```

The app expects the backend running on the URL in `VITE_API_BASE_URL`
(default `http://localhost:3000`).

## Backend coverage

| Screen | Endpoint | Method |
| --- | --- | --- |
| Login | `/api/auth/login` | POST |
| Register | `/api/auth/register` | POST |
| Logout | `/api/auth/logout` | POST |
| Forgot password | `/api/auth/forgot-password` | POST |
| Reset password | `/api/auth/reset-password` | POST |
| Create account | `/api/accounts/` | POST |
| List accounts | `/api/accounts/` | GET |
| Account balance | `/api/accounts/balance/:id` | GET |
| Send money | `/api/transactions/` | POST |
| Initial funds (system) | `/api/transactions/system/initial-funds` | POST |

`Dashboard` and `Transactions` show an explicit empty state until a
`GET /api/transactions` endpoint is added to the backend.