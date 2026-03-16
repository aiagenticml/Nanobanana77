"""
Script Writer Agent — Generates short-form video scripts from ranked ideas.

Outputs a structured script with:
  - Hook (first 3 seconds)
  - Scene-by-scene narration
  - Visual direction for each scene
  - Call to action

Designed for TikTok/Reels/Shorts (30-60 second format).
"""

import json
import os
from dataclasses import dataclass, field, asdict
from anthropic import Anthropic
from .scraper import ScrapedIdea


@dataclass
class Scene:
    narration: str
    visual_keywords: list[str]
    duration_hint: str  # e.g. "3s", "5s"


@dataclass
class VideoScript:
    title: str
    hook: str
    scenes: list[Scene]
    cta: str  # call to action
    total_duration: str
    source_idea: str
    tone: str

    def to_dict(self):
        return asdict(self)

    def to_narration_text(self) -> str:
        """Return the full narration as plain text (for TTS)."""
        parts = [self.hook]
        parts.extend(scene.narration for scene in self.scenes)
        parts.append(self.cta)
        return " ".join(parts)


class ScriptWriterAgent:
    """Generates video scripts from ranked ideas using Claude."""

    def __init__(self, api_key: str | None = None, tone: str = "educational",
                 duration: int = 45):
        self.client = Anthropic(api_key=api_key or os.environ.get("ANTHROPIC_API_KEY"))
        self.tone = tone
        self.duration = duration  # target duration in seconds

    def run(self, ideas: list[ScrapedIdea]) -> list[VideoScript]:
        """Generate a video script for each idea."""
        scripts = []
        for idea in ideas:
            script = self._generate_script(idea)
            if script:
                scripts.append(script)
        return scripts

    def _generate_script(self, idea: ScrapedIdea) -> VideoScript | None:
        """Generate a single video script from an idea."""
        response = self.client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1500,
            messages=[{
                "role": "user",
                "content": f"""Write a short-form video script (TikTok/Reels/Shorts) based on this idea:

IDEA: {idea.title}
TONE: {self.tone}
TARGET DURATION: {self.duration} seconds

Requirements:
- Start with a powerful hook (first 3 seconds) that stops the scroll
- Break into 3-5 scenes with narration and visual direction
- End with a clear call to action (follow, like, comment)
- Keep language conversational and punchy
- Each scene should have visual keywords for stock footage search

Respond ONLY with this JSON structure (no other text):
{{
  "title": "catchy video title",
  "hook": "the opening hook line (3 seconds)",
  "scenes": [
    {{
      "narration": "what the voiceover says",
      "visual_keywords": ["keyword1", "keyword2"],
      "duration_hint": "5s"
    }}
  ],
  "cta": "call to action line",
  "total_duration": "{self.duration}s"
}}"""
            }],
        )

        try:
            text = response.content[0].text.strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
            data = json.loads(text)

            return VideoScript(
                title=data["title"],
                hook=data["hook"],
                scenes=[
                    Scene(
                        narration=s["narration"],
                        visual_keywords=s.get("visual_keywords", []),
                        duration_hint=s.get("duration_hint", "5s"),
                    )
                    for s in data["scenes"]
                ],
                cta=data.get("cta", "Follow for more!"),
                total_duration=data.get("total_duration", f"{self.duration}s"),
                source_idea=idea.title,
                tone=self.tone,
            )
        except (json.JSONDecodeError, KeyError):
            return None
