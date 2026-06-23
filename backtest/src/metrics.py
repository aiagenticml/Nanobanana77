import numpy as np
import pandas as pd


def summarise(results_df, strategy_name="", hold_days=30):
    """Returns a dict of summary statistics for a backtest results DataFrame."""
    if results_df.empty:
        return {"strategy": strategy_name, "hold_days": hold_days, "n_trades": 0}

    rets = results_df["trade_return"].dropna()
    spy_rets = results_df["spy_return"].dropna()
    alphas = results_df["alpha"].dropna()

    total_ret = float((1 + rets).prod() - 1)
    spy_total = float((1 + spy_rets).prod() - 1)

    std = rets.std()
    sharpe = float(rets.mean() / std * np.sqrt(252)) if std > 0 else float("nan")

    best_idx = results_df["trade_return"].idxmax()
    worst_idx = results_df["trade_return"].idxmin()
    best = results_df.loc[best_idx]
    worst = results_df.loc[worst_idx]

    avg_lag = results_df["disclosure_lag_days"].mean() if "disclosure_lag_days" in results_df else None

    return {
        "strategy": strategy_name,
        "hold_days": hold_days,
        "n_trades": len(results_df),
        "win_rate": float(results_df["win"].mean()),
        "beat_market_rate": float(results_df["beat_market"].mean()),
        "avg_return": float(rets.mean()),
        "avg_alpha": float(alphas.mean()),
        "total_return": total_ret,
        "spy_total_return": spy_total,
        "sharpe": sharpe,
        "max_drawdown": float(_max_drawdown(rets)),
        "best_trade": f"{best['ticker']} ({best['politician']}) +{best['trade_return']:.1%}",
        "worst_trade": f"{worst['ticker']} ({worst['politician']}) {worst['trade_return']:.1%}",
        "avg_disclosure_lag_days": round(avg_lag, 1) if avg_lag is not None else "N/A",
    }


def _max_drawdown(returns_series):
    """Max peak-to-trough drawdown of a series of per-trade returns (equal-weighted)."""
    cumulative = (1 + returns_series).cumprod()
    rolling_max = cumulative.cummax()
    drawdown = (cumulative - rolling_max) / rolling_max
    return abs(float(drawdown.min())) if not drawdown.empty else 0.0


def build_equity_curve(results_df, start_value=10000):
    """
    Builds a time-indexed equity curve assuming all trades run in parallel (equal-weight).
    Each trade's daily contribution is computed, then averaged by calendar day.
    Returns a pd.Series(date -> portfolio_value) suitable for plotting.
    """
    if results_df.empty:
        return pd.Series(dtype=float)

    daily_returns = {}
    for _, row in results_df.iterrows():
        date = pd.Timestamp(row["entry_date"]).date()
        r = row["trade_return"]
        if date not in daily_returns:
            daily_returns[date] = []
        daily_returns[date].append(r)

    dates = sorted(daily_returns.keys())
    avg_daily = pd.Series(
        {d: np.mean(daily_returns[d]) for d in dates},
        dtype=float,
    )

    equity = [start_value]
    for r in avg_daily:
        equity.append(equity[-1] * (1 + r))

    return pd.Series(equity[1:], index=avg_daily.index)
