from contextlib import asynccontextmanager
from datetime import date

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

import database
import fetcher


# ---------------------------------------------------------------------------
# Scheduled job
# ---------------------------------------------------------------------------

def scheduled_fetch() -> None:
    """Called by APScheduler every day at 10:00 AM local time."""
    print("[scheduler] Running daily HN fetch...")
    entries = fetcher.fetch_top_posts()
    if entries:
        database.upsert_entries(entries)
        print(f"[scheduler] Saved {len(entries)} entries to DB.")
    else:
        print("[scheduler] No entries returned; DB not updated.")


# ---------------------------------------------------------------------------
# App lifespan (startup / shutdown)
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    database.init_db()
    print("[startup] Database initialised.")

    scheduler = BackgroundScheduler()
    scheduler.add_job(
        scheduled_fetch,
        trigger=CronTrigger(hour=10, minute=0),
        id="daily_hn_fetch",
        replace_existing=True,
    )
    scheduler.start()
    print("[startup] Scheduler started — daily fetch at 10:00 AM.")

    yield  # app runs here

    # Shutdown
    scheduler.shutdown(wait=False)
    print("[shutdown] Scheduler stopped.")


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Daily Tech Trends API",
    description="Hacker News digest API powering the daily trends dashboard.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten to your frontend domain in production
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    """Simple liveness check."""
    return {"status": "ok"}


@app.get("/digest/today")
def digest_today(day: str = Query(default=None, description="ISO date (YYYY-MM-DD). Defaults to today.")):
    """
    Return the top-5 HN posts stored for a given date.
    If no data exists for today, triggers an immediate fetch.
    """
    target = day or date.today().isoformat()
    entries = database.get_today(target)

    # Auto-fetch if today has no data yet
    if not entries and target == date.today().isoformat():
        print("[api] No data for today — triggering on-demand fetch.")
        new_entries = fetcher.fetch_top_posts()
        if new_entries:
            database.upsert_entries(new_entries)
            entries = database.get_today(target)

    if not entries:
        raise HTTPException(status_code=404, detail=f"No digest data found for {target}.")

    return {"date": target, "posts": entries}


@app.get("/digest/history")
def digest_history():
    """Return all stored digest entries for charting."""
    entries = database.get_history()
    return {"count": len(entries), "entries": entries}


@app.get("/digest/dates")
def digest_dates():
    """Return the list of dates that have data available."""
    dates = database.get_available_dates()
    return {"dates": dates}


@app.post("/digest/fetch")
def trigger_fetch():
    """Manually trigger a fetch (useful for testing without waiting for 10am)."""
    entries = fetcher.fetch_top_posts()
    if not entries:
        raise HTTPException(status_code=502, detail="Fetch from Hacker News returned no data.")
    database.upsert_entries(entries)
    return {"message": f"Fetched and stored {len(entries)} posts.", "posts": entries}
