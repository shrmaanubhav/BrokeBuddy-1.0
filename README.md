# BrokeBuddy

Full-stack personal finance assistant that combines a React dashboard, an Express/MongoDB API, and a FastAPI + LangGraph service for expense analytics and conversational insights.

## Overview
- Track online and manual UPI transactions with search, caching, and nickname support for frequent payees.
- OTP-based sign-up/login with JWT session cookies, password management, and account deletion.
- Sync historical transactions from the LLM service, enrich them with nicknames, and push formatted data back for downstream analysis.
- ChatBot using an underlying agent to help user talk to their expenses.
- FastAPI layer wraps Groq-hosted LLMs to power the expense chatbot, natural-language querying, and merchant/date extraction.

## Video Demo
https://drive.google.com/file/d/1o93DdkPTtgBXnVGRwTtNTuHS7Dn4QlqZ/view?usp=sharing

## Architecture
```
SEProj/
├── server.js                # Express entrypoint
├── controllers/             # Auth, expense, nickname, profile handlers
├── models/                  # Mongoose schemas (users, transactions, nicknames)
├── routes/                  # REST route registrations
├── frontend/                # React SPA (login, dashboard, chatbot)
├── llm/                     # FastAPI + LangChain chatbot service
├── utils/                   # Helpers for building agent payloads
└── req.txt                  # Python dependencies for the LLM service
```

```
[React SPA] ⇄ (CORS, cookies) ⇄ [Express API] ⇄ [MongoDB]
                                     │
                                     ├─ sync → /expense (FastAPI)
                                     └─ push nicknames → /updateFormattedData (FastAPI)
```

## Features
- **Expense dashboard** – recent transactions, nickname editor, cached search, modal-driven manual entry, and CSV-style layout.
- **Profile management** – update display name, change password, delete account, and trigger a two-month historical sync.
- **FineTuned DistillBert for intent Classification** – Used a sample of 400 prompts for classification training.
- **Chatbot assistant** – LLM answers spend questions, extracts merchants/date ranges, and can log new expenses conversationally.
- **Nickname-to-UPI mapping** – central store in MongoDB updates both dashboard and LLM context automatically.
- **OTP sign-up flow** – Gmail transport sends one-time codes, verified before user creation.

## Prerequisites
- Node.js ≥ 18 and npm
- Python ≥ 3.10 with `pip`
- MongoDB instance (local or remote)
- Gmail account with an App Password for transactional email
- Groq API key (for LangChain `ChatGroq`)
- Optional: Hugging Face token if the hosted intent classifier requires authentication

## Environment Variables
Create a `.env` file in the repository root:

| Variable    | Description                                   |
|-------------|-----------------------------------------------|
| `PORT`      | Express port (defaults to 4000 in code)       |
| `URL`       | MongoDB connection string                     |
| `JWT_SECRET`| Secret for signing auth cookies               |
| `MAIL_USER` | Gmail address that sends OTP emails           |
| `MAIL_PASS` | Gmail App Password (not your account password)|


Create `llm/.env` for the chatbot service:

| Variable  | Description                            |
|-----------|----------------------------------------|
| `API_KEY` | Groq API key used by LangChain clients |

Create `frontend/.env` for the admin login :

| Variable  | Description                            |
|-----------|----------------------------------------|
| `REACT_APP_ADMIN_EMAIL` | Admin's email for login |
| `REACT_APP_ADMIN_PASSWORD` | Admin's password for the app |

Never commit these files to version control.

## Setup
1. **Install backend dependencies**
   ```bash
   npm install
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Install Python dependencies for the LLM service**
   ```bash
   cd llm
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   pip install -r ../req.txt
   ```

4. Ensure MongoDB is running and reachable at the URI you placed in `URL`.

## Running the stack
Use separate terminals (or a process manager) for each service:

1. **Express API (Port 4000)**
   ```bash
   npm install             # if you skipped earlier
   nodemon server.js   # or: node server.js
   ```

2. **React frontend (Port 3000 by default)**
   ```bash
   cd frontend
   npm start               # CRA dev server
   ```

   The dev script in `package.json` points to Next.js; use `npm start` instead.

3. **FastAPI + LLM service (Port 8000)**
   ```bash
   cd llm
   source .venv/bin/activate
   uvicorn app:app --reload --port 8000
   ```

Visit `http://localhost:3000` once all services are up. The frontend talks to the Express API at `http://localhost:4000`, which in turn calls the FastAPI service at `http://localhost:8000`.

## Key API Endpoints

### Auth (`/api/auth`)
| Method | Path         | Description                  |
|--------|--------------|------------------------------|
| POST   | `/signup`    | Register after OTP verify    |
| POST   | `/login`     | Issue JWT cookie             |
| POST   | `/logout`    | Clear auth cookie            |
| POST   | `/sendOTP`   | Email a six-digit OTP        |
| POST   | `/verifyOTP` | Mark temporary user verified |
| POST   | `/resetPass` | Reset password post-OTP      |
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
| POST   | `/api/profile/password`    | Change password                      |
| DELETE | `/api/profile/account`     | Delete account and related data      |
| POST   | `/api/profile/data`        | Trigger 60-day sync from FastAPI     |

### FastAPI service (`http://localhost:8000`)
| Method | Path                    | Description                                       |
|--------|-------------------------|---------------------------------------------------|
| POST   | `/expense`              | Return parsed transactions for an email/date      |
| POST   | `/chat`                 | LLM chatbot response for expense questions        |
| POST   | `/updateData`           | Persist formatted transactions to `data_array.json`|
| POST   | `/updateFormattedData`* | Updates LLM cache with nickname-enriched data     |

`*`Called internally by the Express API; exposed for completeness.

## Data & LLM Flow
- `profile/data` fetches ~60 days of history from `/expense`, upserts into `onlineTransaction`, then rebuilds the chatbot payload.
- Manual additions from the frontend hit `/api/expense/add`, writing to `manualTransaction`.
- Nickname updates rebuild the agent payload via `buildAgentJson` and POST to `/updateFormattedData`, keeping the LLM context in sync.
- Chat queries route through the LangGraph pipeline (`llm/chat.py`) which:
  1. Classifies intent with the Hugging Face model.
  2. Extracts merchants and dates via Groq-hosted LLM prompts.
  3. Aggregates spend metrics from `data_array.json`.
  4. Optionally logs new expenses when intent detection confirms it.

## Architecture Diagram of the Agent
<img width="1024" height="1536" alt="ChatGPT Image Nov 6, 2025 at 02_04_20 PM" src="https://github.com/user-attachments/assets/178afeb3-05cb-49d8-ab53-c4de653044b6" />

