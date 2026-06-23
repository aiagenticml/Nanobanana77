import pandas as pd

# Maps committee names to the tickers they have regulatory/oversight visibility into.
COMMITTEE_SECTOR_MAP = {
    "Armed Services": {"LMT", "RTX", "NOC", "GD", "BA", "HII", "L3T", "LDOS"},
    "Intelligence":   {"PLTR", "MSFT", "GOOGL", "AMZN", "NVDA", "SAIC", "BAH"},
    "Homeland Security": {"PLTR", "MSFT", "AMZN", "PANW", "CRWD", "CACI"},
    "Finance":        {"JPM", "GS", "BAC", "MS", "WFC", "C", "V", "MA", "AXP"},
    "Banking":        {"JPM", "GS", "BAC", "MS", "WFC", "C", "V", "MA"},
    "Financial Services": {"JPM", "GS", "BAC", "MS", "WFC", "C", "V", "MA", "AXP"},
    "Commerce":       {"AMZN", "GOOGL", "META", "MSFT", "AAPL", "NFLX"},
    "Energy & Commerce": {"MSFT", "AAPL", "GOOGL", "META", "AMZN", "CVX", "XOM"},
    "Health":         {"UNH", "JNJ", "PFE", "MRK", "ABBV", "CVS", "CI"},
    "Oversight":      {"MSFT", "GOOGL", "AMZN", "AAPL", "NVDA", "META"},
    "Rules":          set(),  # Leadership committee — unrestricted; kept as empty set
}


def _committee_match(row):
    """Returns True if the traded ticker falls under the politician's committee's sector."""
    committee = row.get("committee", "")
    sector_tickers = COMMITTEE_SECTOR_MAP.get(committee, set())
    if not sector_tickers:
        return False
    return row["ticker"] in sector_tickers


def _multi_signal_filter(df, window_days=30, min_politicians=2):
    """Keeps only trades where 2+ different politicians bought the same ticker within window_days."""
    purchases = df[df["action"] == "Purchase"].copy()
    keep_indices = []

    for ticker, group in purchases.groupby("ticker"):
        group = group.sort_values("disclosure_date")
        for i, row in group.iterrows():
            window_start = row["disclosure_date"]
            window_end = window_start + pd.Timedelta(days=window_days)
            window_trades = group[
                (group["disclosure_date"] >= window_start)
                & (group["disclosure_date"] <= window_end)
            ]
            if window_trades["politician"].nunique() >= min_politicians:
                keep_indices.append(i)

    return df.loc[list(set(keep_indices))]


STRATEGIES = {
    "all_buys": lambda df: df[df["action"] == "Purchase"].copy(),

    "pelosi_only": lambda df: df[
        (df["politician"] == "Nancy Pelosi") & (df["action"] == "Purchase")
    ].copy(),

    "committee_overlap": lambda df: df[
        (df["action"] == "Purchase") & df.apply(_committee_match, axis=1)
    ].copy(),

    "large_trades": lambda df: df[
        (df["action"] == "Purchase") & (df["amount_min"] >= 50001)
    ].copy(),

    "multi_signal": lambda df: _multi_signal_filter(df, window_days=30, min_politicians=2),
}
