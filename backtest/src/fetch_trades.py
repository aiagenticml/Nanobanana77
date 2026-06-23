"""
Congressional trade data loader — multi-source cascade.

Sources tried in order (first success wins):
  1. QuiverQuant API  — richest data, includes committee; requires --api-key
  2. House Stock Watcher (housestockwatcher.com/api) — keyless, House only
  3. Senate Stock Watcher (senatestockwatcher.com/api/transactions) — keyless, Senate only
  4. Seed CSV  — curated local fallback with committee data already populated

Sources 2 & 3 don't include committee assignments; these are derived via
POLITICIAN_COMMITTEE_MAP, a static lookup updated from public committee records.
"""
import io
import os
import re
import urllib.request

import pandas as pd
import requests

_QUIVER_BASE = "https://api.quiverquant.com/beta"
_HOUSE_WATCHER = "https://housestockwatcher.com/api"
_SENATE_WATCHER = "https://senatestockwatcher.com/api/transactions"
_SEED_PATH = os.path.join(os.path.dirname(__file__), "../data/congress_trades_seed.csv")

# Static committee lookup.  House/Senate watcher APIs don't provide this field.
# Covers every politician in the seed dataset + well-known additional members.
# Format: "Politician Name" -> ("Committee Name", "Party", "Chamber")
POLITICIAN_COMMITTEE_MAP = {
    # Intelligence (HPSCI / SSCI)
    "Nancy Pelosi":        ("Rules",             "D", "House"),
    "Dan Crenshaw":        ("Intelligence",      "R", "House"),
    "Jim Himes":           ("Intelligence",      "D", "House"),
    "Mike Turner":         ("Intelligence",      "R", "House"),
    "Adam Schiff":         ("Intelligence",      "D", "House"),
    "Angus King":          ("Intelligence",      "D", "Senate"),
    "Richard Burr":        ("Intelligence",      "R", "Senate"),
    "Mark Warner":         ("Intelligence",      "D", "Senate"),
    "Marco Rubio":         ("Intelligence",      "R", "Senate"),
    "Ron Wyden":           ("Intelligence",      "D", "Senate"),
    # Armed Services
    "Michael McCaul":      ("Armed Services",    "R", "House"),
    "Ro Khanna":           ("Armed Services",    "D", "House"),
    "Austin Scott":        ("Armed Services",    "R", "House"),
    "Jack Reed":           ("Armed Services",    "D", "Senate"),
    "Roger Wicker":        ("Armed Services",    "R", "Senate"),
    # Homeland Security
    "Mark Green":          ("Homeland Security", "R", "House"),
    "Bennie Thompson":     ("Homeland Security", "D", "House"),
    "John Katko":          ("Homeland Security", "R", "House"),
    "Yvette Clarke":       ("Homeland Security", "D", "House"),
    # Financial Services / Finance / Banking
    "Patrick McHenry":     ("Financial Services","R", "House"),
    "Maxine Waters":       ("Financial Services","D", "House"),
    "Sherrod Brown":       ("Finance",           "D", "Senate"),
    "Mike Crapo":          ("Finance",           "R", "Senate"),
    "Pat Toomey":          ("Banking",           "R", "Senate"),
    # Oversight
    "James Comer":         ("Oversight",         "R", "House"),
    "Carolyn Maloney":     ("Oversight",         "D", "House"),
    "Marjorie Taylor Greene": ("Oversight",      "R", "House"),
    # Energy & Commerce / Commerce
    "Frank Pallone":       ("Energy & Commerce", "D", "House"),
    "Cathy McMorris Rodgers": ("Energy & Commerce","R","House"),
    # Health
    "Anna Eshoo":          ("Health",            "D", "House"),
    # Rules
    "Tom Cole":            ("Rules",             "R", "House"),
}


def load_trades(api_key=None, start="2020-01-01", end="2025-12-31"):
    """
    Returns a DataFrame of congressional trades filtered to [start, end].

    Source cascade (first success wins):
      1. QuiverQuant API  (if api_key provided)
      2. House Stock Watcher (keyless)
      3. Senate Stock Watcher (keyless)
      4. Local seed CSV
    """
    df = None

    if api_key:
        print("[fetch_trades] Trying QuiverQuant API...")
        df = _fetch_quiverquant(api_key)
        if df is not None:
            print(f"[fetch_trades] QuiverQuant: {len(df)} trades loaded.")

    if df is None:
        print("[fetch_trades] Trying House + Senate Stock Watcher (keyless)...")
        house = _fetch_house_watcher()
        senate = _fetch_senate_watcher()
        if house is not None or senate is not None:
            parts = [x for x in [house, senate] if x is not None]
            df = pd.concat(parts, ignore_index=True) if parts else None
            if df is not None:
                _attach_committee_data(df)
                print(f"[fetch_trades] Stock Watcher: {len(df)} trades "
                      f"(House: {len(house) if house is not None else 0}, "
                      f"Senate: {len(senate) if senate is not None else 0})")

    if df is None:
        print("[fetch_trades] Real sources unavailable — loading seed dataset.")
        df = pd.read_csv(_SEED_PATH, parse_dates=["trade_date", "disclosure_date"])

    df["trade_date"] = pd.to_datetime(df["trade_date"], errors="coerce")
    df["disclosure_date"] = pd.to_datetime(df["disclosure_date"], errors="coerce")

    # Normalise action field across sources
    df["action"] = df["action"].str.strip().replace({
        "purchase": "Purchase", "buy": "Purchase", "bought": "Purchase",
        "sale": "Sale", "sold": "Sale", "sale_full": "Sale", "sale_partial": "Sale",
    }, regex=False)

    mask = (df["disclosure_date"] >= start) & (df["disclosure_date"] <= end)
    result = df[mask].reset_index(drop=True)

    # Drop tickers that aren't real symbols (options, real estate, bonds etc)
    result = result[result["ticker"].str.match(r"^[A-Z]{1,5}$", na=False)]

    return result


def _fetch_quiverquant(api_key):
    """Pulls bulk congress trading data from QuiverQuant API."""
    try:
        url = f"{_QUIVER_BASE}/bulk/congress"
        headers = {"Authorization": f"Token {api_key}"}
        resp = requests.get(url, headers=headers, timeout=30)
        resp.raise_for_status()
        raw = resp.json()
    except Exception as e:
        print(f"  [fetch_trades] QuiverQuant failed: {e}")
        return None

    rows = []
    for item in raw:
        rows.append({
            "politician":       item.get("Representative", ""),
            "party":            item.get("Party", ""),
            "chamber":          item.get("Chamber", ""),
            "committee":        item.get("Committee", ""),
            "ticker":           item.get("Ticker", ""),
            "action":           item.get("Transaction", ""),
            "trade_date":       item.get("TransactionDate", ""),
            "disclosure_date":  item.get("ReportDate", ""),
            "amount_min":       item.get("Range_Low", 0),
            "amount_max":       item.get("Range_High", 0),
        })

    df = pd.DataFrame(rows)
    df["trade_date"] = pd.to_datetime(df["trade_date"], errors="coerce")
    df["disclosure_date"] = pd.to_datetime(df["disclosure_date"], errors="coerce")
    return df.dropna(subset=["ticker", "disclosure_date"])


def _fetch_house_watcher():
    """
    Pulls House disclosure data from housestockwatcher.com/api (keyless JSON).
    Schema: disclosure_date, transaction_date, representative, ticker, type, amount, district
    """
    try:
        req = urllib.request.Request(
            _HOUSE_WATCHER,
            headers={"User-Agent": "Mozilla/5.0", "Accept": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=20) as resp:
            import json
            raw = json.loads(resp.read())
    except Exception as e:
        print(f"  [fetch_trades] House Watcher unavailable: {e}")
        return None

    if not raw:
        return None

    rows = []
    for item in raw:
        lo, hi = _parse_amount_range(item.get("amount", ""))
        rows.append({
            "politician":       item.get("representative", ""),
            "ticker":           (item.get("ticker") or "").upper(),
            "action":           item.get("type", ""),
            "trade_date":       item.get("transaction_date", ""),
            "disclosure_date":  item.get("disclosure_date", ""),
            "amount_min":       lo,
            "amount_max":       hi,
        })

    df = pd.DataFrame(rows)
    df["trade_date"] = pd.to_datetime(df["trade_date"], errors="coerce")
    df["disclosure_date"] = pd.to_datetime(df["disclosure_date"], errors="coerce")
    df["chamber"] = "House"
    return df.dropna(subset=["ticker", "disclosure_date"])


def _fetch_senate_watcher():
    """
    Pulls Senate disclosure data from senatestockwatcher.com/api/transactions (keyless JSON).
    Schema: disclosure_date, transaction_date, senator, ticker, type, amount
    """
    try:
        req = urllib.request.Request(
            _SENATE_WATCHER,
            headers={"User-Agent": "Mozilla/5.0", "Accept": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=20) as resp:
            import json
            raw = json.loads(resp.read())
    except Exception as e:
        print(f"  [fetch_trades] Senate Watcher unavailable: {e}")
        return None

    if not raw:
        return None

    rows = []
    for item in raw:
        lo, hi = _parse_amount_range(item.get("amount", ""))
        rows.append({
            "politician":       item.get("senator", ""),
            "ticker":           (item.get("ticker") or "").upper(),
            "action":           item.get("type", ""),
            "trade_date":       item.get("transaction_date", ""),
            "disclosure_date":  item.get("disclosure_date", ""),
            "amount_min":       lo,
            "amount_max":       hi,
        })

    df = pd.DataFrame(rows)
    df["trade_date"] = pd.to_datetime(df["trade_date"], errors="coerce")
    df["disclosure_date"] = pd.to_datetime(df["disclosure_date"], errors="coerce")
    df["chamber"] = "Senate"
    return df.dropna(subset=["ticker", "disclosure_date"])


def _attach_committee_data(df):
    """
    Adds party, chamber (if missing), and committee columns from POLITICIAN_COMMITTEE_MAP.
    Operates in place. Politicians not in the map get empty string committee.
    """
    def _lookup(row, field, idx):
        return POLITICIAN_COMMITTEE_MAP.get(row["politician"], ("", "", ""))[idx]

    if "committee" not in df.columns:
        df["committee"] = df.apply(lambda r: _lookup(r, "committee", 0), axis=1)
    if "party" not in df.columns:
        df["party"] = df.apply(lambda r: _lookup(r, "party", 1), axis=1)

    # Only override chamber if it's missing
    if "chamber" not in df.columns:
        df["chamber"] = df.apply(lambda r: _lookup(r, "chamber", 2), axis=1)


def _parse_amount_range(amount_str):
    """
    Parses disclosure amount strings like '$1,001 - $15,000' into (lo, hi) integers.
    Returns (0, 0) on failure.
    """
    nums = re.findall(r"[\d,]+", amount_str.replace("$", ""))
    nums = [int(n.replace(",", "")) for n in nums if n.replace(",", "").isdigit()]
    if len(nums) >= 2:
        return nums[0], nums[1]
    if len(nums) == 1:
        return nums[0], nums[0]
    return 0, 0
