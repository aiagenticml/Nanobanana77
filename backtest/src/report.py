import os

import matplotlib.pyplot as plt
import matplotlib.ticker as mtick
import pandas as pd

_RESULTS_DIR = os.path.join(os.path.dirname(__file__), "../results")
os.makedirs(_RESULTS_DIR, exist_ok=True)


def print_summary_table(summaries):
    """Prints a formatted summary table to stdout."""
    cols = ["strategy", "hold_days", "n_trades", "win_rate", "beat_market_rate",
            "avg_return", "avg_alpha", "total_return", "spy_total_return", "sharpe", "max_drawdown"]

    print("\n" + "=" * 110)
    print(f"{'STRATEGY':<22} {'HOLD':>5} {'TRADES':>7} {'WIN%':>7} {'BEAT%':>7} "
          f"{'AVG RET':>9} {'AVG ALPHA':>10} {'TOTAL':>9} {'SPY':>9} {'SHARPE':>8} {'MAXDD':>8}")
    print("=" * 110)

    for s in summaries:
        if s.get("n_trades", 0) == 0:
            print(f"  {s['strategy']:<20} — no trades")
            continue
        print(
            f"  {s['strategy']:<20} "
            f"{s['hold_days']:>5}d "
            f"{s['n_trades']:>7} "
            f"{s['win_rate']:>6.1%} "
            f"{s['beat_market_rate']:>7.1%} "
            f"{s['avg_return']:>+8.2%} "
            f"{s['avg_alpha']:>+9.2%} "
            f"{s['total_return']:>+8.1%} "
            f"{s['spy_total_return']:>+8.1%} "
            f"{s['sharpe']:>8.2f} "
            f"{s['max_drawdown']:>7.1%}"
        )
        print(f"    Best: {s['best_trade']}   Worst: {s['worst_trade']}")
        print(f"    Avg disclosure lag: {s['avg_disclosure_lag_days']} days")
        print()

    print("=" * 110)


def save_summary_csv(summaries, filename="summary_table.csv"):
    df = pd.DataFrame(summaries)
    path = os.path.join(_RESULTS_DIR, filename)
    df.to_csv(path, index=False)
    print(f"\n[report] Summary CSV saved to: {path}")


def plot_equity_curves(equity_curves_dict, spy_curve, hold_days, filename="equity_curves.png"):
    """
    equity_curves_dict: {strategy_name: pd.Series(date -> value)}
    spy_curve: pd.Series(date -> value) for SPY baseline
    """
    fig, ax = plt.subplots(figsize=(14, 7))

    colors = ["#2196F3", "#4CAF50", "#FF9800", "#E91E63", "#9C27B0"]
    for (name, curve), color in zip(equity_curves_dict.items(), colors):
        if curve is not None and not curve.empty:
            ax.plot(curve.index, curve.values, label=name, color=color, linewidth=2)

    if spy_curve is not None and not spy_curve.empty:
        ax.plot(spy_curve.index, spy_curve.values, label="SPY (benchmark)",
                color="#757575", linewidth=1.5, linestyle="--")

    ax.set_title(f"Congressional Trade Signal — Equity Curves ({hold_days}-day hold)", fontsize=14)
    ax.set_ylabel("Portfolio Value ($)")
    ax.set_xlabel("Date")
    ax.yaxis.set_major_formatter(mtick.StrMethodFormatter("${x:,.0f}"))
    ax.legend(loc="upper left")
    ax.grid(alpha=0.3)
    plt.tight_layout()

    path = os.path.join(_RESULTS_DIR, filename)
    plt.savefig(path, dpi=150)
    plt.close()
    print(f"[report] Equity curve chart saved to: {path}")


def plot_alpha_by_politician(all_results_df, hold_days, filename="alpha_by_politician.png"):
    """Bar chart of average alpha per politician across all strategies."""
    if all_results_df.empty:
        return

    grouped = (
        all_results_df.groupby("politician")["alpha"]
        .agg(["mean", "count"])
        .rename(columns={"mean": "avg_alpha", "count": "n_trades"})
        .query("n_trades >= 3")
        .sort_values("avg_alpha", ascending=True)
    )

    if grouped.empty:
        return

    fig, ax = plt.subplots(figsize=(10, max(4, len(grouped) * 0.5)))
    colors = ["#4CAF50" if v >= 0 else "#F44336" for v in grouped["avg_alpha"]]
    bars = ax.barh(grouped.index, grouped["avg_alpha"] * 100, color=colors)

    for bar, n in zip(bars, grouped["n_trades"]):
        ax.text(bar.get_width() + 0.1, bar.get_y() + bar.get_height() / 2,
                f"n={n}", va="center", fontsize=8)

    ax.axvline(0, color="black", linewidth=0.8)
    ax.set_xlabel("Avg Alpha vs SPY (%)")
    ax.set_title(f"Average Alpha by Politician ({hold_days}-day hold)")
    ax.xaxis.set_major_formatter(mtick.PercentFormatter())
    plt.tight_layout()

    path = os.path.join(_RESULTS_DIR, filename)
    plt.savefig(path, dpi=150)
    plt.close()
    print(f"[report] Alpha by politician chart saved to: {path}")


def plot_alpha_by_hold_period(hold_summaries, filename="alpha_by_hold_period.png"):
    """
    hold_summaries: list of dicts from summarise(), spanning multiple hold_days values.
    Groups by strategy and plots avg_alpha per hold period.
    """
    if not hold_summaries:
        return

    df = pd.DataFrame(hold_summaries)
    if df.empty or "strategy" not in df.columns:
        return

    strategies = df["strategy"].unique()
    hold_periods = sorted(df["hold_days"].unique())

    fig, ax = plt.subplots(figsize=(10, 6))
    colors = ["#2196F3", "#4CAF50", "#FF9800", "#E91E63", "#9C27B0"]

    for strategy, color in zip(strategies, colors):
        sub = df[df["strategy"] == strategy].sort_values("hold_days")
        if sub.empty:
            continue
        ax.plot(sub["hold_days"], sub["avg_alpha"] * 100, marker="o",
                label=strategy, color=color, linewidth=2)

    ax.axhline(0, color="black", linewidth=0.8, linestyle="--")
    ax.set_xlabel("Hold Period (days)")
    ax.set_ylabel("Avg Alpha vs SPY (%)")
    ax.set_title("Alpha by Hold Period — All Strategies")
    ax.set_xticks(hold_periods)
    ax.yaxis.set_major_formatter(mtick.PercentFormatter())
    ax.legend()
    ax.grid(alpha=0.3)
    plt.tight_layout()

    path = os.path.join(_RESULTS_DIR, filename)
    plt.savefig(path, dpi=150)
    plt.close()
    print(f"[report] Alpha by hold period chart saved to: {path}")


def plot_disclosure_lag_histogram(all_results_df, filename="disclosure_lag.png"):
    """Histogram of disclosure lag days across all trades."""
    if all_results_df.empty or "disclosure_lag_days" not in all_results_df.columns:
        return

    lags = all_results_df["disclosure_lag_days"].dropna()
    if lags.empty:
        return

    fig, ax = plt.subplots(figsize=(10, 5))
    ax.hist(lags, bins=30, color="#2196F3", edgecolor="white", alpha=0.8)
    ax.axvline(lags.median(), color="#F44336", linestyle="--",
               label=f"Median: {lags.median():.0f}d")
    ax.axvline(45, color="#FF9800", linestyle="--", label="STOCK Act limit (45d)")
    ax.set_xlabel("Days from Trade Date to Disclosure Date")
    ax.set_ylabel("Number of Trades")
    ax.set_title("Disclosure Lag Distribution (Trade Date → Public Filing)")
    ax.legend()
    ax.grid(alpha=0.3)
    plt.tight_layout()

    path = os.path.join(_RESULTS_DIR, filename)
    plt.savefig(path, dpi=150)
    plt.close()
    print(f"[report] Disclosure lag histogram saved to: {path}")
