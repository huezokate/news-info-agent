# Daily Tech Trends Agent — CLAUDE.md

## Project Overview

A personal daily tech trends digest agent with a mini dashboard.
Every day at 10am, the backend fetches the top 5 trending posts
from Hacker News, stores them, and the frontend displays them
with data visualizations. The user can access the dashboard anytime.

## Goals

- Fetch top 5 HN posts daily at 10am via APScheduler
- Store results in SQLite so historical data accumulates over time
- Display a dashboard with today's digest + trend charts over time
- CopilotKit chat interface embedded in the dashboard for interacting with the data
- Deployable to Vercel (frontend) + Railway or Render (backend)

## Tech Stack

- **Backend:** Python, FastAPI, APScheduler, SQLite, requests
- **Frontend:** React, CopilotKit, Recharts
- **Data source:** Hacker News Firebase API (free, no auth required)
  - Top stories: `https://hacker-news.firebaseio.com/v0/topstories.json`
  - Item detail: `https://hacker-news.firebaseio.com/v0/item/{id}.json`

## Folder Structure

```
/backend
  main.py          # FastAPI app + APScheduler setup
  fetcher.py       # Hacker News API logic
  database.py      # SQLite setup and queries
  requirements.txt

/frontend
  src/
    App.jsx
    components/
      Dashboard.jsx   # Main layout
      DigestList.jsx  # Today's top 5 with links
      TrendChart.jsx  # Recharts visualization
      CopilotChat.jsx # CopilotKit chat panel
  .env              # COPILOT_API_KEY goes here
```

## Environment Variables

- `COPILOT_PUBLIC_API_KEY` — CopilotKit public API key (frontend `.env`)
- Never hardcode API keys anywhere — always use `.env` files

## Key Behaviors

- Dashboard shows today's top 5 posts with title, score, and source link
- Charts show score trends across days for recurring topics if available
- CopilotKit chat should be able to answer questions like
  "what was the top post this week?" using the stored data
- Backend API exposes endpoints for frontend to consume:
  - `GET /digest/today` → today's top 5
  - `GET /digest/history` → all stored results for charting

## Notes

- SQLite file should persist between deploys (use a volume on Railway/Render)
- Do not hardcode API keys anywhere — always use `.env`
- Keep it simple: this is a learning project, prioritize clarity over complexity
