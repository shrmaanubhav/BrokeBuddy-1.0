# BrokeBuddy

Full-stack personal finance assistant that combines a React dashboard, an Express API, a Prisma-backed database, and a FastAPI + LangGraph service for expense analytics and conversational insights.

## Overview
- Track online and manual UPI transactions with search, caching, and nickname support for frequent payees.
- Google OAuth login with JWT session cookies, profile management, and account deletion.
- Sync historical Gmail transaction alerts, enrich them with nicknames, and push formatted data back for downstream analysis.
- ChatBot using underlying agents to help users talk to their expenses and budgets.
- FastAPI layer wraps Groq-hosted LLMs to power the chatbot, natural-language querying, merchant/date extraction, and budget checks grounded on real transactions.

## Video Demo
https://drive.google.com/file/d/1o93DdkPTtgBXnVGRwTtNTuHS7Dn4QlqZ/view?usp=sharing

## Architecture
```
BrokeBuddy-1.0/
├── server/                  # Express API, Prisma Client, auth/profile/transaction routes
├── web-app/                 # React SPA
├── python/                  # FastAPI + Gmail parser + LangGraph chatbot service
└── test.py                  # Local Gmail API parser smoke test
```

```
[React SPA] ⇄ (CORS, cookies) ⇄ [Express API] ⇄ [Prisma database]
                                     │
                                     ├─ sync → /expense (FastAPI, Gmail API)
                                     └─ push nicknames → /updateFormattedData (FastAPI)
```

## Features
- **Expense dashboard** – recent transactions, nickname editor, cached search, modal-driven manual entry, and CSV-style layout.
- **Profile management** – update display name, delete account, and trigger a two-month historical sync.
- **FineTuned DistillBert for intent Classification** – Used a sample of 400 prompts for classification training.
- **Chatbot assistant** – LLM answers spend questions, extracts merchants/date ranges, and can log new expenses conversationally.
- **Budget agent** – Uses `llm/budgets.json`, compares against actual expenses, and surfaces top related transactions to keep answers grounded.
- **Nickname-to-UPI mapping** – database-backed nickname store updates both dashboard and LLM context automatically.
- **Gmail alert parsing** – transaction sync reads Gmail API messages from `TRANSACTION_SENDER_EMAIL` only, defaulting to `kblalerts@kbl.bank.in`.

## Prerequisites
- Node.js ≥ 18 and npm
- Python 3.11 with `pip`
- Database URL compatible with the current Prisma schema
- Google OAuth credentials with Gmail readonly scope
- Groq API key (for LangChain `ChatGroq`)
- Optional: Hugging Face token if the hosted intent classifier requires authentication

## Environment Variables
Create `server/.env`:

| Variable | Description |
|----------|-------------|
| `PORT` | Express port, usually `4000` |
| `JWT_SECRET` | Secret for signing auth cookies |
| `DATABASE_URL` | Prisma runtime database URL |
| `DIRECT_URL` | Prisma migration/direct database URL |
| `GOOGLE_CLIENT_ID` | Google OAuth client id |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | Google callback URL, for example `http://localhost:4000/api/auth/google/callback` |
| `FRONTEND_URL` | Frontend URL, for example `http://127.0.0.1:3000/BrokeBuddy` |
| `TOKEN_ENCRYPTION_KEY` | 64-character hex key for encrypting Gmail refresh tokens |
| `PYTHON_API_URL` | URL of the Python FastAPI service, for example `http://localhost:5000` |

Create `python/.env`:

| Variable | Description |
|----------|-------------|
| `API_KEY` | Groq API key used by ChatGroq |
| `DATABASE_URL` | Database URL used by the Python Gmail token lookup |
| `GOOGLE_CLIENT_ID` | Google OAuth client id |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `TOKEN_ENCRYPTION_KEY` | Same 64-character hex key used by the server |
| `GMAIL_EMAIL` | Gmail account email address used to fetch transaction emails |
| `GMAIL_APP_PASSWORD` | Gmail app password used by the parser |
| `TRANSACTION_SENDER_EMAIL` | Gmail sender filter for transaction alerts. Defaults to `kblalerts@kbl.bank.in` |

Never commit these files to version control.

## Setup
1. **Install backend dependencies**
   ```bash
   cd server
   npm install
   npx prisma generate
   ```

2. **Install frontend dependencies**
   ```bash
   cd web-app
   npm install
   ```

3. **Install Python dependencies for the FastAPI service**
   ```bash
   cd python
   python3.11 -m venv .venv311
   source .venv311/bin/activate
   pip install -r requirements.txt
   ```

4. Ensure the database in `DATABASE_URL` is reachable and has the Prisma schema applied.

## Running the stack
Use separate terminals (or a process manager) for each service:

1. **Express API (Port 4000)**
   ```bash
   cd server
   npm run dev
   ```

2. **FastAPI service (Port 5000)**
   ```bash
   cd python
   source .venv311/bin/activate
   uvicorn app:app --host 127.0.0.1 --port 5000
   ```

3. **React frontend (Port 3000)**
   ```bash
   cd web-app
   HOST=127.0.0.1 PORT=3000 npm start
   ```

Visit `http://127.0.0.1:3000/BrokeBuddy` once all services are up. The frontend talks to the Express API at `http://localhost:4000`, and the Express API calls FastAPI at `http://localhost:5000`.

## Gmail Parser Smoke Test
`test.py` fetches Gmail API messages using the same sender filter as the production parser.

```bash
cd /Users/adithnr/Documents/GitHub/Agentiiv/BrokeBuddy-1.0
source python/.venv311/bin/activate
PYTHONPATH=python python test.py
```

By default the Gmail query is:

```text
from:kblalerts@kbl.bank.in
```

Override it in `python/.env`:

```env
TRANSACTION_SENDER_EMAIL="alerts@example.com"
```

## Key API Endpoints

### Auth (`/api/auth`)
| Method | Path         | Description                  |
|--------|--------------|------------------------------|
| GET    | `/google`    | Start Google OAuth with Gmail readonly scope |
| GET    | `/google/callback` | Complete Google OAuth and issue JWT cookie |
| GET    | `/checkAuth` | Validate session cookie      |

### Expenses (`/api/expense`)
| Method | Path            | Description                                  |
|--------|-----------------|----------------------------------------------|
| POST   | `/getExp`       | Fetch last 7 days (merged online + manual)   |
| POST   | `/search`       | Filtered search by date range or nickname    |
| POST   | `/add`          | Add manual transaction (nicknames supported) |
| DELETE | `/delete/:id`   | Remove manual transaction                    |

### Nicknames & Profile
| Method | Path                       | Description                          |
|--------|----------------------------|--------------------------------------|
| POST   | `/api/nicknames/get`       | Retrieve nickname map                |
| POST   | `/api/nicknames/save`      | Upsert nickname for a UPI ID         |
| GET    | `/api/profile/me`          | Fetch authenticated profile          |
| POST   | `/api/profile/name`        | Update display name                  |
| DELETE | `/api/profile/account`     | Delete account and related data      |
| POST   | `/api/profile/sync-transactions` | Trigger 60-day sync from FastAPI |

### FastAPI service (`http://localhost:5000`)
| Method | Path                    | Description                                       |
|--------|-------------------------|---------------------------------------------------|
| POST   | `/expense`              | Return parsed transactions for an email/date      |
| POST   | `/chat`                 | LLM chatbot response for expense questions        |
| POST   | `/updateData`           | Persist formatted transactions to `data_array.json`|

## Data & LLM Flow
- `/api/profile/sync-transactions` fetches ~60 days of Gmail transaction alerts from `/expense`, upserts them as email transactions, then rebuilds the chatbot payload.
- Manual additions from the frontend hit `/api/expense/add`, writing manual transactions.
- Nickname updates rebuild the agent payload via `buildAgentJson` and POST to `/updateFormattedData`, keeping the LLM context in sync.
- Chat queries route through the LangGraph pipeline (`llm/chat.py`) which:
  1. Classifies intent with the Hugging Face model.
  2. Extracts merchants and dates via Groq-hosted LLM prompts.
  3. Aggregates spend metrics from `data_array.json` (expense agent).
  4. Runs budget checks against `llm/budgets.json` and actual expenses, surfacing top related transactions (budget agent).
  5. Optionally logs new expenses when intent detection confirms it.

## Budget Data
- Dummy budgets live in `llm/budgets.json` (sample merchant and category caps).
- The FastAPI `/chat` route loads both `data_array.json` and `budgets.json`, so budget queries work out of the box.
- Budget answers are grounded on filtered transactions (top by amount) to avoid hallucinated spend.

## Needs to be done
- Implement add-expense persistence: replace the `add_expense_in_database` placeholder in `llm/utils.py` with a real Express/FastAPI call.
- Frontend: surface budget views and chat support (currently only backend/bot logic is wired).
- Backend: add a CRUD endpoint for budgets (read/write `llm/budgets.json` or a DB model) and plumb it into the chatbot loader.
- History: re-enable/chat history append in `ChatBot.add_to_history` if conversational context is desired.

## Architecture Diagram of the Agent(Without the budget - needs to be updated)
<img width="1024" height="1536" alt="ChatGPT Image Nov 6, 2025 at 02_04_20 PM" src="https://github.com/user-attachments/assets/178afeb3-05cb-49d8-ab53-c4de653044b6" />
