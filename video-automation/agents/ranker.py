"""
Ranker Agent — Scores and ranks scraped ideas by viral potential.

Uses Claude API to evaluate each idea on:
  - Hook strength (would someone stop scrolling?)
  - Relatability (broad audience appeal)
  - Shareability (would someone send this to a friend?)
  - Simplicity (can it be explained in 30-60 seconds?)

Also applies engagement-based scoring from scraper metadata.
"""

import json
import os
from anthropic import Anthropic
from .scraper import ScrapedIdea


class RankerAgent:
    """Ranks scraped ideas by viral potential using Claude + engagement signals."""

    BATCH_SIZE = 20  # Number of ideas to rank per API call (saves cost)

    def __init__(self, api_key: str | None = None):
        self.client = Anthropic(api_key=api_key or os.environ.get("ANTHROPIC_API_KEY"))

    def run(self, ideas: list[ScrapedIdea], top_n: int = 5) -> list[ScrapedIdea]:
        """Score all ideas and return the top N ranked by viral potential."""
        if not ideas:
            return []

        # Step 1: Normalize engagement scores (0-30 points)
        self._apply_engagement_scores(ideas)

        # Step 2: Use Claude to score viral potential (0-70 points)
        self._apply_ai_scores(ideas)

        # Step 3: Sort by total score descending
        ideas.sort(key=lambda x: x.score, reverse=True)

        return ideas[:top_n]

    def _apply_engagement_scores(self, ideas: list[ScrapedIdea]):
        """Add up to 30 points based on raw engagement metrics."""
        max_engagement = max((i.engagement for i in ideas), default=1) or 1

        for idea in ideas:
            # Normalize to 0-30 range
            idea.score = (idea.engagement / max_engagement) * 30

    def _apply_ai_scores(self, ideas: list[ScrapedIdea]):
        """Use Claude to score ideas on viral potential (0-70 points)."""
        # Process in batches to minimize API calls
        for i in range(0, len(ideas), self.BATCH_SIZE):
            batch = ideas[i:i + self.BATCH_SIZE]
            self._score_batch(batch)

    def _score_batch(self, batch: list[ScrapedIdea]):
        """Score a batch of ideas in a single API call."""
        ideas_text = "\n".join(
            f"{idx + 1}. {idea.title}"
            for idx, idea in enumerate(batch)
        )

        response = self.client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1024,
            messages=[{
                "role": "user",
                "content": f"""Rate each idea below for short-form video viral potential (TikTok/Reels/Shorts).

Score each from 0-70 based on:
- Hook strength (0-20): Would someone stop scrolling?
- Relatability (0-20): Does it appeal to a broad audience?
- Shareability (0-15): Would someone send this to a friend?
- Simplicity (0-15): Can it be explained in 30-60 seconds?

Ideas:
{ideas_text}

Respond ONLY with a JSON array of objects, one per idea, in order:
[{{"index": 1, "score": 55, "reason": "short reason"}}]

No other text. Just the JSON array."""
            }],
        )

        try:
            text = response.content[0].text.strip()
            # Handle potential markdown code fences
            if text.startswith("```"):
                text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
            scores = json.loads(text)

            for item in scores:
                idx = item["index"] - 1
                if 0 <= idx < len(batch):
                    batch[idx].score += min(item["score"], 70)
        except (json.JSONDecodeError, KeyError, IndexError):
            # If parsing fails, give all items a default AI score of 35
            for idea in batch:
                idea.score += 35
