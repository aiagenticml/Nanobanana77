"""
Financial Data Scraper & Analyzer
Fetches top 5 S&P 500 gainers via yfinance, computes RSI-14 and MA-20,
classifies each stock, and writes market_logic.json.

On machines without outbound internet the script falls back to synthetic
price series that deliberately cover all three signal states so the full
pipeline (RSI calc → classification → JSON export) can be validated.
"""

import json
import datetime
import numpy as np
import pandas as pd
import yfinance as yf

# ── S&P 500 representative universe ──────────────────────────────────────────
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


# ── Technical indicators ──────────────────────────────────────────────────────

def calc_rsi(series: pd.Series, period: int = 14) -> float | None:
    delta = series.diff().dropna()
    gain = delta.clip(lower=0)
    loss = (-delta).clip(lower=0)
    avg_gain = gain.ewm(com=period - 1, min_periods=period).mean()
    avg_loss = loss.ewm(com=period - 1, min_periods=period).mean()
    rs = avg_gain / avg_loss.replace(0, np.nan)
    rsi = 100 - (100 / (1 + rs))
    return round(float(rsi.iloc[-1]), 2) if not rsi.empty else None


def calc_ma(series: pd.Series, period: int = 20) -> float | None:
    if len(series) < period:
        return None
    return round(float(series.tail(period).mean()), 4)


def classify(rsi: float | None) -> str:
    if rsi is None:
        return "INSUFFICIENT_DATA"
    if rsi > 70:
        return "OVERBOUGHT"
    if rsi < 30:
        return "OVERSOLD"
    return "NEUTRAL"


def day_change_pct(df: pd.DataFrame) -> float | None:
    if len(df) < 2:
        return None
    prev = float(df["Close"].iloc[-2])
    last = float(df["Close"].iloc[-1])
    return round((last - prev) / prev * 100, 4)


# ── Live data fetch ───────────────────────────────────────────────────────────

def fetch_top_gainers(tickers: list, top_n: int = 5) -> list:
    print(f"Fetching live data for {len(tickers)} tickers…")
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
            df = raw if len(tickers) == 1 else raw[ticker].dropna(how="all")
            if df.empty or len(df) < 15:
                continue
            pct = day_change_pct(df)
            if pct is None:
                continue
            results.append({"ticker": ticker, "df": df, "day_change_pct": pct})
        except Exception:
            continue
    results.sort(key=lambda x: x["day_change_pct"], reverse=True)
    return results[:top_n]


# ── Synthetic fallback ────────────────────────────────────────────────────────
# Each profile shapes a price series to land in a target RSI zone so every
# signal type appears in the sample output.

def _make_series(base: float, daily_drift: float, noise: float,
                 n: int = 60, seed: int = 0) -> pd.Series:
    rng = np.random.default_rng(seed)
    returns = rng.normal(daily_drift, noise, size=n)
    prices = base * np.cumprod(1 + returns)
    idx = pd.bdate_range(end=pd.Timestamp.today(), periods=n)
    return pd.Series(prices.round(2), index=idx, name="Close")


# drift / noise tuned so RSI lands where we want
SAMPLE_STOCKS = [
    # Strong uptrend  → OVERBOUGHT  (RSI > 70)
    {"ticker": "NVDA",  "base": 875.0,  "drift":  0.012, "noise": 0.008, "seed": 10},
    {"ticker": "META",  "base": 490.0,  "drift":  0.009, "noise": 0.007, "seed": 11},
    # Downtrend       → OVERSOLD    (RSI < 30)
    {"ticker": "INTC",  "base":  34.0,  "drift": -0.011, "noise": 0.008, "seed": 20},
    # Mild uptrend    → NEUTRAL
    {"ticker": "MSFT",  "base": 415.0,  "drift":  0.002, "noise": 0.012, "seed": 30},
    {"ticker": "AMZN",  "base": 185.0,  "drift":  0.001, "noise": 0.013, "seed": 31},
]


def get_sample_gainers() -> list:
    print("NOTICE: Live network unavailable — using synthetic sample data.\n")
    results = []
    for s in SAMPLE_STOCKS:
        series = _make_series(s["base"], s["drift"], s["noise"], seed=s["seed"])
        df = pd.DataFrame({"Close": series})
        pct = round(float((series.iloc[-1] - series.iloc[-2]) / series.iloc[-2] * 100), 4)
        results.append({"ticker": s["ticker"], "df": df, "day_change_pct": pct})
    results.sort(key=lambda x: x["day_change_pct"], reverse=True)
    return results


# ── Analysis builder ──────────────────────────────────────────────────────────

def build_analysis(gainers: list) -> list:
    out = []
    for item in gainers:
        close = item["df"]["Close"].dropna()
        rsi = calc_rsi(close)
        ma20 = calc_ma(close)
        price_now = round(float(close.iloc[-1]), 2)
        price_prev = round(float(close.iloc[-2]), 2)
        signal = classify(rsi)

        # Price vs MA relationship
        if ma20 and rsi is not None:
            price_vs_ma = "above" if price_now > ma20 else "below"
        else:
            price_vs_ma = "unknown"

        out.append({
            "ticker": item["ticker"],
            "current_price_usd": price_now,
            "previous_close_usd": price_prev,
            "day_change_pct": item["day_change_pct"],
            "rsi_14": rsi,
            "ma_20": ma20,
            "price_vs_ma20": price_vs_ma,
            "signal": signal,
            "interpretation": _narrative(item["ticker"], price_now, rsi, ma20,
                                         item["day_change_pct"], signal),
        })
    return out


def _narrative(ticker, price, rsi, ma20, chg, signal) -> str:
    """One-sentence plain-English summary — fed directly to Gemini in n8n."""
    direction = "up" if chg >= 0 else "down"
    pct_str = f"{abs(chg):.2f}%"
    if signal == "OVERBOUGHT":
        return (f"{ticker} surged {pct_str} today to ${price:.2f}, with RSI at {rsi} "
                f"well above the 70 overbought threshold — momentum is strong but a "
                f"pullback or consolidation may be near.")
    if signal == "OVERSOLD":
        return (f"{ticker} fell {pct_str} today to ${price:.2f}, pushing RSI down to "
                f"{rsi} below 30 — the stock is in oversold territory and could be "
                f"approaching a technical bounce.")
    return (f"{ticker} moved {direction} {pct_str} to ${price:.2f} with RSI at {rsi}, "
            f"sitting in neutral territory {'above' if price > (ma20 or 0) else 'below'} "
            f"its 20-day MA of ${ma20:.2f}.")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    run_ts = datetime.datetime.utcnow().isoformat() + "Z"
    print("=" * 62)
    print("  Financial Data Scraper & Analyzer")
    print(f"  {run_ts}")
    print("=" * 62)

    gainers = fetch_top_gainers(SP500_TICKERS, top_n=5)
    live = bool(gainers)

    if not live:
        gainers = get_sample_gainers()

    analysis = build_analysis(gainers)

    output = {
        "generated_at_utc": run_ts,
        "data_source": "Yahoo Finance (yfinance)" if live else "synthetic sample data",
        "live_data": live,
        "universe": "S&P 500 sample (90 tickers)",
        "top_5_gainers": analysis,
    }

    with open("market_logic.json", "w") as f:
        json.dump(output, f, indent=2)
    print("Saved → market_logic.json\n")

    # ── Pretty table ──────────────────────────────────────────────────────────
    col = {"OVERBOUGHT": "\033[91m", "OVERSOLD": "\033[94m",
           "NEUTRAL": "\033[92m", "INSUFFICIENT_DATA": "\033[90m"}
    reset = "\033[0m"

    print(f"{'#':<3} {'Ticker':<7} {'Price':>9} {'Chg%':>8} {'RSI':>7} "
          f"{'MA20':>9} {'vs MA':<6} {'Signal'}")
    print("─" * 68)
    for i, s in enumerate(analysis, 1):
        c = col.get(s["signal"], "")
        print(
            f"{i:<3} {s['ticker']:<7} "
            f"${s['current_price_usd']:>8.2f} "
            f"{s['day_change_pct']:>+7.2f}% "
            f"{s['rsi_14']:>7.1f} "
            f"{s['ma_20']:>9.2f} "
            f"{'↑' if s['price_vs_ma20']=='above' else '↓':<6} "
            f"{c}{s['signal']}{reset}"
        )

    print("\n── Interpretations ─────────────────────────────────────────")
    for s in analysis:
        print(f"\n  {s['ticker']}: {s['interpretation']}")

    print()
    return output


if __name__ == "__main__":
    main()
