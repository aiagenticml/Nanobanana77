"""
Financial Data Scraper & Analyzer
- Fetches top 5 S&P 500 gainers for the last trading day using yfinance
- Calculates RSI (14-period) and 20-period Moving Average
- Flags overbought (RSI > 70) and oversold (RSI < 30) stocks
- Outputs results to market_logic.json

NOTE: Requires outbound internet access to Yahoo Finance.
      When network is unavailable, the script falls back to synthetic
      sample data so the full pipeline (RSI, MA, JSON export) can still
      be validated locally.
"""

import json
import datetime
import numpy as np
import pandas as pd
import yfinance as yf

# ── S&P 500 universe (representative sample; full list would be 500 tickers) ──
SP500_TICKERS = [
    "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA", "BRK-B", "JPM", "V",
    "UNH", "XOM", "JNJ", "WMT", "MA", "PG", "HD", "CVX", "MRK", "ABBV",
    "LLY", "AVGO", "PEP", "COST", "KO", "ADBE", "CSCO", "MCD", "BAC", "PFE",
    "TMO", "CRM", "ACN", "NFLX", "AMD", "DIS", "NKE", "ABT", "INTC", "TXN",
    "QCOM", "WFC", "BMY", "DHR", "UPS", "PM", "MS", "RTX", "SPGI", "GS",
    "AMGN", "INTU", "CAT", "AXP", "LIN", "NOW", "SBUX", "BLK", "MDLZ", "GE",
    "ADI", "ISRG", "GILD", "REGN", "ZTS", "CI", "MO", "SO", "DUK", "PLD",
    "CL", "MMM", "PYPL", "SYK", "USB", "TJX", "CME", "EQIX", "APD", "EOG",
    "ITW", "NSC", "FCX", "EMR", "KLAC", "LRCX", "PANW", "MRVL", "FTNT", "CRWD",
]


def calc_rsi(series: pd.Series, period: int = 14) -> float:
    """Return the most recent RSI value for a price series."""
    delta = series.diff().dropna()
    gain = delta.clip(lower=0)
    loss = (-delta).clip(lower=0)

    avg_gain = gain.ewm(com=period - 1, min_periods=period).mean()
    avg_loss = loss.ewm(com=period - 1, min_periods=period).mean()

    rs = avg_gain / avg_loss.replace(0, np.nan)
    rsi = 100 - (100 / (1 + rs))
    return round(float(rsi.iloc[-1]), 2) if not rsi.empty else None


def calc_ma(series: pd.Series, period: int = 20) -> float:
    """Return the most recent simple moving average."""
    if len(series) < period:
        return None
    return round(float(series.tail(period).mean()), 4)


def get_day_change(ticker_data: pd.DataFrame) -> float:
    """Return % change for the most recent trading day."""
    if len(ticker_data) < 2:
        return None
    prev_close = ticker_data["Close"].iloc[-2]
    last_close = ticker_data["Close"].iloc[-1]
    return round(float((last_close - prev_close) / prev_close * 100), 4)


def fetch_top_gainers(tickers: list, top_n: int = 5) -> list:
    """Download 60 days of daily data for all tickers, return top N by 1-day gain."""
    print(f"Fetching data for {len(tickers)} tickers…")
    raw = yf.download(
        tickers,
        period="60d",
        interval="1d",
        group_by="ticker",
        auto_adjust=True,
        progress=False,
        threads=True,
    )

    results = []
    for ticker in tickers:
        try:
            if len(tickers) == 1:
                df = raw
            else:
                df = raw[ticker].dropna(how="all")

            if df.empty or len(df) < 15:
                continue

            pct = get_day_change(df)
            if pct is None:
                continue

            results.append({"ticker": ticker, "df": df, "day_change_pct": pct})
        except Exception:
            continue

    results.sort(key=lambda x: x["day_change_pct"], reverse=True)
    return results[:top_n]


def build_analysis(top_gainers: list) -> list:
    """Compute RSI, MA, signal for each top gainer."""
    analysis = []
    for item in top_gainers:
        ticker = item["ticker"]
        df = item["df"]
        close = df["Close"].dropna()

        rsi = calc_rsi(close)
        ma20 = calc_ma(close)
        current_price = round(float(close.iloc[-1]), 4)
        prev_price = round(float(close.iloc[-2]), 4)

        if rsi is None:
            signal = "INSUFFICIENT_DATA"
        elif rsi > 70:
            signal = "OVERBOUGHT"
        elif rsi < 30:
            signal = "OVERSOLD"
        else:
            signal = "NEUTRAL"

        analysis.append({
            "ticker": ticker,
            "current_price_usd": current_price,
            "previous_close_usd": prev_price,
            "day_change_pct": item["day_change_pct"],
            "rsi_14": rsi,
            "ma_20": ma20,
            "signal": signal,
        })

    return analysis


def make_sample_series(base: float, n: int = 60, seed: int = 42) -> pd.Series:
    """Generate a realistic-looking synthetic closing-price series for testing."""
    rng = np.random.default_rng(seed)
    returns = rng.normal(0.0005, 0.015, size=n)
    prices = base * np.cumprod(1 + returns)
    idx = pd.bdate_range(end=pd.Timestamp.today(), periods=n)
    return pd.Series(prices, index=idx, name="Close")


SAMPLE_STOCKS = [
    {"ticker": "NVDA",  "base": 875.0,  "seed": 1},
    {"ticker": "AMD",   "base": 165.0,  "seed": 2},
    {"ticker": "META",  "base": 490.0,  "seed": 3},
    {"ticker": "TSLA",  "base": 220.0,  "seed": 4},
    {"ticker": "CRWD",  "base": 310.0,  "seed": 5},
]


def get_sample_gainers() -> list:
    """Return synthetic gainers when live network is unavailable."""
    print("NOTICE: Using synthetic sample data (no live network access).")
    results = []
    for s in SAMPLE_STOCKS:
        series = make_sample_series(s["base"], seed=s["seed"])
        df = pd.DataFrame({"Close": series})
        pct = round(float((series.iloc[-1] - series.iloc[-2]) / series.iloc[-2] * 100), 4)
        results.append({"ticker": s["ticker"], "df": df, "day_change_pct": pct})
    results.sort(key=lambda x: x["day_change_pct"], reverse=True)
    return results


def main():
    run_ts = datetime.datetime.utcnow().isoformat() + "Z"
    print("=" * 55)
    print("  Financial Data Scraper & Analyzer")
    print(f"  Run timestamp (UTC): {run_ts}")
    print("=" * 55)

    top_gainers = fetch_top_gainers(SP500_TICKERS, top_n=5)
    live_data = bool(top_gainers)

    if not top_gainers:
        print("Live fetch failed — switching to synthetic sample data.\n")
        top_gainers = get_sample_gainers()

    analysis = build_analysis(top_gainers)

    output = {
        "generated_at_utc": run_ts,
        "data_source": "Yahoo Finance via yfinance (public data)" if live_data else "synthetic sample data (no network)",
        "universe": "S&P 500 sample",
        "period_analyzed": "last 60 calendar days, ranked by most recent trading-day gain",
        "live_data": live_data,
        "top_5_gainers": analysis,
    }

    out_path = "market_logic.json"
    with open(out_path, "w") as f:
        json.dump(output, f, indent=2)

    print(f"\nSaved → {out_path}\n")
    print(f"{'Ticker':<8} {'Price':>10} {'Chg%':>8} {'RSI':>7} {'MA20':>10} {'Signal'}")
    print("-" * 58)
    for s in analysis:
        print(
            f"{s['ticker']:<8} "
            f"${s['current_price_usd']:>9.2f} "
            f"{s['day_change_pct']:>+7.2f}% "
            f"{str(s['rsi_14']):>7} "
            f"{str(s['ma_20']):>10} "
            f"{s['signal']}"
        )
    print()
    return output


if __name__ == "__main__":
    main()
