import os
import warnings
from datetime import timedelta

import pandas as pd
import yfinance as yf

from .synthetic_prices import get_synthetic_prices

_CACHE_DIR = os.path.join(os.path.dirname(__file__), "../data/prices_cache")
os.makedirs(_CACHE_DIR, exist_ok=True)


def get_prices(tickers, start, end):
    """
    Downloads adjusted close prices for all tickers + SPY via yfinance.
    Falls back to GBM-synthetic prices (calibrated to real annual returns) if
    Yahoo Finance is unreachable (e.g. network egress restrictions).
    Caches live downloads as parquet files to avoid re-downloading.
    Returns dict[ticker -> pd.Series(date -> price)].
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

        print(f"  [prices] Downloading {ticker}...")
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                raw = yf.download(ticker, start=start, end=end, progress=False, auto_adjust=True)
            if raw.empty:
                raise ValueError("empty response")
            series = raw["Close"].squeeze()
            series.index = pd.to_datetime(series.index).tz_localize(None)
            pd.DataFrame(series).to_parquet(cache_path)
            prices[ticker] = series
        except Exception:
            failed.append(ticker)

    if failed:
        print(f"\n  [prices] Yahoo Finance unavailable for {len(failed)} ticker(s). "
              f"Using synthetic price data calibrated to real historical returns.")
        print(f"  *** WARNING: SYNTHETIC PRICES IN USE ***")
        print(f"  Results reflect GBM random walks, not real market prices.")
        print(f"  Alpha figures cannot be interpreted as real-world trading edge.")
        print(f"  To use real prices: run locally where Yahoo Finance is not blocked,")
        print(f"  or provide a QuiverQuant API key for full data. (--api-key YOUR_KEY)")
        synthetic = get_synthetic_prices(failed, start=start, end=end)
        prices.update(synthetic)

    return prices, bool(failed)


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
