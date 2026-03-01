import hashlib
import requests
import xml.etree.ElementTree as ET
from datetime import date, datetime, timezone
from typing import Optional

# ── Hacker News (Firebase API) ───────────────────────────────────────────────
HN_TOP_STORIES = "https://hacker-news.firebaseio.com/v0/topstories.json"
HN_ITEM        = "https://hacker-news.firebaseio.com/v0/item/{id}.json"

# ── The Hacker News (cybersecurity, RSS feed) ────────────────────────────────
THN_RSS = "https://feeds.feedburner.com/TheHackersNews"

TOP_N   = 5
TIMEOUT = 10  # seconds per request


# ── Hacker News ──────────────────────────────────────────────────────────────

def _fetch_hn_item(hn_id: int) -> Optional[dict]:
    """Fetch a single HN item by ID. Returns None on failure."""
    try:
        resp = requests.get(HN_ITEM.format(id=hn_id), timeout=TIMEOUT)
        resp.raise_for_status()
        return resp.json()
    except Exception as exc:
        print(f"[fetcher] Failed to fetch HN item {hn_id}: {exc}")
        return None


def fetch_hn_posts() -> list[dict]:
    """Fetch the top N posts from Hacker News (news.ycombinator.com)."""
    try:
        resp = requests.get(HN_TOP_STORIES, timeout=TIMEOUT)
        resp.raise_for_status()
        top_ids: list[int] = resp.json()[:TOP_N * 3]  # grab extra in case some fail
    except Exception as exc:
        print(f"[fetcher] Failed to fetch HN top stories list: {exc}")
        return []

    today      = date.today().isoformat()
    fetched_at = datetime.now(timezone.utc).isoformat()
    entries    = []

    for hn_id in top_ids:
        if len(entries) >= TOP_N:
            break
        item = _fetch_hn_item(hn_id)
        if not item or item.get("type") != "story":
            continue
        entries.append({
            "date":       today,
            "rank":       len(entries) + 1,           # 1–5
            "hn_id":      item["id"],
            "title":      item.get("title", "(no title)"),
            "score":      item.get("score", 0),
            "url":        item.get("url") or f"https://news.ycombinator.com/item?id={item['id']}",
            "by":         item.get("by", "unknown"),
            "comments":   item.get("descendants", 0),
            "source":     "hackernews",
            "fetched_at": fetched_at,
        })

    print(f"[fetcher] Fetched {len(entries)} HN posts for {today}")
    return entries


# ── The Hacker News ──────────────────────────────────────────────────────────

def fetch_thn_posts() -> list[dict]:
    """Fetch the top N posts from The Hacker News RSS feed (thehackernews.com)."""
    try:
        resp = requests.get(THN_RSS, timeout=TIMEOUT)
        resp.raise_for_status()
        root = ET.fromstring(resp.content)
    except Exception as exc:
        print(f"[fetcher] Failed to fetch THN RSS: {exc}")
        return []

    today      = date.today().isoformat()
    fetched_at = datetime.now(timezone.utc).isoformat()
    entries    = []

    channel = root.find("channel")
    items   = channel.findall("item") if channel is not None else []

    for item in items[:TOP_N]:
        title = (item.findtext("title") or "(no title)").strip()
        url   = (item.findtext("link")  or "").strip()

        # Author is "email (Name)" — extract just the display name
        raw_author = (
            item.findtext("author")
            or item.findtext("{http://purl.org/dc/elements/1.1/}creator")
            or "THN"
        ).strip()
        by = raw_author.split("(")[-1].rstrip(")").strip() if "(" in raw_author else raw_author or "THN"

        # Stable integer ID derived from the article URL (no HN id exists)
        fake_id = int(hashlib.md5(url.encode()).hexdigest()[:8], 16)

        entries.append({
            "date":       today,
            "rank":       TOP_N + len(entries) + 1,  # 6–10
            "hn_id":      fake_id,
            "title":      title,
            "score":      0,   # editorial site — no community score
            "url":        url,
            "by":         by,
            "comments":   0,
            "source":     "thehackernews",
            "fetched_at": fetched_at,
        })

    print(f"[fetcher] Fetched {len(entries)} THN posts for {today}")
    return entries


# ── Combined ─────────────────────────────────────────────────────────────────

def fetch_top_posts() -> list[dict]:
    """Fetch from both Hacker News and The Hacker News; return combined list."""
    return fetch_hn_posts() + fetch_thn_posts()
