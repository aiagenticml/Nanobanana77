import itertools

import numpy as np
import pandas as pd
from scipy.stats import false_discovery_control

from .backtest_engine import run
from .strategies import COMMITTEE_SECTOR_MAP, _committee_match
from .stats import compute_stats

# Out-of-sample split: parameters are selected on IN_SAMPLE data only.
# The reported alpha/Sharpe/p-value for the chosen params is then evaluated
# on OUT_SAMPLE data — unseen during selection.  This prevents overfitting.
IN_SAMPLE_END  = "2022-12-31"   # 3 years for parameter selection
OUT_SAMPLE_START = "2023-01-01" # 2 years held back for honest validation

HOLD_PERIODS    = [7, 14, 21, 30, 45, 60, 90, 120]
ENTRY_LAGS      = [0, 1, 3, 7]
AMOUNT_MINS     = [1000, 15001, 50001, 100001, 250001]
COMMITTEE_ONLY  = [True, False]
MIN_POLITICIANS = [1, 2, 3]

MIN_TRADES = 5  # skip parameter combos with fewer than this many trades


def sweep(trades_df, prices, verbose=True):
    """
    Runs the backtest engine over all parameter combinations on IN-SAMPLE data
    (2020-2022), then applies Benjamini-Hochberg FDR correction to control for
    multiple comparisons across 960 tested combinations.

    The best parameter set selected from the in-sample sweep is then evaluated
    out-of-sample (2023-2024) and the OOS result is appended as 'oos_*' columns.

    Columns: hold_days, entry_lag, amount_min, committee_only, min_politicians,
             n_trades, win_rate, avg_alpha, sharpe, t_stat, p_value,
             p_value_fdr (BH-corrected), sig_fdr, [oos_* on best row only]
    """
    # Split into in-sample (parameter selection) and out-of-sample (honest test)
    is_mask = pd.to_datetime(trades_df["disclosure_date"]) <= IN_SAMPLE_END
    trades_is  = trades_df[is_mask].copy()
    trades_oos = trades_df[~is_mask].copy()

    combos = list(itertools.product(
        HOLD_PERIODS, ENTRY_LAGS, AMOUNT_MINS, COMMITTEE_ONLY, MIN_POLITICIANS
    ))
    total = len(combos)
    if verbose:
        print(f"[sweep] Testing {total} parameter combinations on IN-SAMPLE data "
              f"(≤{IN_SAMPLE_END})...")

    rows = []
    for i, (hold, lag, amount, comm_only, min_pol) in enumerate(combos):
        if verbose and i % 50 == 0:
            print(f"  [{i}/{total}] hold={hold}d lag={lag}d amount≥${amount:,} "
                  f"comm={'Y' if comm_only else 'N'} min_pol={min_pol}")

        filtered = _apply_filters(trades_is, amount, comm_only, min_pol)
        if len(filtered) < MIN_TRADES:
            continue

        bt = run(filtered, prices, lambda df: df, hold_days=hold, entry_lag=lag)
        if bt.empty or len(bt) < MIN_TRADES:
            continue

        stats = compute_stats(bt)
        rows.append({
            "hold_days": hold,
            "entry_lag": lag,
            "amount_min": amount,
            "committee_only": comm_only,
            "min_politicians": min_pol,
            **stats,
        })

    if not rows:
        return pd.DataFrame()

    df = pd.DataFrame(rows)
    df = df.dropna(subset=["sharpe", "p_value"])

    # Benjamini-Hochberg FDR correction: controls expected false discovery rate
    # across all tested combinations.  Use this column for significance, not raw p_value.
    p_vals = df["p_value"].values
    try:
        # false_discovery_control returns BH-adjusted p-values (floats, not booleans)
        fdr_adjusted_p = false_discovery_control(p_vals, method="bh")
        df["sig_fdr"] = (fdr_adjusted_p < 0.05).astype(bool)
    except Exception:
        # scipy < 1.11 doesn't have false_discovery_control — fall back to Bonferroni
        bonf_thresh = 0.05 / len(df)
        df["sig_fdr"] = (df["p_value"] < bonf_thresh).astype(bool)

    # Keep original uncorrected significance for reference
    df = df.rename(columns={"sig": "sig_uncorrected"})
    df = df.sort_values("sharpe", ascending=False).reset_index(drop=True)

    if verbose:
        n_sig_raw = df["sig_uncorrected"].sum()
        n_sig_fdr = df["sig_fdr"].sum()
        print(f"[sweep] Done. {len(df)} valid combinations.")
        print(f"[sweep] Significant (uncorrected p<0.05): {n_sig_raw} "
              f"— after BH-FDR correction: {n_sig_fdr}")
        print(f"[sweep] Out-of-sample period: {OUT_SAMPLE_START} → present")

    # Evaluate best in-sample param set on out-of-sample data
    _attach_oos_result(df, trades_oos, prices, verbose=verbose)

    return df


def _attach_oos_result(df, trades_oos, prices, verbose=True):
    """
    Runs the top in-sample parameter set on out-of-sample data.
    Attaches oos_* columns to the best row in df (in place).
    """
    # Pick best IS combo: prefer sig_fdr + committee_only, fall back to highest Sharpe
    sig_comm = df[df["sig_fdr"].astype(bool) & df["committee_only"].astype(bool)]
    best_row = sig_comm.iloc[0] if not sig_comm.empty else df.iloc[0]
    best_idx = best_row.name

    hold  = int(best_row["hold_days"])
    lag   = int(best_row["entry_lag"])
    amt   = int(best_row["amount_min"])
    comm  = bool(best_row["committee_only"])
    mpol  = int(best_row["min_politicians"])

    filtered_oos = _apply_filters(trades_oos, amt, comm, mpol)
    if len(filtered_oos) < MIN_TRADES:
        df.loc[best_idx, "oos_n"] = len(filtered_oos)
        df.loc[best_idx, "oos_note"] = "too few OOS trades"
        if verbose:
            print(f"[sweep] OOS validation: only {len(filtered_oos)} trades — cannot evaluate.")
        return

    bt_oos = run(filtered_oos, prices, lambda d: d, hold_days=hold, entry_lag=lag)
    if bt_oos.empty:
        df.loc[best_idx, "oos_note"] = "no OOS backtest results"
        return

    oos_stats = compute_stats(bt_oos)
    for k, v in oos_stats.items():
        df.loc[best_idx, f"oos_{k}"] = v

    if verbose:
        sig_label = "✓ SIGNIFICANT" if oos_stats.get("sig") else "✗ not significant"
        print(f"[sweep] OOS result for best IS params "
              f"(hold={hold}d lag={lag}d ≥${amt:,} comm={'Y' if comm else 'N'} mpol={mpol}):")
        print(f"  OOS n={oos_stats['n_trades']}  avg_alpha={oos_stats['avg_alpha']:+.2%}  "
              f"Sharpe={oos_stats['sharpe']:.2f}  t={oos_stats['t_stat']:.2f}  "
              f"p={oos_stats['p_value']:.4f}  {sig_label}")


def _apply_filters(trades_df, amount_min, committee_only, min_politicians):
    """
    Pre-filters the trades DataFrame before passing to the backtest engine.
    Applies: purchases only, min trade size, optional committee overlap, min politician count.
    """
    df = trades_df[trades_df["action"] == "Purchase"].copy()

    # Trade size threshold
    if "amount_min" in df.columns:
        df = df[df["amount_min"] >= amount_min]

    # Committee overlap filter
    if committee_only:
        df = df[df.apply(_committee_match, axis=1)]

    # Multi-politician threshold: only tickers bought by ≥ min_politicians within 60 days
    if min_politicians > 1:
        df = _multi_pol_filter(df, min_politicians=min_politicians, window_days=60)

    return df.reset_index(drop=True)


def _multi_pol_filter(df, min_politicians, window_days):
    """Keeps only trades where ≥ min_politicians bought the same ticker within window_days."""
    keep = []
    for ticker, group in df.groupby("ticker"):
        group = group.sort_values("disclosure_date")
        for i, row in group.iterrows():
            window_end = row["disclosure_date"] + pd.Timedelta(days=window_days)
            window = group[
                (group["disclosure_date"] >= row["disclosure_date"])
                & (group["disclosure_date"] <= window_end)
            ]
            if window["politician"].nunique() >= min_politicians:
                keep.append(i)
    if not keep:
        return df.iloc[0:0]
    return df.loc[list(set(keep))]


def get_focused_params(sweep_df):
    """
    Returns the single best parameter combination from the sweep results.
    Prioritises: FDR-corrected significant, committee_only=True, highest Sharpe.
    Falls back to uncorrected significance, then overall highest Sharpe.
    """
    if sweep_df.empty:
        return None

    sig_col = "sig_fdr" if "sig_fdr" in sweep_df.columns else "sig_uncorrected"
    sig = sweep_df[sweep_df[sig_col].astype(bool) & sweep_df["committee_only"].astype(bool)]
    if not sig.empty:
        return sig.iloc[0].to_dict()

    # Fall back: any FDR-significant combo regardless of committee filter
    sig_any = sweep_df[sweep_df[sig_col].astype(bool)]
    if not sig_any.empty:
        return sig_any.iloc[0].to_dict()

    return sweep_df.iloc[0].to_dict()
