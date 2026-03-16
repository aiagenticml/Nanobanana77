"""
Scraper Agent — Fetches trending content ideas from free internet sources.

Sources:
  1. Reddit (public JSON API — no auth needed)
  2. RSS feeds (Google News, niche blogs)
  3. Google Trends (via RSS feed)

No paid APIs required. All sources are free and publicly accessible.
"""

import requests
import feedparser
from dataclasses import dataclass, field, asdict
from typing import Optional


@dataclass
class ScrapedIdea:
    title: str
    source: str
    url: str
    score: float = 0.0
    subreddit: Optional[str] = None
    engagement: int = 0
    tags: list[str] = field(default_factory=list)

    def to_dict(self):
        return asdict(self)


class ScraperAgent:
    """Scrapes trending topics from multiple free sources."""

    REDDIT_SUBREDDITS = [
        "personalfinance", "LifeProTips", "todayilearned",
        "Showerthoughts", "explainlikeimfive", "productivity",
        "technology", "science", "YouShouldKnow",
    ]

    RSS_FEEDS = [
        ("Google News - Top", "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en"),
        ("Google News - Business", "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB?hl=en-US"),
        ("Google News - Tech", "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTXpJU0FtVnVHZ0pWVXlnQVAB?hl=en-US"),
    ]

    GOOGLE_TRENDS_RSS = "https://trends.google.com/trending/rss?geo=US"

    HEADERS = {
        "User-Agent": "VideoAutomation/1.0 (educational project)"
    }

    def __init__(self, niche: str = "general", max_per_source: int = 10):
        self.niche = niche
        self.max_per_source = max_per_source

    def run(self) -> list[ScrapedIdea]:
        """Run all scrapers and return combined list of ideas."""
        ideas = []
        ideas.extend(self._scrape_reddit())
        ideas.extend(self._scrape_rss())
        ideas.extend(self._scrape_google_trends())
        return ideas

    def _scrape_reddit(self) -> list[ScrapedIdea]:
        """Fetch top posts from Reddit using the public JSON API (no auth)."""
        ideas = []
        subreddits = self._get_subreddits_for_niche()

        for sub in subreddits:
            try:
                url = f"https://www.reddit.com/r/{sub}/hot.json?limit={self.max_per_source}"
                resp = requests.get(url, headers=self.HEADERS, timeout=10)
                if resp.status_code != 200:
                    continue

                data = resp.json()
                for post in data.get("data", {}).get("children", []):
                    p = post["data"]
                    if p.get("stickied"):
                        continue

                    ideas.append(ScrapedIdea(
                        title=p.get("title", ""),
                        source="reddit",
                        url=f"https://reddit.com{p.get('permalink', '')}",
                        subreddit=sub,
                        engagement=p.get("ups", 0) + p.get("num_comments", 0),
                        tags=self._extract_tags(p.get("title", "")),
                    ))
            except (requests.RequestException, KeyError, ValueError):
                continue

        return ideas

    def _scrape_rss(self) -> list[ScrapedIdea]:
        """Fetch headlines from RSS feeds."""
        ideas = []

        for feed_name, feed_url in self.RSS_FEEDS:
            try:
                feed = feedparser.parse(feed_url)
                for entry in feed.entries[:self.max_per_source]:
                    ideas.append(ScrapedIdea(
                        title=entry.get("title", ""),
                        source=f"rss:{feed_name}",
                        url=entry.get("link", ""),
                        tags=self._extract_tags(entry.get("title", "")),
                    ))
            except Exception:
                continue

        return ideas

    def _scrape_google_trends(self) -> list[ScrapedIdea]:
        """Fetch currently trending searches from Google Trends RSS."""
        ideas = []
        try:
            feed = feedparser.parse(self.GOOGLE_TRENDS_RSS)
            for entry in feed.entries[:self.max_per_source]:
                ideas.append(ScrapedIdea(
                    title=entry.get("title", ""),
                    source="google_trends",
                    url=entry.get("link", ""),
                    engagement=self._parse_traffic(entry.get("ht_approx_traffic", "0")),
                    tags=["trending"],
                ))
        except Exception:
            pass

        return ideas

    def _get_subreddits_for_niche(self) -> list[str]:
        """Return subreddits relevant to the configured niche."""
        niche_map = {
            "finance": ["personalfinance", "FinancialPlanning", "investing", "frugal"],
            "tech": ["technology", "gadgets", "programming", "futurology"],
            "productivity": ["productivity", "getdisciplined", "DecidingToBeBetter"],
            "health": ["fitness", "nutrition", "HealthyFood", "loseit"],
            "education": ["explainlikeimfive", "todayilearned", "YouShouldKnow"],
            "general": self.REDDIT_SUBREDDITS,
        }
        return niche_map.get(self.niche, self.REDDIT_SUBREDDITS)

    def _extract_tags(self, text: str) -> list[str]:
        """Extract simple keyword tags from a title."""
        keywords = [
            "money", "save", "invest", "budget", "tip", "hack", "learn",
            "health", "AI", "tech", "free", "secret", "mistake", "rich",
        ]
        text_lower = text.lower()
        return [kw for kw in keywords if kw.lower() in text_lower]

    @staticmethod
    def _parse_traffic(traffic_str: str) -> int:
        """Parse Google Trends traffic string like '500,000+' into int."""
        try:
            return int(traffic_str.replace(",", "").replace("+", ""))
        except (ValueError, AttributeError):
            return 0
