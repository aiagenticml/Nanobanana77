import itertools

import pandas as pd

from .backtest_engine import run
from .strategies import COMMITTEE_SECTOR_MAP, _committee_match
from .stats import compute_stats

HOLD_PERIODS    = [7, 14, 21, 30, 45, 60, 90, 120]
ENTRY_LAGS      = [0, 1, 3, 7]
AMOUNT_MINS     = [1000, 15001, 50001, 100001, 250001]
COMMITTEE_ONLY  = [True, False]
MIN_POLITICIANS = [1, 2, 3]

MIN_TRADES = 5  # skip parameter combos with fewer than this many trades


def sweep(trades_df, prices, verbose=True):
    """
    Runs the backtest engine over all parameter combinations and returns a
    DataFrame ranked by Sharpe ratio (descending).

    Columns: hold_days, entry_lag, amount_min, committee_only, min_politicians,
             n_trades, win_rate, beat_market_rate, avg_return, avg_alpha,
             sharpe, t_stat, p_value, sig, win_binom_p, ic
    """
    combos = list(itertools.product(
        HOLD_PERIODS, ENTRY_LAGS, AMOUNT_MINS, COMMITTEE_ONLY, MIN_POLITICIANS
    ))
    total = len(combos)
    if verbose:
        print(f"[sweep] Testing {total} parameter combinations...")

    rows = []
    for i, (hold, lag, amount, comm_only, min_pol) in enumerate(combos):
        if verbose and i % 50 == 0:
            print(f"  [{i}/{total}] hold={hold}d lag={lag}d amount≥${amount:,} "
                  f"comm={'Y' if comm_only else 'N'} min_pol={min_pol}")

        filtered = _apply_filters(trades_df, amount, comm_only, min_pol)
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
    df = df.dropna(subset=["sharpe"])
    df = df.sort_values("sharpe", ascending=False).reset_index(drop=True)

    if verbose:
        print(f"[sweep] Done. {len(df)} valid combinations found.")

    return df


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
    Prioritises: statistically significant (p<0.05), committee_only=True, highest Sharpe.
    Falls back to overall highest Sharpe if no significant results exist.
    """
    if sweep_df.empty:
        return None

    sig = sweep_df[sweep_df["sig"] & sweep_df["committee_only"]]
    if not sig.empty:
        return sig.iloc[0].to_dict()

    return sweep_df.iloc[0].to_dict()
