#!/usr/bin/env python3
"""Build a daily .docx report from Google Calendar events.

Reads a normalised events JSON file, applies the rules in config/mapping.yaml,
and renders templates/report_template.docx via docxtpl.

Usage:
    python3 src/build_report.py \
        --events samples/events_sample.json \
        --out output/report_2026-09-02.docx

    # override the derived names after you have confirmed them
    python3 src/build_report.py --events e.json --names "Alice Tan,Bob Lim" --out r.docx

    # inspect the render context without writing a document
    python3 src/build_report.py --events e.json --dump-context
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import date, datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import yaml
from docxtpl import DocxTemplate

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_CONFIG = ROOT / "config" / "mapping.yaml"
DEFAULT_TEMPLATE = ROOT / "templates" / "report_template.docx"


# --------------------------------------------------------------------------
# Event normalisation
# --------------------------------------------------------------------------

def _parse_dt(node, tz: ZoneInfo):
    """Accept the Google Calendar start/end shape and return (datetime, all_day)."""
    if node is None:
        return None, False
    if isinstance(node, str):
        raw, all_day = node, len(node) == 10
    elif "dateTime" in node:
        raw, all_day = node["dateTime"], False
    elif "date" in node:
        raw, all_day = node["date"], True
    else:
        return None, False

    if all_day:
        return datetime.fromisoformat(raw).replace(tzinfo=tz), True
    dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=tz)
    return dt.astimezone(tz), False


def normalise_events(raw, tz: ZoneInfo):
    """Turn the connector's payload into a flat list of dicts."""
    if isinstance(raw, dict):
        raw = raw.get("events") or raw.get("items") or []

    events = []
    for item in raw:
        start, all_day = _parse_dt(item.get("start"), tz)
        end, _ = _parse_dt(item.get("end"), tz)
        attendees = []
        for a in item.get("attendees") or []:
            if isinstance(a, str):
                attendees.append({"email": a, "displayName": ""})
            else:
                attendees.append(
                    {
                        "email": a.get("email", ""),
                        "displayName": a.get("displayName") or a.get("name") or "",
                        "responseStatus": a.get("responseStatus", ""),
                    }
                )
        events.append(
            {
                "title": (item.get("summary") or item.get("title") or "").strip(),
                "description": (item.get("description") or "").strip(),
                "location": (item.get("location") or "").strip(),
                "start": start,
                "end": end,
                "all_day": all_day,
                "attendees": attendees,
            }
        )

    events.sort(key=lambda e: (e["start"] is None, e["start"] or datetime.min.replace(tzinfo=tz)))
    return events


# --------------------------------------------------------------------------
# Rule application
# --------------------------------------------------------------------------

def _matches_any(patterns, text) -> bool:
    return any(re.search(p, text) for p in patterns)


def classify(events, cfg):
    """Attach category + flags to each event; return (kept_events, flag_set)."""
    exclude = cfg.get("exclude") or []
    rules = cfg.get("rules") or []
    default = cfg.get("default") or {}

    kept, flags = [], set()
    for ev in events:
        title = ev["title"]
        if exclude and _matches_any(exclude, title):
            continue

        rule = next((r for r in rules if _matches_any(r.get("match") or [], title)), None)
        if rule:
            ev["category"] = rule.get("category", "General")
            ev["rule"] = rule.get("name", "")
            flags.update(rule.get("flags") or [])
        else:
            ev["category"] = default.get("category", "General")
            ev["rule"] = "default"
            flags.update(default.get("flags") or [])

        kept.append(ev)

    return kept, flags


def derive_names(events, cfg):
    """Pull attendee names off the classified events, per the `names:` config."""
    names_cfg = cfg.get("names") or {}
    allowed = set(names_cfg.get("from_categories") or [])
    excluded = {e.lower() for e in (names_cfg.get("exclude_emails") or [])}
    prefer_display = names_cfg.get("prefer_display_name", True)

    seen, out = set(), []
    for ev in events:
        if allowed and ev.get("category") not in allowed:
            continue
        for a in ev["attendees"]:
            email = (a.get("email") or "").lower()
            if email in excluded:
                continue
            display = a.get("displayName") or ""
            name = display if (prefer_display and display) else (email.split("@")[0] or display)
            if not name:
                continue
            key = name.lower()
            if key not in seen:
                seen.add(key)
                out.append(name)
    return out


def select_wording(cfg, flags, report_date_str):
    """Choose each wording variant based on the raised flags."""
    resolved = {}
    for key, spec in (cfg.get("wording") or {}).items():
        text = spec.get("default", "")
        for entry in spec.get("when") or []:
            if entry.get("flag") in flags:
                text = entry.get("text", text)
                break
        resolved[key] = text.replace("{{ report_date }}", report_date_str)
    return resolved


# --------------------------------------------------------------------------
# Context assembly
# --------------------------------------------------------------------------

def _fmt_time(ev):
    if ev["all_day"]:
        return "All day"
    if not ev["start"]:
        return ""
    start = ev["start"].strftime("%H:%M")
    return f"{start}–{ev['end'].strftime('%H:%M')}" if ev["end"] else start


def build_context(raw_events, cfg, report_date: date, names_override=None):
    tz = ZoneInfo(cfg.get("timezone", "UTC"))
    events = normalise_events(raw_events, tz)
    events, flags = classify(events, cfg)

    report_date_str = report_date.strftime("%-d %B %Y")
    names = names_override if names_override is not None else derive_names(events, cfg)

    # The same exclusions that keep you out of the names list keep you out of
    # the table's attendee column.
    excluded = {e.lower() for e in ((cfg.get("names") or {}).get("exclude_emails") or [])}

    def _attendee_names(ev):
        shown = [
            a["displayName"] or a["email"]
            for a in ev["attendees"]
            if (a.get("email") or "").lower() not in excluded
        ]
        return ", ".join(shown) or "—"

    table_rows = [
        {
            "time": _fmt_time(ev),
            "title": ev["title"],
            "location": ev["location"] or "—",
            "category": ev["category"],
            "attendees": _attendee_names(ev),
        }
        for ev in events
    ]

    return {
        "report_date": report_date_str,
        "report_date_iso": report_date.isoformat(),
        "day_of_week": report_date.strftime("%A"),
        "generated_at": datetime.now(tz).strftime("%-d %B %Y, %H:%M %Z"),
        "names": names,
        "names_joined": ", ".join(names) if names else "—",
        "events": table_rows,
        "event_count": len(table_rows),
        "flags": sorted(flags),
        **select_wording(cfg, flags, report_date_str),
    }


# --------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser(description="Build a daily .docx report from calendar events.")
    ap.add_argument("--events", required=True, help="Path to normalised events JSON.")
    ap.add_argument("--config", default=str(DEFAULT_CONFIG))
    ap.add_argument("--template", default=str(DEFAULT_TEMPLATE))
    ap.add_argument("--out", help="Output .docx path.")
    ap.add_argument("--date", help="Report date as YYYY-MM-DD. Defaults to today.")
    ap.add_argument("--names", help="Comma-separated names, overriding those derived from attendees.")
    ap.add_argument("--dump-context", action="store_true", help="Print the render context and exit.")
    args = ap.parse_args()

    cfg = yaml.safe_load(Path(args.config).read_text())
    raw_events = json.loads(Path(args.events).read_text())
    report_date = date.fromisoformat(args.date) if args.date else datetime.now(
        ZoneInfo(cfg.get("timezone", "UTC"))
    ).date()
    names_override = (
        [n.strip() for n in args.names.split(",") if n.strip()] if args.names is not None else None
    )

    context = build_context(raw_events, cfg, report_date, names_override)

    if args.dump_context:
        print(json.dumps(context, indent=2, ensure_ascii=False))
        return

    if not args.out:
        ap.error("--out is required unless --dump-context is given")

    doc = DocxTemplate(args.template)
    doc.render(context)
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    doc.save(out_path)
    print(f"Wrote {out_path} ({out_path.stat().st_size:,} bytes, {context['event_count']} events)")


if __name__ == "__main__":
    sys.exit(main())
