import math

import numpy as np
import pandas as pd
from scipy import stats as scipy_stats


def compute_stats(results_df):
    """
    Returns a dict of statistical metrics for a backtest results DataFrame.
    Includes t-test significance, binomial win-rate test, and information coefficient.
    """
    if results_df.empty:
        return _empty_stats()

    alphas = results_df["alpha"].dropna()
    rets = results_df["trade_return"].dropna()
    n = len(alphas)

    if n < 5:
        return _empty_stats(n=n)

    # One-sample t-test: H0 = avg alpha is 0
    t_stat, p_value = scipy_stats.ttest_1samp(alphas, popmean=0)

    # Binomial test: H0 = win rate is 50%
    n_wins = int(results_df["win"].sum())
    binom_result = scipy_stats.binomtest(n_wins, n, p=0.5, alternative="greater")
    win_binom_p = binom_result.pvalue

    # Information coefficient: Spearman rank correlation (trade size → alpha)
    if "amount_min" in results_df.columns and results_df["amount_min"].nunique() > 1:
        ic, ic_p = scipy_stats.spearmanr(results_df["amount_min"], results_df["alpha"])
    else:
        ic, ic_p = float("nan"), float("nan")

    std = alphas.std()
    sharpe = float(alphas.mean() / std * math.sqrt(252)) if std > 0 else float("nan")

    return {
        "n_trades": n,
        "win_rate": float(results_df["win"].mean()),
        "beat_market_rate": float(results_df["beat_market"].mean()),
        "avg_return": float(rets.mean()),
        "avg_alpha": float(alphas.mean()),
        "alpha_std": float(std),
        "sharpe": round(sharpe, 3),
        "t_stat": round(float(t_stat), 3),
        "p_value": round(float(p_value), 4),
        "sig": bool(p_value < 0.05),
        "win_binom_p": round(float(win_binom_p), 4),
        "ic": round(float(ic), 3) if not math.isnan(ic) else float("nan"),
        "ic_p": round(float(ic_p), 4) if not math.isnan(ic_p) else float("nan"),
    }


def _empty_stats(n=0):
    nan = float("nan")
    return {
        "n_trades": n, "win_rate": nan, "beat_market_rate": nan,
        "avg_return": nan, "avg_alpha": nan, "alpha_std": nan,
        "sharpe": nan, "t_stat": nan, "p_value": nan, "sig": False,
        "win_binom_p": nan, "ic": nan, "ic_p": nan,
    }


def year_by_year(results_df):
    """
    Groups results by entry year, returns a DataFrame with:
      year, n_trades, avg_alpha, std_alpha, win_rate, t_stat, p_value
    Useful for showing regime dependency (2022 bear vs 2023/2024 bull).
    """
    if results_df.empty:
        return pd.DataFrame()

    df = results_df.copy()
    df["year"] = pd.to_datetime(df["entry_date"]).dt.year

    rows = []
    for year, group in df.groupby("year"):
        s = compute_stats(group)
        rows.append({"year": year, **s})

    return pd.DataFrame(rows).set_index("year")


def committee_breakdown(results_df):
    """
    Groups results by committee, returns avg_alpha, win_rate, n_trades, t_stat per committee.
    Only includes committees with ≥3 trades.
    """
    if results_df.empty or "committee" not in results_df.columns:
        return pd.DataFrame()

    rows = []
    for committee, group in results_df.groupby("committee"):
        if len(group) < 3:
            continue
        s = compute_stats(group)
        rows.append({"committee": committee, **s})

    if not rows:
        return pd.DataFrame()

    return pd.DataFrame(rows).set_index("committee").sort_values("avg_alpha", ascending=False)


def politician_breakdown(results_df):
    """
    Groups results by politician, returns avg_alpha and n_trades.
    Only includes politicians with ≥3 trades.
    """
    if results_df.empty:
        return pd.DataFrame()

    rows = []
    for pol, group in results_df.groupby("politician"):
        if len(group) < 3:
            continue
        s = compute_stats(group)
        rows.append({"politician": pol, **s})

    if not rows:
        return pd.DataFrame()

    return pd.DataFrame(rows).set_index("politician").sort_values("avg_alpha", ascending=False)
