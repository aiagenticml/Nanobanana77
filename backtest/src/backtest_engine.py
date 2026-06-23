from datetime import timedelta

import pandas as pd

from .price_engine import get_return, _nearest_trading_day

# Realistic transaction cost assumptions:
#   0.05% one-way spread (market-order fill vs mid price) × 2 round-trips = 0.10%
#   $5 flat commission per trade (e-broker rate, both legs combined)
# These are deducted from trade_return before computing alpha.
# Override via COST_SPREAD_RT and COST_COMMISSION at module level for sensitivity tests.
COST_SPREAD_RT = 0.0010   # 0.10% round-trip spread cost
COST_COMMISSION = 5.0     # $5 flat per round-trip (expressed as fraction of a $10k position)
_POSITION_SIZE = 10_000   # assumed position size for commission fraction calculation
_COMMISSION_FRAC = COST_COMMISSION / _POSITION_SIZE  # 0.05% of $10k


def run(trades_df, prices, strategy_fn, hold_days=30, entry_lag=1):
    """
    Simulates buying on disclosure_date + entry_lag days and holding for hold_days.

    entry_lag=1 means we enter on the next market day after disclosure — realistic for
    a retail investor who reads the filing after market close.

    Returns a DataFrame of per-trade results.
    """
    filtered = strategy_fn(trades_df).copy()
    if filtered.empty:
        return pd.DataFrame()

    results = []
    for _, row in filtered.iterrows():
        ticker = row["ticker"]
        if ticker not in prices:
            continue

        raw_entry = pd.Timestamp(row["disclosure_date"]) + timedelta(days=entry_lag)
        entry = _nearest_trading_day(raw_entry, prices[ticker])
        if entry is None:
            continue

        trade_ret = get_return(ticker, entry, hold_days, prices)
        spy_ret = get_return("SPY", entry, hold_days, prices)

        if pd.isna(trade_ret) or pd.isna(spy_ret):
            continue

        # Deduct round-trip transaction costs from the trade (not from SPY benchmark).
        # This makes alpha comparisons realistic: you pay to trade, benchmark doesn't.
        cost = COST_SPREAD_RT + _COMMISSION_FRAC
        trade_ret_net = trade_ret - cost

        lag_days = (row["disclosure_date"] - row["trade_date"]).days if pd.notna(row.get("trade_date")) else None

        results.append({
            "politician": row["politician"],
            "party": row.get("party", ""),
            "committee": row.get("committee", ""),
            "ticker": ticker,
            "disclosure_date": row["disclosure_date"],
            "entry_date": entry,
            "hold_days": hold_days,
            "trade_return": trade_ret_net,
            "trade_return_gross": trade_ret,
            "spy_return": spy_ret,
            "alpha": trade_ret_net - spy_ret,
            "win": trade_ret_net > 0,
            "beat_market": trade_ret_net > spy_ret,
            "disclosure_lag_days": lag_days,
            "amount_min": row.get("amount_min", 0),
        })

    return pd.DataFrame(results)
