#!/usr/bin/env python3
"""
Video Automation Pipeline — CLI Entry Point

Usage:
  python main.py                           # Run full pipeline (general niche, top 5)
  python main.py --niche finance --top 3   # Finance niche, top 3 ideas
  python main.py --tone funny --duration 30
  python main.py --scrape-only             # Just scrape, don't rank or write scripts
"""

import json
import os
import sys
from pathlib import Path

import click
from dotenv import load_dotenv

from agents import ScraperAgent, RankerAgent, ScriptWriterAgent

load_dotenv()

OUTPUT_DIR = Path(__file__).parent / "output"


@click.command()
@click.option("--niche", default="general",
              type=click.Choice(["general", "finance", "tech", "productivity", "health", "education"]),
              help="Content niche to scrape for.")
@click.option("--top", default=5, help="Number of top ideas to write scripts for.")
@click.option("--tone", default="educational",
              type=click.Choice(["educational", "funny", "dramatic", "motivational"]),
              help="Tone of the generated scripts.")
@click.option("--duration", default=45, help="Target video duration in seconds.")
@click.option("--scrape-only", is_flag=True, help="Only scrape ideas, skip ranking and script writing.")
@click.option("--rank-only", is_flag=True, help="Scrape and rank, but skip script writing.")
def main(niche, top, tone, duration, scrape_only, rank_only):
    """Scrape trending ideas, rank them, and generate video scripts."""

    OUTPUT_DIR.mkdir(exist_ok=True)

    # --- Agent 1: Scraper ---
    click.echo(f"\n🔍 Scraper Agent — scanning {niche} sources...")
    scraper = ScraperAgent(niche=niche)
    ideas = scraper.run()
    click.echo(f"   Found {len(ideas)} raw ideas")

    if not ideas:
        click.echo("No ideas found. Try a different niche or check your internet connection.")
        sys.exit(1)

    # Save raw scrape results
    raw_path = OUTPUT_DIR / "1_scraped_ideas.json"
    raw_path.write_text(json.dumps([i.to_dict() for i in ideas], indent=2))
    click.echo(f"   Saved to {raw_path}")

    if scrape_only:
        _print_ideas(ideas[:top])
        return

    # --- Agent 2: Ranker ---
    if not os.environ.get("ANTHROPIC_API_KEY"):
        click.echo("\nError: ANTHROPIC_API_KEY not set. Needed for ranking and script writing.")
        click.echo("Set it in .env or export ANTHROPIC_API_KEY=sk-ant-...")
        sys.exit(1)

    click.echo(f"\n📊 Ranker Agent — scoring {len(ideas)} ideas...")
    ranker = RankerAgent()
    top_ideas = ranker.run(ideas, top_n=top)
    click.echo(f"   Top {len(top_ideas)} ideas selected")

    # Save ranked results
    ranked_path = OUTPUT_DIR / "2_ranked_ideas.json"
    ranked_path.write_text(json.dumps([i.to_dict() for i in top_ideas], indent=2))
    click.echo(f"   Saved to {ranked_path}")

    _print_ideas(top_ideas)

    if rank_only:
        return

    # --- Agent 3: Script Writer ---
    click.echo(f"\n✍️  Script Writer Agent — generating {tone} scripts ({duration}s each)...")
    writer = ScriptWriterAgent(tone=tone, duration=duration)
    scripts = writer.run(top_ideas)
    click.echo(f"   Generated {len(scripts)} scripts")

    # Save scripts
    scripts_path = OUTPUT_DIR / "3_scripts.json"
    scripts_path.write_text(json.dumps([s.to_dict() for s in scripts], indent=2))
    click.echo(f"   Saved to {scripts_path}")

    # Print script previews
    for idx, script in enumerate(scripts, 1):
        click.echo(f"\n{'='*60}")
        click.echo(f"Script {idx}: {script.title}")
        click.echo(f"{'='*60}")
        click.echo(f"Hook: {script.hook}")
        click.echo(f"Scenes: {len(script.scenes)}")
        click.echo(f"CTA: {script.cta}")
        click.echo(f"Duration: {script.total_duration}")
        click.echo(f"\nFull narration:\n{script.to_narration_text()}")

    click.echo(f"\n✅ Done! All outputs saved to {OUTPUT_DIR}/")


def _print_ideas(ideas):
    """Print a summary table of ideas."""
    click.echo(f"\n{'Rank':<6}{'Score':<8}{'Source':<20}{'Title'}")
    click.echo("-" * 80)
    for idx, idea in enumerate(ideas, 1):
        source = idea.source[:18]
        title = idea.title[:50] + ("..." if len(idea.title) > 50 else "")
        click.echo(f"{idx:<6}{idea.score:<8.1f}{source:<20}{title}")


if __name__ == "__main__":
    main()
