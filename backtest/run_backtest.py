#!/usr/bin/env python3
"""
Congressional Trade Backtest — CLI Entry Point

Modes:
  standard  All 5 fixed strategies, user-specified hold periods (default)
  sweep     Full parameter sweep: 960 combinations, ranked by Sharpe
  focused   Runs the single best param set from a prior sweep (needs sweep_top10.csv)

Usage:
  python run_backtest.py                                  # standard, 30-day hold
  python run_backtest.py --mode sweep                     # full parameter sweep
  python run_backtest.py --mode focused                   # focused from sweep results
  python run_backtest.py --hold 7 30 90 180               # standard, multiple holds
  python run_backtest.py --strategy pelosi_only           # standard, single strategy
  python run_backtest.py --start 2022-01-01 --end 2024-12-31
  python run_backtest.py --api-key YOUR_QUIVERQUANT_KEY
  python run_backtest.py --clear-cache
"""

import argparse
import os
import shutil
import sys

import pandas as pd

sys.path.insert(0, os.path.dirname(__file__))

from src.fetch_trades import load_trades
from src.price_engine import get_prices
from src.backtest_engine import run
from src.strategies import STRATEGIES
from src.metrics import summarise, build_equity_curve
from src.stats import compute_stats, year_by_year, committee_breakdown, politician_breakdown
from src.parameter_sweep import sweep, get_focused_params, _apply_filters
from src.report import (
    print_summary_table, save_summary_csv,
    plot_equity_curves, plot_alpha_by_politician,
    plot_alpha_by_hold_period, plot_disclosure_lag_histogram,
)
from src.report_advanced import (
    plot_heatmap, plot_year_by_year, plot_committee_breakdown,
    plot_size_vs_alpha, print_sweep_top10, save_sweep_csv,
)

_CACHE_DIR = os.path.join(os.path.dirname(__file__), "data/prices_cache")
_RESULTS_DIR = os.path.join(os.path.dirname(__file__), "results")
_TOP10_PATH = os.path.join(_RESULTS_DIR, "sweep_top10.csv")


def parse_args():
    p = argparse.ArgumentParser(description="Congressional trade backtest")
    p.add_argument("--mode", default="standard",
                   choices=["standard", "sweep", "focused"],
                   help="standard=fixed strategies | sweep=param grid | focused=best from sweep")
    p.add_argument("--api-key", default=None, help="QuiverQuantitative API token")
    p.add_argument("--start", default="2020-01-01", help="Backtest start date (YYYY-MM-DD)")
    p.add_argument("--end", default="2024-12-31", help="Backtest end date (YYYY-MM-DD)")
    p.add_argument("--hold", nargs="+", type=int, default=[30],
                   help="Hold period(s) in days — used in standard mode only")
    p.add_argument("--strategy", default="all",
                   choices=list(STRATEGIES.keys()) + ["all"],
                   help="Strategy to run in standard mode (default: all)")
    p.add_argument("--entry-lag", type=int, default=1,
                   help="Days after disclosure to enter — standard mode only (default: 1)")
    p.add_argument("--clear-cache", action="store_true",
                   help="Delete cached price data and re-download")
    return p.parse_args()


def _load_data(args):
    if args.clear_cache and os.path.exists(_CACHE_DIR):
        shutil.rmtree(_CACHE_DIR)
        os.makedirs(_CACHE_DIR)
        print("[cache] Price cache cleared.")

    print(f"\n[main] Loading trades ({args.start} → {args.end})...")
    trades = load_trades(api_key=args.api_key, start=args.start, end=args.end)
    print(f"[main] {len(trades)} trades loaded across {trades['ticker'].nunique()} tickers.")

    max_hold = 120  # enough buffer for sweep's longest hold
    price_end = (pd.Timestamp(args.end) + pd.Timedelta(days=max_hold + 30)).strftime("%Y-%m-%d")
    tickers = trades["ticker"].unique().tolist()
    print(f"[main] Fetching prices for {len(tickers)} tickers + SPY...")
    prices = get_prices(tickers, start=args.start, end=price_end)
    return trades, prices


def run_standard(args, trades, prices):
    strategies_to_run = (
        STRATEGIES if args.strategy == "all"
        else {args.strategy: STRATEGIES[args.strategy]}
    )

    all_summaries, all_results, equity_curves = [], [], {}
    primary_hold = args.hold[0]

    for hold_days in args.hold:
        print(f"\n[standard] --- Hold {hold_days}d ---")
        for name, fn in strategies_to_run.items():
            bt = run(trades, prices, fn, hold_days=hold_days, entry_lag=args.entry_lag)
            summary = summarise(bt, strategy_name=name, hold_days=hold_days)
            all_summaries.append(summary)
            if not bt.empty:
                all_results.append(bt)
                if hold_days == primary_hold:
                    equity_curves[name] = build_equity_curve(bt)

    print_summary_table(all_summaries)
    save_summary_csv(all_summaries)

    if all_results:
        combined = pd.concat(all_results, ignore_index=True)
        spy_curve = build_equity_curve(
            combined[["entry_date", "spy_return"]].rename(columns={"spy_return": "trade_return"})
            .assign(alpha=0, win=combined["spy_return"] > 0, beat_market=False,
                    politician="SPY", party="", committee="", ticker="SPY",
                    disclosure_lag_days=0, amount_min=0, hold_days=primary_hold)
        )
        plot_equity_curves(equity_curves, spy_curve, hold_days=primary_hold)
        plot_alpha_by_politician(combined, hold_days=primary_hold)
        plot_alpha_by_hold_period(all_summaries)
        plot_disclosure_lag_histogram(combined)


def run_sweep(args, trades, prices):
    sweep_df = sweep(trades, prices, verbose=True)
    if sweep_df.empty:
        print("[sweep] No results — not enough trades per combination.")
        return

    print_sweep_top10(sweep_df)
    save_sweep_csv(sweep_df)

    # Heatmap: hold × lag grid for committee_only signals
    plot_heatmap(sweep_df)

    # Advanced analysis on the overall best parameter set
    best = get_focused_params(sweep_df)
    if best:
        _run_focused_analysis(best, trades, prices, label="sweep_best")


def run_focused(args, trades, prices):
    if not os.path.exists(_TOP10_PATH):
        print(f"[focused] No sweep results found at {_TOP10_PATH}. Run --mode sweep first.")
        return

    top10 = pd.read_csv(_TOP10_PATH)
    best = get_focused_params(top10)
    if best is None:
        print("[focused] Could not determine best params from sweep_top10.csv")
        return

    print(f"\n[focused] Running best strategy: "
          f"hold={int(best['hold_days'])}d lag={int(best['entry_lag'])}d "
          f"amount≥${int(best['amount_min']):,} "
          f"comm={'Y' if best['committee_only'] else 'N'} "
          f"min_pol={int(best['min_politicians'])}")

    _run_focused_analysis(best, trades, prices, label="focused")


def _run_focused_analysis(params, trades, prices, label="focused"):
    """Runs the full analysis pipeline for a single chosen parameter set."""
    hold = int(params["hold_days"])
    lag = int(params["entry_lag"])
    amount = int(params["amount_min"])
    comm_only = bool(params["committee_only"])
    min_pol = int(params["min_politicians"])

    filtered = _apply_filters(trades, amount, comm_only, min_pol)
    if filtered.empty:
        print(f"[{label}] No trades after applying filters.")
        return

    bt = run(filtered, prices, lambda df: df, hold_days=hold, entry_lag=lag)
    if bt.empty:
        print(f"[{label}] Backtest returned no results.")
        return

    stats = compute_stats(bt)
    label_str = (f"hold={hold}d lag={lag}d ≥${amount:,} "
                 f"{'committee' if comm_only else 'all'} "
                 f"min_pol={min_pol}")

    print(f"\n[{label}] Results for: {label_str}")
    print(f"  Trades: {stats['n_trades']}  Win%: {stats['win_rate']:.1%}  "
          f"Avg alpha: {stats['avg_alpha']:+.2%}  Sharpe: {stats['sharpe']:.2f}  "
          f"t={stats['t_stat']:.2f}  p={stats['p_value']:.4f}  "
          f"sig={'YES ✓' if stats['sig'] else 'no'}")

    # Year-by-year
    yby = year_by_year(bt)
    plot_year_by_year(yby, strategy_label=label_str, filename=f"year_by_year_alpha.png")

    # Committee breakdown
    cbd = committee_breakdown(bt)
    plot_committee_breakdown(cbd, filename="committee_alpha.png")

    # Trade size vs alpha
    plot_size_vs_alpha(bt, filename="size_vs_alpha.png")

    # Equity curve for focused strategy
    curve = build_equity_curve(bt)
    spy_curve = build_equity_curve(
        bt[["entry_date", "spy_return"]].rename(columns={"spy_return": "trade_return"})
        .assign(alpha=0, win=bt["spy_return"] > 0, beat_market=False,
                politician="SPY", party="", committee="", ticker="SPY",
                disclosure_lag_days=0, amount_min=0, hold_days=hold)
    )
    plot_equity_curves({label_str: curve}, spy_curve, hold_days=hold,
                       filename=f"equity_curve_{label}.png")

    # Print year-by-year table
    if not yby.empty:
        print(f"\n  Year-by-year alpha (regime check):")
        print(f"  {'Year':<6} {'N':>5} {'Avg Alpha':>10} {'Sig':>5}")
        for yr, row in yby.iterrows():
            s = "✓" if row.get("sig", False) else " "
            n = int(row["n_trades"]) if "n_trades" in row else "?"
            print(f"  {yr:<6} {n:>5} {row['avg_alpha']:>+9.2%} {s:>5}")

    # Print committee breakdown
    if not cbd.empty:
        print(f"\n  Committee breakdown (avg alpha):")
        for comm, row in cbd.iterrows():
            n = int(row["n_trades"]) if "n_trades" in row else "?"
            print(f"  {comm:<25} n={n:<4} alpha={row['avg_alpha']:+.2%}")

    print(f"\n[{label}] Charts saved to backtest/results/")


def main():
    args = parse_args()
    trades, prices = _load_data(args)

    if args.mode == "standard":
        run_standard(args, trades, prices)
    elif args.mode == "sweep":
        run_sweep(args, trades, prices)
    elif args.mode == "focused":
        run_focused(args, trades, prices)

    print("\n[main] Done. Output in backtest/results/\n")


if __name__ == "__main__":
    main()
