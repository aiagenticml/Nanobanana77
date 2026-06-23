import os
import math

import matplotlib.pyplot as plt
import matplotlib.ticker as mtick
import matplotlib.colors as mcolors
import numpy as np
import pandas as pd

_RESULTS_DIR = os.path.join(os.path.dirname(__file__), "../results")
os.makedirs(_RESULTS_DIR, exist_ok=True)


def plot_heatmap(sweep_df, filename="heatmap_committee.png"):
    """
    Heatmap of avg_alpha by hold_days (x) × entry_lag (y).
    Filtered to committee_only=True, amount_min=$50K, min_politicians=1.
    """
    subset = sweep_df[
        sweep_df["committee_only"] & (sweep_df["amount_min"] == 50001) & (sweep_df["min_politicians"] == 1)
    ]
    if subset.empty:
        subset = sweep_df[sweep_df["committee_only"]]
    if subset.empty:
        print("[report_advanced] No data for heatmap — skipping.")
        return

    pivot = subset.pivot_table(
        index="entry_lag", columns="hold_days", values="avg_alpha", aggfunc="mean"
    )

    fig, ax = plt.subplots(figsize=(12, 5))
    vmax = max(abs(pivot.values.min()), abs(pivot.values.max()), 0.001)
    norm = mcolors.TwoSlopeNorm(vmin=-vmax, vcenter=0, vmax=vmax)
    im = ax.imshow(pivot.values, cmap="RdYlGn", norm=norm, aspect="auto")

    ax.set_xticks(range(len(pivot.columns)))
    ax.set_xticklabels([f"{c}d" for c in pivot.columns])
    ax.set_yticks(range(len(pivot.index)))
    ax.set_yticklabels([f"{r}d lag" for r in pivot.index])
    ax.set_xlabel("Hold Period")
    ax.set_ylabel("Entry Lag (days after disclosure)")
    ax.set_title("Avg Alpha: Hold Period × Entry Lag\n(Committee Overlap, ≥$50K trades)")

    for r in range(len(pivot.index)):
        for c in range(len(pivot.columns)):
            val = pivot.values[r, c]
            if not math.isnan(val):
                ax.text(c, r, f"{val:.1%}", ha="center", va="center", fontsize=8,
                        color="black")

    plt.colorbar(im, ax=ax, label="Avg Alpha vs SPY", format=mtick.PercentFormatter(xmax=1))
    plt.tight_layout()
    path = os.path.join(_RESULTS_DIR, filename)
    plt.savefig(path, dpi=150)
    plt.close()
    print(f"[report_advanced] Heatmap saved: {path}")


def plot_year_by_year(year_df, strategy_label="Best Strategy", filename="year_by_year_alpha.png"):
    """
    Bar chart of avg_alpha per year with error bars (±1 std / sqrt(n)).
    Includes a zero reference line for SPY alpha = 0.
    """
    if year_df is None or year_df.empty:
        return

    df = year_df.copy()
    df["se"] = df["alpha_std"] / np.sqrt(df["n_trades"].clip(lower=1))
    colors = ["#4CAF50" if v >= 0 else "#F44336" for v in df["avg_alpha"]]

    fig, ax = plt.subplots(figsize=(10, 5))
    bars = ax.bar(df.index.astype(str), df["avg_alpha"] * 100, color=colors,
                  yerr=df["se"] * 100, capsize=5, alpha=0.85, edgecolor="white")

    for bar, sig in zip(bars, df.get("sig", [False] * len(df))):
        if sig:
            ax.text(bar.get_x() + bar.get_width() / 2,
                    bar.get_height() + 0.3, "★", ha="center", fontsize=10, color="#1565C0")

    ax.axhline(0, color="black", linewidth=1.0, linestyle="--")
    ax.set_xlabel("Year")
    ax.set_ylabel("Avg Alpha vs SPY (%)")
    ax.set_title(f"Year-by-Year Alpha — {strategy_label}\n(★ = statistically significant at 95%)")
    ax.yaxis.set_major_formatter(mtick.PercentFormatter())
    ax.grid(axis="y", alpha=0.3)
    plt.tight_layout()
    path = os.path.join(_RESULTS_DIR, filename)
    plt.savefig(path, dpi=150)
    plt.close()
    print(f"[report_advanced] Year-by-year chart saved: {path}")


def plot_committee_breakdown(committee_df, filename="committee_alpha.png"):
    """
    Horizontal bar chart of avg_alpha per committee with ±1 SE error bars.
    """
    if committee_df is None or committee_df.empty:
        return

    df = committee_df.copy().reset_index()
    df["se"] = df["alpha_std"] / np.sqrt(df["n_trades"].clip(lower=1))
    df = df.sort_values("avg_alpha")
    colors = ["#4CAF50" if v >= 0 else "#F44336" for v in df["avg_alpha"]]

    fig, ax = plt.subplots(figsize=(10, max(4, len(df) * 0.6)))
    bars = ax.barh(df["committee"], df["avg_alpha"] * 100,
                   xerr=df["se"] * 100, capsize=4,
                   color=colors, alpha=0.85, edgecolor="white")

    for bar, n in zip(bars, df["n_trades"]):
        ax.text(bar.get_width() + 0.1, bar.get_y() + bar.get_height() / 2,
                f"n={n}", va="center", fontsize=8)

    ax.axvline(0, color="black", linewidth=0.8)
    ax.set_xlabel("Avg Alpha vs SPY (%)")
    ax.set_title("Avg Alpha by Committee (90-day hold, best params)")
    ax.xaxis.set_major_formatter(mtick.PercentFormatter())
    plt.tight_layout()
    path = os.path.join(_RESULTS_DIR, filename)
    plt.savefig(path, dpi=150)
    plt.close()
    print(f"[report_advanced] Committee breakdown chart saved: {path}")


def plot_size_vs_alpha(results_df, filename="size_vs_alpha.png"):
    """
    Scatter plot of trade size (log scale) vs alpha per trade.
    Includes OLS trend line and R² annotation.
    """
    if results_df is None or results_df.empty:
        return
    if "amount_min" not in results_df.columns:
        return

    df = results_df.dropna(subset=["alpha", "amount_min"])
    df = df[df["amount_min"] > 0]
    if len(df) < 5:
        return

    log_size = np.log10(df["amount_min"])
    alpha = df["alpha"] * 100

    # OLS regression
    coeffs = np.polyfit(log_size, alpha, 1)
    trend = np.poly1d(coeffs)
    x_range = np.linspace(log_size.min(), log_size.max(), 100)

    corr = np.corrcoef(log_size, alpha)[0, 1]
    r2 = corr ** 2

    fig, ax = plt.subplots(figsize=(10, 6))
    ax.scatter(log_size, alpha, alpha=0.5, s=30, color="#2196F3", label="Individual trade")
    ax.plot(x_range, trend(x_range), color="#F44336", linewidth=2,
            label=f"Trend (R²={r2:.3f})")

    ax.axhline(0, color="black", linewidth=0.8, linestyle="--")
    ax.set_xlabel("Log₁₀(Trade Size, $)")
    ax.set_ylabel("Alpha vs SPY (%)")
    ax.set_title("Does Trade Size Predict Alpha?\n(Larger trades = higher politician conviction)")
    ax.xaxis.set_major_formatter(
        plt.FuncFormatter(lambda x, _: f"${10**x:,.0f}")
    )
    ax.yaxis.set_major_formatter(mtick.PercentFormatter())
    ax.legend()
    ax.grid(alpha=0.3)
    plt.tight_layout()
    path = os.path.join(_RESULTS_DIR, filename)
    plt.savefig(path, dpi=150)
    plt.close()
    print(f"[report_advanced] Size vs alpha scatter saved: {path}")


def print_sweep_top10(sweep_df):
    """
    Prints the top 10 parameter combinations from the sweep, ranked by Sharpe.
    Shows BH-FDR corrected significance alongside raw p-value.
    """
    if sweep_df.empty:
        print("[report_advanced] No sweep results to display.")
        return

    has_fdr = "sig_fdr" in sweep_df.columns
    sig_col = "sig_fdr" if has_fdr else "sig_uncorrected"

    top = sweep_df.head(10)
    width = 115 if has_fdr else 105
    print("\n" + "=" * width)
    print("TOP 10 PARAMETER COMBINATIONS (ranked by Sharpe, in-sample only)")
    if has_fdr:
        print("NOTE: SIG column uses Benjamini-Hochberg FDR correction for multiple comparisons.")
    print("=" * width)
    hdr = (f"{'#':>3} {'HOLD':>5} {'LAG':>4} {'AMOUNT':>9} {'COMM':>5} {'MPOL':>5} "
           f"{'N':>5} {'WIN%':>6} {'AVG α':>8} {'SHARPE':>7} {'T-STAT':>7} {'P-VAL':>7}")
    hdr += " {'FDR-SIG':>8}" if has_fdr else " {'SIG':>4}"
    print(hdr)
    print("-" * width)
    for rank, (_, row) in enumerate(top.iterrows(), 1):
        sig_mark = "✓ FDR" if (has_fdr and row.get("sig_fdr")) else (
            "✓" if row.get("sig_uncorrected") else " "
        )
        line = (
            f"{rank:>3} "
            f"{int(row['hold_days']):>4}d "
            f"{int(row['entry_lag']):>3}d "
            f"${int(row['amount_min']):>8,} "
            f"{'Y' if row['committee_only'] else 'N':>5} "
            f"{int(row['min_politicians']):>5} "
            f"{int(row['n_trades']):>5} "
            f"{row['win_rate']:>5.1%} "
            f"{row['avg_alpha']:>+7.2%} "
            f"{row['sharpe']:>7.2f} "
            f"{row['t_stat']:>7.2f} "
            f"{row['p_value']:>7.4f} "
            f"{sig_mark:>8}"
        )
        print(line)
    print("=" * width)

    # Print OOS result for the best combo if available
    oos_row = sweep_df[sweep_df["oos_n"].notna()].head(1) if "oos_n" in sweep_df.columns else pd.DataFrame()
    if not oos_row.empty:
        r = oos_row.iloc[0]
        oos_sig = "✓ SIGNIFICANT" if r.get("oos_sig") else "✗ not significant"
        print(f"\nOUT-OF-SAMPLE validation (best IS params on 2023–2024 data):")
        print(f"  n={int(r['oos_n'])}  avg_alpha={r['oos_avg_alpha']:+.2%}  "
              f"Sharpe={r['oos_sharpe']:.2f}  t={r['oos_t_stat']:.2f}  "
              f"p={r['oos_p_value']:.4f}  {oos_sig}")


def save_sweep_csv(sweep_df, filename="sweep_results.csv"):
    if sweep_df.empty:
        return
    path = os.path.join(_RESULTS_DIR, filename)
    sweep_df.to_csv(path, index=False)
    print(f"[report_advanced] Full sweep results saved: {path}")

    top10_path = os.path.join(_RESULTS_DIR, "sweep_top10.csv")
    sweep_df.head(10).to_csv(top10_path, index=False)
    print(f"[report_advanced] Top 10 saved: {top10_path}")
