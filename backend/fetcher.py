import email.utils
import hashlib
import html as html_lib
import re
import requests
import xml.etree.ElementTree as ET
from datetime import date, datetime, timedelta, timezone
from typing import Optional

# ── Hacker News (Firebase API) ───────────────────────────────────────────────
HN_TOP_STORIES = "https://hacker-news.firebaseio.com/v0/topstories.json"
HN_ITEM        = "https://hacker-news.firebaseio.com/v0/item/{id}.json"

# ── RSS / Atom feeds (Today's Spread) ───────────────────────────────────────
RSS_FEEDS = {
    "wired":         "https://wired.com/feed/rss",
    "techcrunch":    "https://techcrunch.com/feed/",
    "thehackernews": "https://thehackernews.com/feeds/posts/default",
}

TOP_N        = 5
TIMEOUT      = 10
WINDOW_HOURS = 24
ATOM_NS      = "http://www.w3.org/2005/Atom"
HEADERS      = {"User-Agent": "Mozilla/5.0 (compatible; DailyTrendsBot/1.0)"}
DESC_MAX     = 140   # max chars for article description snippet


# ── Text helpers ──────────────────────────────────────────────────────────────

def _clean_text(s: str, max_len: int = DESC_MAX) -> str:
    """Strip HTML tags, decode entities, collapse whitespace, and truncate."""
    if not s:
        return ""
    s = re.sub(r"<[^>]+>", " ", s)         # strip tags
    s = html_lib.unescape(s)               # &amp; → &  etc.
    s = re.sub(r"\s+", " ", s).strip()
    if len(s) > max_len:
        s = s[:max_len].rstrip() + "…"
    return s


def _parse_date(raw: str) -> Optional[datetime]:
    """Parse RFC 2822 (RSS pubDate) or ISO 8601 (Atom published) to UTC datetime."""
    if not raw:
        return None
    raw = raw.strip()
    try:
        return email.utils.parsedate_to_datetime(raw)
    except Exception:
        pass
    try:
        dt = datetime.fromisoformat(raw)
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except Exception:
        return None


# ── Generic RSS 2.0 / Atom feed parser ───────────────────────────────────────

def _parse_feed(root: ET.Element) -> list[dict]:
    """Return articles from an RSS 2.0 or Atom feed as plain dicts."""
    articles = []
    ns = f"{{{ATOM_NS}}}"

    # ── RSS 2.0 ──────────────────────────────────────────────────────────────
    channel = root.find("channel")
    if channel is not None:
        for item in channel.findall("item"):
            title  = _clean_text(item.findtext("title") or "", max_len=200)
            url    = (item.findtext("link") or "").strip()
            pub    = _parse_date(item.findtext("pubDate") or "")
            raw_by = (
                item.findtext("author")
                or item.findtext("{http://purl.org/dc/elements/1.1/}creator")
                or ""
            ).strip()
            by    = raw_by.split("(")[-1].rstrip(")").strip() if "(" in raw_by else raw_by or "Editorial"
            desc  = _clean_text(item.findtext("description") or "")
            articles.append({"title": title, "url": url, "by": by, "pub_date": pub, "description": desc})
        return articles

    # ── Atom ─────────────────────────────────────────────────────────────────
    entries = root.findall(f"{ns}entry") or root.findall("entry")
    for entry in entries:
        title  = _clean_text(entry.findtext(f"{ns}title") or entry.findtext("title") or "", max_len=200)
        link_el = (
            entry.find(f"{ns}link[@rel='alternate']")
            or entry.find(f"{ns}link")
            or entry.find("link[@rel='alternate']")
            or entry.find("link")
        )
        url    = (link_el.get("href", "") if link_el is not None else "").strip()
        raw_pub = (
            entry.findtext(f"{ns}published") or entry.findtext(f"{ns}updated")
            or entry.findtext("published")   or entry.findtext("updated") or ""
        )
        pub    = _parse_date(raw_pub)
        author_el = entry.find(f"{ns}author") or entry.find("author")
        by     = (
            (author_el.findtext(f"{ns}name") or author_el.findtext("name") or "Editorial").strip()
            if author_el is not None else "Editorial"
        )
        raw_desc = (
            entry.findtext(f"{ns}summary") or entry.findtext(f"{ns}content")
            or entry.findtext("summary")    or entry.findtext("content") or ""
        )
        desc = _clean_text(raw_desc)
        articles.append({"title": title, "url": url, "by": by, "pub_date": pub, "description": desc})

    return articles


# ── Spread selection ──────────────────────────────────────────────────────────

def _select_spread(articles: list[dict]) -> list[tuple[dict, str]]:
    """
    Filter articles to the past WINDOW_HOURS, then return up to 3:
    most recent, middle, and oldest. Falls back to first 3 if none
    fall within the window (e.g. weekends / low-traffic feeds).
    """
    now    = datetime.now(timezone.utc)
    cutoff = now - timedelta(hours=WINDOW_HOURS)
    recent = [a for a in articles if a["pub_date"] and a["pub_date"] >= cutoff]
    pool   = recent if recent else articles[:3]

    if not pool:               return []
    if len(pool) == 1:         return [(pool[0], "newest")]
    if len(pool) == 2:         return [(pool[0], "newest"), (pool[-1], "oldest")]
    return [
        (pool[0],              "newest"),
        (pool[len(pool) // 2], "middle"),
        (pool[-1],             "oldest"),
    ]


# ── Generic spread fetcher ────────────────────────────────────────────────────

def _fetch_rss_spread(feed_url: str, source: str, start_rank: int) -> list[dict]:
    """Fetch an RSS or Atom feed; return up to 3 spread entries with descriptions."""
    try:
        resp = requests.get(feed_url, timeout=TIMEOUT, headers=HEADERS)
        resp.raise_for_status()
        root = ET.fromstring(resp.content)
    except Exception as exc:
        print(f"[fetcher] Failed to fetch {source} ({feed_url}): {exc}")
        return []

    today      = date.today().isoformat()
    fetched_at = datetime.now(timezone.utc).isoformat()
    articles   = _parse_feed(root)
    spread     = _select_spread(articles)
    entries    = []

    for i, (article, slot) in enumerate(spread):
        fake_id = int(hashlib.md5(article["url"].encode()).hexdigest()[:8], 16)
        entries.append({
            "date":        today,
            "rank":        start_rank + i,
            "hn_id":       fake_id,
            "title":       article["title"],
            "score":       0,
            "url":         article["url"],
            "by":          article["by"],
            "comments":    0,
            "source":      source,
            "slot":        slot,
            "description": article["description"],
            "fetched_at":  fetched_at,
        })

    print(f"[fetcher] {source}: {len(entries)} articles  "
          f"(pool={len(articles)}, in-window={len([a for a in articles if a['pub_date'] and a['pub_date'] >= datetime.now(timezone.utc) - timedelta(hours=WINDOW_HOURS)])})")
    return entries


# ── Hacker News ───────────────────────────────────────────────────────────────

def _fetch_hn_item(hn_id: int) -> Optional[dict]:
    try:
        resp = requests.get(HN_ITEM.format(id=hn_id), timeout=TIMEOUT)
        resp.raise_for_status()
        return resp.json()
    except Exception as exc:
        print(f"[fetcher] Failed to fetch HN item {hn_id}: {exc}")
        return None


def fetch_hn_posts() -> list[dict]:
    """Fetch the top N posts from Hacker News."""
    try:
        resp = requests.get(HN_TOP_STORIES, timeout=TIMEOUT)
        resp.raise_for_status()
        top_ids: list[int] = resp.json()[:TOP_N * 3]
    except Exception as exc:
        print(f"[fetcher] Failed to fetch HN top stories: {exc}")
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
            "date":        today,
            "rank":        len(entries) + 1,
            "hn_id":       item["id"],
            "title":       item.get("title", "(no title)"),
            "score":       item.get("score", 0),
            "url":         item.get("url") or f"https://news.ycombinator.com/item?id={item['id']}",
            "by":          item.get("by", "unknown"),
            "comments":    item.get("descendants", 0),
            "source":      "hackernews",
            "slot":        None,
            "description": None,
            "fetched_at":  fetched_at,
        })

    print(f"[fetcher] HN: {len(entries)} top posts for {today}")
    return entries


# ── Combined fetch ────────────────────────────────────────────────────────────

def fetch_top_posts() -> list[dict]:
    """Fetch HN top-5 + Wired/TechCrunch/THN spread (3 each) → up to 14 entries."""
    hn_posts    = fetch_hn_posts()
    next_rank   = len(hn_posts) + 1
    all_entries = list(hn_posts)

    for source, feed_url in RSS_FEEDS.items():
        batch      = _fetch_rss_spread(feed_url, source, start_rank=next_rank)
        all_entries.extend(batch)
        next_rank  += len(batch)

    return all_entries
