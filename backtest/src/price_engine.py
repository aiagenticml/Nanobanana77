import io
import os
import urllib.request
import warnings
from datetime import timedelta

import pandas as pd
import yfinance as yf

from .synthetic_prices import get_synthetic_prices

_CACHE_DIR = os.path.join(os.path.dirname(__file__), "../data/prices_cache")
os.makedirs(_CACHE_DIR, exist_ok=True)

# Real-data sources are tried in order. All are keyless and free.
# 1. yfinance  — Yahoo Finance, adjusted close (best quality)
# 2. stooq     — keyless CSV API, full daily history (robust fallback)
# Synthetic GBM is used only if every real source is unreachable.


def get_prices(tickers, start, end):
    """
    Fetches daily close prices for all tickers + SPY, trying real sources first:
      cached parquet → yfinance → Stooq → synthetic GBM (last resort).

    Caches successful real downloads as parquet to avoid re-fetching.
    Returns (dict[ticker -> pd.Series(date -> price)], used_synthetic: bool).
    """
    all_tickers = list(set(list(tickers) + ["SPY"]))
    prices = {}
    failed = []

    for ticker in all_tickers:
        cache_path = os.path.join(_CACHE_DIR, f"{ticker}.parquet")
        if os.path.exists(cache_path):
            series = pd.read_parquet(cache_path).squeeze()
            series.index = pd.to_datetime(series.index).tz_localize(None)
            prices[ticker] = series
            continue

        print(f"  [prices] Fetching {ticker}...")
        series = _fetch_yfinance(ticker, start, end)
        source = "yfinance"
        if series is None:
            series = _fetch_stooq(ticker, start, end)
            source = "stooq"

        if series is not None and not series.empty:
            series.index = pd.to_datetime(series.index).tz_localize(None)
            pd.DataFrame(series).to_parquet(cache_path)
            prices[ticker] = series
            print(f"    → {len(series)} days from {source}")
        else:
            failed.append(ticker)

    if failed:
        print(f"\n  [prices] No real source reachable for {len(failed)} ticker(s). "
              f"Falling back to synthetic GBM prices.")
        print(f"  *** WARNING: SYNTHETIC PRICES IN USE ***")
        print(f"  Results reflect GBM random walks, not real market prices.")
        print(f"  Alpha figures cannot be interpreted as real-world trading edge.")
        print(f"  Real sources (yfinance, Stooq) were blocked by the network egress")
        print(f"  allowlist. To get real data: run locally, or add 'stooq.com' and")
        print(f"  'query1.finance.yahoo.com' to the environment's egress settings.")
        synthetic = get_synthetic_prices(failed, start=start, end=end)
        prices.update(synthetic)

    return prices, bool(failed)


def _fetch_yfinance(ticker, start, end):
    """Returns a close-price Series from Yahoo Finance, or None if unreachable."""
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            raw = yf.download(ticker, start=start, end=end, progress=False, auto_adjust=True)
        if raw is None or raw.empty:
            return None
        return raw["Close"].squeeze()
    except Exception:
        return None


def _fetch_stooq(ticker, start, end):
    """
    Returns a close-price Series from Stooq (keyless CSV API), or None if unreachable.

    Stooq uses lowercase symbols with a market suffix: AAPL → aapl.us, SPY → spy.us.
    Endpoint: https://stooq.com/q/d/l/?s=<sym>&d1=YYYYMMDD&d2=YYYYMMDD&i=d
    CSV columns: Date,Open,High,Low,Close,Volume
    """
    sym = f"{ticker.lower()}.us"
    d1 = pd.Timestamp(start).strftime("%Y%m%d")
    d2 = pd.Timestamp(end).strftime("%Y%m%d")
    url = f"https://stooq.com/q/d/l/?s={sym}&d1={d1}&d2={d2}&i=d"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            text = resp.read().decode("utf-8", "replace")
        # Stooq returns the literal "No data" / "Exceeded the daily hits limit" on failure
        if not text or "Date,Open" not in text:
            return None
        df = pd.read_csv(io.StringIO(text), parse_dates=["Date"])
        if df.empty or "Close" not in df.columns:
            return None
        return df.set_index("Date")["Close"]
    except Exception:
        return None


def get_return(ticker, entry_date, hold_days, prices):
    """
    Calculates the percentage return for a ticker from entry_date to entry_date + hold_days.
    Finds the nearest available trading day for both dates.
    Returns NaN if data is unavailable.
    """
    if ticker not in prices:
        return float("nan")

    series = prices[ticker]
    entry = _nearest_trading_day(entry_date, series)
    if entry is None:
        return float("nan")

    exit_target = entry + timedelta(days=hold_days)
    exit_day = _nearest_trading_day(exit_target, series)
    if exit_day is None or exit_day <= entry:
        return float("nan")

    try:
        entry_price = series.loc[entry]
        exit_price = series.loc[exit_day]
        return (exit_price - entry_price) / entry_price
    except (KeyError, ZeroDivisionError):
        return float("nan")


def _nearest_trading_day(target_date, series):
    """Returns the next trading day on or after target_date, up to 10 days forward."""
    target = pd.Timestamp(target_date)
    for offset in range(10):
        candidate = target + timedelta(days=offset)
        if candidate in series.index:
            return candidate
    return None
