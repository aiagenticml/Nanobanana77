# Congressional Trade Backtest

Simulates buying US stocks on the day a congressional trade is **publicly disclosed** (not on the trade date) — modelling what a retail investor can realistically act on.

## Quick start

```bash
cd backtest
pip install -r requirements.txt
python run_backtest.py
```

Outputs to `backtest/results/`:
- `summary_table.csv` — metrics for all strategy × hold-period combinations
- `equity_curves.png` — portfolio growth vs SPY
- `alpha_by_politician.png` — average alpha per politician
- `alpha_by_hold_period.png` — how alpha varies by 7/30/90/180-day holds
- `disclosure_lag.png` — histogram of trade→disclosure delays

## Options

```
--hold 7 30 90 180      Test multiple hold periods (default: 30)
--strategy pelosi_only  Run a single strategy
--start / --end         Date range (default: 2020-01-01 to 2025-12-31)
--api-key KEY           Use live QuiverQuantitative data ($30/mo)
--entry-lag N           Days after disclosure to enter (default: 1)
--clear-cache           Re-download all price data
```

## Strategies

| Strategy | Description |
|---|---|
| `all_buys` | Every congressional purchase |
| `pelosi_only` | Nancy Pelosi purchases only |
| `committee_overlap` | Purchases by members who sit on committees with oversight of that sector |
| `large_trades` | Purchases > $50K only |
| `multi_signal` | Tickers bought by 2+ politicians within 30 days |

## Data sources

- **Seed data**: `data/congress_trades_seed.csv` — ~200 publicly disclosed STOCK Act filings (2020–2025)
- **Live data**: [QuiverQuantitative API](https://api.quiverquant.com) — requires API key
- **Price data**: Yahoo Finance via `yfinance` (free, cached locally)

## Limitations

See the main README for a full discussion. Key caveats:
- STOCK Act has a 45-day filing window — some trades are already priced in
- Seed dataset is ~200 trades (live API has thousands)
- No transaction costs, slippage, or bid/ask spread modelled
- Survivorship bias possible in seed data selection
- Position sizing is equal-weight (not reflective of amount disclosed)
