import requests
from datetime import date, datetime, timezone
from typing import Optional

HN_TOP_STORIES = "https://hacker-news.firebaseio.com/v0/topstories.json"
HN_ITEM        = "https://hacker-news.firebaseio.com/v0/item/{id}.json"
TOP_N          = 5
TIMEOUT        = 10  # seconds per request


def _fetch_item(hn_id: int) -> Optional[dict]:
    """Fetch a single HN item by ID. Returns None on failure."""
    try:
        resp = requests.get(HN_ITEM.format(id=hn_id), timeout=TIMEOUT)
        resp.raise_for_status()
        return resp.json()
    except Exception as exc:
        print(f"[fetcher] Failed to fetch item {hn_id}: {exc}")
        return None


def fetch_top_posts() -> list[dict]:
    """
    Fetch the top N Hacker News posts and return them as a list of dicts
    ready to be inserted into the database.
    """
    try:
        resp = requests.get(HN_TOP_STORIES, timeout=TIMEOUT)
        resp.raise_for_status()
        top_ids: list[int] = resp.json()[:TOP_N * 3]  # grab extra in case some fail
    except Exception as exc:
        print(f"[fetcher] Failed to fetch top stories list: {exc}")
        return []

    today      = date.today().isoformat()
    fetched_at = datetime.now(timezone.utc).isoformat()
    entries    = []

    for hn_id in top_ids:
        if len(entries) >= TOP_N:
            break

        item = _fetch_item(hn_id)
        if not item or item.get("type") != "story":
            continue

        entries.append({
            "date":       today,
            "rank":       len(entries) + 1,
            "hn_id":      item["id"],
            "title":      item.get("title", "(no title)"),
            "score":      item.get("score", 0),
            "url":        item.get("url") or f"https://news.ycombinator.com/item?id={item['id']}",
            "by":         item.get("by", "unknown"),
            "comments":   item.get("descendants", 0),
            "fetched_at": fetched_at,
        })

    print(f"[fetcher] Fetched {len(entries)} posts for {today}")
    return entries
