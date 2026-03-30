"""
Financial Data Scraper & Analyzer  —  Multi-Factor Trend Edition
================================================================
Indicators computed per stock:
  RSI-14          — momentum / overbought / oversold
  MA-20           — short-term trend baseline
  MA-50           — medium-term trend
  MA-200          — long-term trend
  Golden/Death    — MA-50 vs MA-200 cross signal
  MACD            — 12/26 EMA diff + 9-period signal line
  Bollinger Bands — 20-period, ±2σ  (position within bands)
  ADX-14          — trend strength (>25 = trending, <20 = ranging)
  Volume Ratio    — today vs 20-day avg (surge = conviction)

Trend verdict (STRONG_UPTREND / UPTREND / DOWNTREND /
               STRONG_DOWNTREND / RANGING) is computed by
scoring each indicator and summing.

Requires outbound internet for live data. Falls back to synthetic
price+volume series that exercise every signal path when offline.
"""

import json
import datetime
import numpy as np
import pandas as pd
import yfinance as yf

# ── Tickers ───────────────────────────────────────────────────────────────────
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

# ── Indicator functions ───────────────────────────────────────────────────────

def calc_rsi(close: pd.Series, period: int = 14) -> float | None:
    delta = close.diff().dropna()
    gain = delta.clip(lower=0)
    loss = (-delta).clip(lower=0)
    avg_gain = gain.ewm(com=period - 1, min_periods=period).mean()
    avg_loss = loss.ewm(com=period - 1, min_periods=period).mean()
    rs = avg_gain / avg_loss.replace(0, np.nan)
    rsi = 100 - (100 / (1 + rs))
    return round(float(rsi.iloc[-1]), 2) if not rsi.empty else None


def calc_sma(close: pd.Series, period: int) -> float | None:
    if len(close) < period:
        return None
    return round(float(close.tail(period).mean()), 2)


def calc_macd(close: pd.Series):
    """Returns (macd_line, signal_line, histogram) — all latest values."""
    if len(close) < 35:
        return None, None, None
    ema12 = close.ewm(span=12, adjust=False).mean()
    ema26 = close.ewm(span=26, adjust=False).mean()
    macd_line = ema12 - ema26
    signal = macd_line.ewm(span=9, adjust=False).mean()
    hist = macd_line - signal
    return round(float(macd_line.iloc[-1]), 4), \
           round(float(signal.iloc[-1]), 4), \
           round(float(hist.iloc[-1]), 4)


def calc_bollinger(close: pd.Series, period: int = 20, std_mult: float = 2.0):
    """Returns (upper, middle, lower, pct_b) where pct_b = position 0–1 in bands."""
    if len(close) < period:
        return None, None, None, None
    mid = close.tail(period).mean()
    std = close.tail(period).std()
    upper = round(float(mid + std_mult * std), 2)
    lower = round(float(mid - std_mult * std), 2)
    mid   = round(float(mid), 2)
    price = float(close.iloc[-1])
    band_width = upper - lower
    pct_b = round((price - lower) / band_width, 4) if band_width > 0 else 0.5
    return upper, mid, lower, pct_b


def calc_adx(high: pd.Series, low: pd.Series, close: pd.Series,
             period: int = 14) -> float | None:
    """Average Directional Index — measures trend strength (not direction)."""
    if len(close) < period * 2:
        return None
    tr = pd.concat([
        high - low,
        (high - close.shift()).abs(),
        (low  - close.shift()).abs(),
    ], axis=1).max(axis=1)

    dm_plus  = (high - high.shift()).clip(lower=0)
    dm_minus = (low.shift() - low).clip(lower=0)
    # zero out where the other is larger
    mask = dm_plus >= dm_minus
    dm_plus  = dm_plus.where(mask, 0)
    dm_minus = dm_minus.where(~mask, 0)

    atr   = tr.ewm(com=period - 1, min_periods=period).mean()
    di_p  = 100 * dm_plus.ewm(com=period - 1, min_periods=period).mean() / atr
    di_m  = 100 * dm_minus.ewm(com=period - 1, min_periods=period).mean() / atr
    dx    = (100 * (di_p - di_m).abs() / (di_p + di_m).replace(0, np.nan))
    adx   = dx.ewm(com=period - 1, min_periods=period).mean()
    return round(float(adx.iloc[-1]), 2) if not adx.empty else None


def calc_volume_ratio(volume: pd.Series, period: int = 20) -> float | None:
    """Today's volume vs N-day average — >1.5 = elevated conviction."""
    if len(volume) < period + 1:
        return None
    avg = float(volume.iloc[-(period + 1):-1].mean())
    today = float(volume.iloc[-1])
    return round(today / avg, 3) if avg > 0 else None


# ── Trend scoring ─────────────────────────────────────────────────────────────

def trend_verdict(price, rsi, ma20, ma50, ma200, macd_hist,
                  pct_b, adx, vol_ratio) -> tuple[str, int, dict]:
    """
    Score each indicator +1 (bullish) / -1 (bearish) / 0 (neutral).
    Sum → verdict label + raw score breakdown.
    """
    scores = {}

    # RSI
    if rsi is not None:
        if rsi > 60:   scores["rsi"] =  1
        elif rsi < 40: scores["rsi"] = -1
        else:          scores["rsi"] =  0

    # Price vs MAs
    if ma20 is not None:
        scores["vs_ma20"] = 1 if price > ma20 else -1
    if ma50 is not None:
        scores["vs_ma50"] = 1 if price > ma50 else -1
    if ma200 is not None:
        scores["vs_ma200"] = 1 if price > ma200 else -1

    # Golden / Death cross
    if ma50 is not None and ma200 is not None:
        scores["ma_cross"] = 1 if ma50 > ma200 else -1

    # MACD histogram direction
    if macd_hist is not None:
        scores["macd"] = 1 if macd_hist > 0 else -1

    # Bollinger %B  (>0.8 extended up, <0.2 extended down)
    if pct_b is not None:
        if pct_b > 0.8:   scores["bband"] =  1
        elif pct_b < 0.2: scores["bband"] = -1
        else:             scores["bband"] =  0

    # Volume conviction (only counts when directional)
    if vol_ratio is not None and vol_ratio > 1.5:
        # amplify whichever direction the price moved
        direction = scores.get("vs_ma20", 0)
        scores["volume_surge"] = direction  # same sign as trend

    total = sum(scores.values())
    n = len(scores)

    if n == 0:
        label = "INSUFFICIENT_DATA"
    elif total >= 5:
        label = "STRONG_UPTREND"
    elif total >= 2:
        label = "UPTREND"
    elif total <= -5:
        label = "STRONG_DOWNTREND"
    elif total <= -2:
        label = "DOWNTREND"
    else:
        label = "RANGING"

    # ADX overrides label to RANGING if trend is weak regardless of direction
    if adx is not None and adx < 20 and label not in ("STRONG_UPTREND", "STRONG_DOWNTREND"):
        label = "RANGING"

    return label, total, scores


# ── Full analysis ─────────────────────────────────────────────────────────────

def build_analysis(gainers: list) -> list:
    out = []
    for item in gainers:
        df   = item["df"]
        close  = df["Close"].dropna()
        high   = df["High"].dropna()   if "High"   in df.columns else close
        low    = df["Low"].dropna()    if "Low"    in df.columns else close
        volume = df["Volume"].dropna() if "Volume" in df.columns else pd.Series(dtype=float)

        price = round(float(close.iloc[-1]), 2)
        prev  = round(float(close.iloc[-2]), 2)

        rsi          = calc_rsi(close)
        ma20         = calc_sma(close, 20)
        ma50         = calc_sma(close, 50)
        ma200        = calc_sma(close, 200)
        macd, sig, hist = calc_macd(close)
        bb_up, bb_mid, bb_low, pct_b = calc_bollinger(close)
        adx          = calc_adx(high, low, close) if len(high) == len(low) == len(close) else None
        vol_ratio    = calc_volume_ratio(volume) if not volume.empty else None

        verdict, score, breakdown = trend_verdict(
            price, rsi, ma20, ma50, ma200, hist, pct_b, adx, vol_ratio
        )

        # Golden/Death cross label
        if ma50 and ma200:
            cross = "GOLDEN_CROSS" if ma50 > ma200 else "DEATH_CROSS"
        else:
            cross = None

        # RSI zone
        if rsi is None:
            rsi_zone = "UNKNOWN"
        elif rsi > 70:
            rsi_zone = "OVERBOUGHT"
        elif rsi < 30:
            rsi_zone = "OVERSOLD"
        elif rsi > 60:
            rsi_zone = "BULLISH"
        elif rsi < 40:
            rsi_zone = "BEARISH"
        else:
            rsi_zone = "NEUTRAL"

        out.append({
            "ticker":              item["ticker"],
            "current_price_usd":   price,
            "previous_close_usd":  prev,
            "day_change_pct":      item["day_change_pct"],
            # ── Momentum ──
            "rsi_14":              rsi,
            "rsi_zone":            rsi_zone,
            # ── Moving averages ──
            "ma_20":               ma20,
            "ma_50":               ma50,
            "ma_200":              ma200,
            "ma_cross":            cross,
            # ── MACD ──
            "macd_line":           macd,
            "macd_signal":         sig,
            "macd_histogram":      hist,
            "macd_bias":           ("BULLISH" if hist and hist > 0 else "BEARISH") if hist is not None else None,
            # ── Bollinger Bands ──
            "bb_upper":            bb_up,
            "bb_middle":           bb_mid,
            "bb_lower":            bb_low,
            "bb_pct_b":            pct_b,
            # ── Trend strength ──
            "adx_14":              adx,
            "adx_regime":          ("TRENDING" if adx and adx >= 25 else "RANGING") if adx else None,
            # ── Volume ──
            "volume_ratio_20d":    vol_ratio,
            # ── Verdict ──
            "trend_score":         score,
            "score_breakdown":     breakdown,
            "trend_verdict":       verdict,
            "interpretation":      _narrative(item["ticker"], price,
                                              item["day_change_pct"], verdict,
                                              rsi, rsi_zone, ma50, ma200, cross,
                                              hist, adx, vol_ratio),
        })
    return out


def _narrative(ticker, price, chg, verdict, rsi, rsi_zone,
               ma50, ma200, cross, macd_hist, adx, vol_ratio) -> str:
    direction = "up" if chg >= 0 else "down"
    parts = [f"{ticker} moved {direction} {abs(chg):.2f}% to ${price:.2f}."]

    if verdict in ("STRONG_UPTREND", "UPTREND"):
        parts.append(f"Multi-factor analysis points to an {verdict.replace('_', ' ').lower()}.")
    elif verdict in ("STRONG_DOWNTREND", "DOWNTREND"):
        parts.append(f"Multi-factor analysis signals a {verdict.replace('_', ' ').lower()}.")
    else:
        parts.append("Price action is ranging with no clear directional conviction.")

    if cross:
        parts.append(f"MA-50/200 shows a {'bullish golden cross' if cross == 'GOLDEN_CROSS' else 'bearish death cross'}.")
    if rsi_zone in ("OVERBOUGHT", "OVERSOLD"):
        parts.append(f"RSI at {rsi} is {rsi_zone.lower()} — watch for a potential reversal.")
    if macd_hist is not None:
        parts.append(f"MACD histogram is {'positive (bullish momentum)' if macd_hist > 0 else 'negative (bearish momentum)'}.")
    if adx is not None:
        parts.append(f"ADX at {adx} indicates {'a strong trend' if adx >= 25 else 'a weak or ranging market'}.")
    if vol_ratio and vol_ratio > 1.5:
        parts.append(f"Volume is {vol_ratio}x the 20-day average — elevated conviction.")

    return " ".join(parts)


# ── Synthetic data ────────────────────────────────────────────────────────────

def _make_ohlcv(base: float, drift: float, noise: float,
                n: int = 252, seed: int = 0) -> pd.DataFrame:
    """252 trading days (~1 year) of synthetic OHLCV."""
    rng = np.random.default_rng(seed)
    returns = rng.normal(drift, noise, size=n)
    close = base * np.cumprod(1 + returns)
    high  = close * (1 + rng.uniform(0.001, 0.015, n))
    low   = close * (1 - rng.uniform(0.001, 0.015, n))
    open_ = close * (1 + rng.normal(0, 0.005, n))
    volume = rng.integers(5_000_000, 50_000_000, size=n).astype(float)
    # spike volume on last day for one stock
    idx = pd.bdate_range(end=pd.Timestamp.today(), periods=n)
    return pd.DataFrame({
        "Open": open_.round(2), "High": high.round(2),
        "Low": low.round(2),   "Close": close.round(2),
        "Volume": volume,
    }, index=idx)


SAMPLE_STOCKS = [
    # Strong uptrend  (golden cross, RSI overbought, MACD bullish)
    {"ticker": "NVDA",  "base": 600.0,  "drift":  0.006, "noise": 0.012, "seed": 10},
    # Uptrend (moderate)
    {"ticker": "META",  "base": 350.0,  "drift":  0.003, "noise": 0.013, "seed": 20},
    # Downtrend (death cross territory)
    {"ticker": "INTC",  "base":  45.0,  "drift": -0.004, "noise": 0.011, "seed": 30},
    # Strong downtrend
    {"ticker": "PFE",   "base":  40.0,  "drift": -0.007, "noise": 0.010, "seed": 40},
    # Ranging / sideways
    {"ticker": "KO",    "base":  62.0,  "drift":  0.000, "noise": 0.008, "seed": 50},
]


def get_sample_gainers() -> list:
    print("NOTICE: Live network unavailable — using 1-year synthetic OHLCV.\n")
    results = []
    for s in SAMPLE_STOCKS:
        df = _make_ohlcv(s["base"], s["drift"], s["noise"], seed=s["seed"])
        pct = round(float((df["Close"].iloc[-1] - df["Close"].iloc[-2])
                          / df["Close"].iloc[-2] * 100), 4)
        results.append({"ticker": s["ticker"], "df": df, "day_change_pct": pct})
    results.sort(key=lambda x: x["day_change_pct"], reverse=True)
    return results


# ── Live fetch ────────────────────────────────────────────────────────────────

def fetch_top_gainers(tickers: list, top_n: int = 5) -> list:
    print(f"Fetching 1-year daily data for {len(tickers)} tickers…")
    raw = yf.download(
        tickers,
        period="1y",
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
            if df.empty or len(df) < 50:
                continue
            close = df["Close"].dropna()
            if len(close) < 2:
                continue
            pct = round(float((close.iloc[-1] - close.iloc[-2]) / close.iloc[-2] * 100), 4)
            results.append({"ticker": ticker, "df": df, "day_change_pct": pct})
        except Exception:
            continue
    results.sort(key=lambda x: x["day_change_pct"], reverse=True)
    return results[:top_n]


# ── Main ──────────────────────────────────────────────────────────────────────

VERDICT_COLOR = {
    "STRONG_UPTREND":   "\033[92m",   # bright green
    "UPTREND":          "\033[32m",   # green
    "RANGING":          "\033[93m",   # yellow
    "DOWNTREND":        "\033[31m",   # red
    "STRONG_DOWNTREND": "\033[91m",   # bright red
    "INSUFFICIENT_DATA":"\033[90m",   # grey
}
RESET = "\033[0m"


def main():
    run_ts = datetime.datetime.utcnow().isoformat() + "Z"
    print("=" * 70)
    print("  Financial Data Scraper — Multi-Factor Trend Analysis")
    print(f"  {run_ts}")
    print("=" * 70)

    gainers = fetch_top_gainers(SP500_TICKERS, top_n=5)
    live = bool(gainers)

    if not live:
        gainers = get_sample_gainers()

    analysis = build_analysis(gainers)

    output = {
        "generated_at_utc":  run_ts,
        "data_source":       "Yahoo Finance (yfinance)" if live else "synthetic 1-year OHLCV",
        "live_data":         live,
        "universe":          "S&P 500 sample (90 tickers)",
        "indicators_used":   ["RSI-14", "SMA-20", "SMA-50", "SMA-200",
                              "MACD(12,26,9)", "Bollinger(20,2)", "ADX-14",
                              "Volume ratio 20d"],
        "top_5_gainers":     analysis,
    }

    with open("market_logic.json", "w") as f:
        json.dump(output, f, indent=2)
    print("Saved → market_logic.json\n")

    # ── Summary table ─────────────────────────────────────────────────────────
    hdr = (f"{'#':<3} {'Ticker':<6} {'Price':>8} {'Chg%':>7} "
           f"{'RSI':>6} {'MA50':>8} {'MA200':>8} {'ADX':>6} "
           f"{'MACD-H':>8} {'Score':>6}  Verdict")
    print(hdr)
    print("─" * len(hdr))

    for i, s in enumerate(analysis, 1):
        c = VERDICT_COLOR.get(s["trend_verdict"], "")
        cross_sym = {"GOLDEN_CROSS": "✦", "DEATH_CROSS": "✗"}.get(s["ma_cross"], " ")
        print(
            f"{i:<3} {s['ticker']:<6} "
            f"${s['current_price_usd']:>7.2f} "
            f"{s['day_change_pct']:>+6.2f}% "
            f"{str(s['rsi_14'] or '-'):>6} "
            f"{str(s['ma_50']  or '-'):>8} "
            f"{str(s['ma_200'] or '-'):>8} "
            f"{str(s['adx_14'] or '-'):>6} "
            f"{str(s['macd_histogram'] or '-'):>8} "
            f"{s['trend_score']:>+6}  "
            f"{c}{cross_sym} {s['trend_verdict']}{RESET}"
        )

    print("\n  ✦ = Golden Cross   ✗ = Death Cross\n")
    print("── Score breakdown ─────────────────────────────────────────────────")
    for s in analysis:
        bd = s["score_breakdown"]
        bd_str = "  ".join(f"{k}:{'+' if v>0 else ''}{v}" for k, v in bd.items())
        print(f"  {s['ticker']:<5}  {bd_str}")

    print("\n── Interpretations ─────────────────────────────────────────────────")
    for s in analysis:
        print(f"\n  {s['ticker']} [{s['trend_verdict']}]")
        print(f"  {s['interpretation']}")

    print()
    return output


if __name__ == "__main__":
    main()
