#!/usr/bin/env python3
"""
Congressional Trade Backtest — CLI Entry Point

Usage:
  python run_backtest.py                              # seed data, all strategies, 30-day hold
  python run_backtest.py --hold 7 30 90 180           # test multiple hold periods
  python run_backtest.py --strategy pelosi_only       # single strategy
  python run_backtest.py --start 2022-01-01 --end 2024-12-31
  python run_backtest.py --api-key YOUR_QUIVERQUANT_KEY
  python run_backtest.py --clear-cache                # delete cached price files
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
from src.report import (
    print_summary_table,
    save_summary_csv,
    plot_equity_curves,
    plot_alpha_by_politician,
    plot_alpha_by_hold_period,
    plot_disclosure_lag_histogram,
)

_CACHE_DIR = os.path.join(os.path.dirname(__file__), "data/prices_cache")


def parse_args():
    p = argparse.ArgumentParser(description="Congressional trade backtest")
    p.add_argument("--api-key", default=None, help="QuiverQuantitative API token")
    p.add_argument("--start", default="2020-01-01", help="Backtest start date (YYYY-MM-DD)")
    p.add_argument("--end", default="2025-12-31", help="Backtest end date (YYYY-MM-DD)")
    p.add_argument("--hold", nargs="+", type=int, default=[30],
                   help="Hold period(s) in days (space-separated)")
    p.add_argument("--strategy", default="all", choices=list(STRATEGIES.keys()) + ["all"],
                   help="Strategy to run (default: all)")
    p.add_argument("--entry-lag", type=int, default=1,
                   help="Days after disclosure to enter trade (default: 1)")
    p.add_argument("--clear-cache", action="store_true", help="Delete price cache and re-download")
    return p.parse_args()


def main():
    args = parse_args()

    if args.clear_cache and os.path.exists(_CACHE_DIR):
        shutil.rmtree(_CACHE_DIR)
        os.makedirs(_CACHE_DIR)
        print("[cache] Price cache cleared.")

    # 1. Load trades
    print(f"\n[main] Loading trades ({args.start} → {args.end})...")
    trades = load_trades(api_key=args.api_key, start=args.start, end=args.end)
    print(f"[main] {len(trades)} trades loaded. Tickers: {sorted(trades['ticker'].unique())}")

    # 2. Download prices for all unique tickers
    tickers = trades["ticker"].unique().tolist()
    # Add a small buffer around date range for hold-period price lookups
    price_end = pd.Timestamp(args.end) + pd.Timedelta(days=max(args.hold) + 30)
    print(f"\n[main] Fetching prices for {len(tickers)} tickers + SPY...")
    prices = get_prices(tickers, start=args.start, end=price_end.strftime("%Y-%m-%d"))

    # 3. Select strategies to run
    strategies_to_run = (
        {k: v for k, v in STRATEGIES.items()} if args.strategy == "all"
        else {args.strategy: STRATEGIES[args.strategy]}
    )

    # 4. Run backtests across all strategy × hold_period combinations
    all_summaries = []
    equity_curves_by_strategy = {}  # keyed by (strategy, hold_days)
    spy_curve = None
    all_results = []

    primary_hold = args.hold[0]  # use first hold period for equity curves / politician chart

    for hold_days in args.hold:
        print(f"\n[main] --- Hold period: {hold_days}d ---")
        for name, strategy_fn in strategies_to_run.items():
            print(f"  Running strategy: {name}...")
            results = run(trades, prices, strategy_fn, hold_days=hold_days, entry_lag=args.entry_lag)
            summary = summarise(results, strategy_name=name, hold_days=hold_days)
            all_summaries.append(summary)

            if not results.empty:
                all_results.append(results)
                if hold_days == primary_hold:
                    equity_curves_by_strategy[name] = build_equity_curve(results)

    # 5. Build SPY baseline equity curve using first strategy's result dates
    if all_results:
        combined = pd.concat(all_results, ignore_index=True)
        if not combined.empty and hold_days == primary_hold:
            spy_curve = build_equity_curve(
                combined[["entry_date", "spy_return"]].rename(
                    columns={"spy_return": "trade_return"}
                ).assign(alpha=0, win=combined["spy_return"] > 0,
                         beat_market=False, politician="SPY",
                         party="", committee="", ticker="SPY",
                         disclosure_lag_days=0, amount_min=0,
                         hold_days=primary_hold)
            )

    # 6. Print and save results
    print_summary_table(all_summaries)
    save_summary_csv(all_summaries)

    if all_results:
        combined_all = pd.concat(all_results, ignore_index=True)

        plot_equity_curves(equity_curves_by_strategy, spy_curve, hold_days=primary_hold)
        plot_alpha_by_politician(combined_all, hold_days=primary_hold)
        plot_alpha_by_hold_period(all_summaries)
        plot_disclosure_lag_histogram(combined_all)

    print("\n[main] Done. Check backtest/results/ for output charts and CSV.\n")


if __name__ == "__main__":
    main()
