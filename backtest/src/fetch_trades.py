import os
import pandas as pd
import requests

_QUIVER_BASE = "https://api.quiverquant.com/beta"
_SEED_PATH = os.path.join(os.path.dirname(__file__), "../data/congress_trades_seed.csv")


def load_trades(api_key=None, start="2020-01-01", end="2025-12-31"):
    """
    Returns a DataFrame of congressional trades filtered to [start, end].
    Uses QuiverQuant API if api_key is provided, otherwise falls back to seed CSV.
    """
    if api_key:
        df = _fetch_from_quiverquant(api_key)
    else:
        print("[fetch_trades] No API key — loading seed dataset.")
        df = pd.read_csv(
            _SEED_PATH,
            parse_dates=["trade_date", "disclosure_date"],
        )

    df["trade_date"] = pd.to_datetime(df["trade_date"])
    df["disclosure_date"] = pd.to_datetime(df["disclosure_date"])

    mask = (df["disclosure_date"] >= start) & (df["disclosure_date"] <= end)
    return df[mask].reset_index(drop=True)


def _fetch_from_quiverquant(api_key):
    """Pulls bulk congress trading data from QuiverQuant API."""
    url = f"{_QUIVER_BASE}/bulk/congress"
    headers = {"Authorization": f"Token {api_key}"}
    resp = requests.get(url, headers=headers, timeout=30)
    resp.raise_for_status()
    raw = resp.json()

    rows = []
    for item in raw:
        rows.append({
            "politician": item.get("Representative", ""),
            "party": item.get("Party", ""),
            "chamber": item.get("Chamber", ""),
            "committee": item.get("Committee", ""),
            "ticker": item.get("Ticker", ""),
            "action": item.get("Transaction", ""),
            "trade_date": item.get("TransactionDate", ""),
            "disclosure_date": item.get("ReportDate", ""),
            "amount_min": item.get("Range_Low", 0),
            "amount_max": item.get("Range_High", 0),
        })

    df = pd.DataFrame(rows)
    df["trade_date"] = pd.to_datetime(df["trade_date"], errors="coerce")
    df["disclosure_date"] = pd.to_datetime(df["disclosure_date"], errors="coerce")
    return df.dropna(subset=["ticker", "disclosure_date"])
