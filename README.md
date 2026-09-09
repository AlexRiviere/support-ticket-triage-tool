# Support Ticket Triage Tool

A tool for classifying support tickets by category and urgency using Claude (Anthropic API), with a FastAPI backend and a React frontend.

## Tech Stack

- **Backend:** Python 3.14, FastAPI, SQLite, Anthropic SDK (`claude-haiku-4-5`)
- **Frontend:** React (Vite), Tailwind CSS, PapaParse

## Prerequisites

- Python 3.10+
- Node.js (for npm/Vite)
- An Anthropic API key

## Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
```

Create `backend/.env` (see `.env.example`):

```
ANTHROPIC_API_KEY=your_key_here
```

Run the server:

```bash
uvicorn main:app --host 127.0.0.1 --port 8000
```

The SQLite database (`triage.db`) is created automatically on first run — no manual setup needed.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**.

> The frontend dev server is pinned to port 3000 because the backend's CORS config only allows that origin (`backend/main.py`, `allow_origins`). If you change one, change the other (`frontend/vite.config.js`, `server.port`).

## API Endpoints

| Method | Path                        | Description                                                 |
|--------|-----------------------------|--------------------------------------------------------------|
| POST   | `/tickets`                  | Classify and save a batch of tickets (`{text, source}[]`)   |
| GET    | `/tickets`                  | List all tickets, sorted by urgency descending               |
| DELETE | `/tickets/{id}`             | Delete a ticket                                               |
| POST   | `/tickets/{id}/reclassify`  | Re-run classification on one ticket                           |
| GET    | `/export`                   | Download all tickets as CSV                                   |

`POST /tickets` returns three buckets: `tickets` (classified successfully), `skipped` (over the 2000-character limit), and `failed` (API/classification errors) — each skipped/failed item includes the ticket text and a reason.

## Notes

- Batches are capped at 100 tickets and 2000 characters per ticket (`backend/main.py`).
- If the Anthropic API call fails for any reason (bad key, rate limit, etc.), the ticket is not saved and appears in the `failed` bucket instead of being silently misclassified.
