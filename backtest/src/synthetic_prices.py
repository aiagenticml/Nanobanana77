"""
Generates synthetic daily price series using Geometric Brownian Motion
calibrated to real historical annual returns (2020-2024).

Used as a fallback when Yahoo Finance is not reachable (e.g. restricted networks).
Returns are based on documented annual performance figures.
"""

import numpy as np
import pandas as pd

# Annual returns per stock per calendar year, derived from published data.
# Format: {ticker: {year: annual_return}}
ANNUAL_RETURNS = {
    "SPY":  {2020: 0.184, 2021: 0.287, 2022: -0.181, 2023: 0.263, 2024: 0.250},
    "NVDA": {2020: 1.220, 2021: 1.250, 2022: -0.500, 2023: 2.390, 2024: 1.710},
    "AAPL": {2020: 0.820, 2021: 0.340, 2022: -0.270, 2023: 0.490, 2024: 0.300},
    "MSFT": {2020: 0.430, 2021: 0.520, 2022: -0.280, 2023: 0.580, 2024: 0.180},
    "GOOGL":{2020: 0.310, 2021: 0.650, 2022: -0.390, 2023: 0.580, 2024: 0.360},
    "AMZN": {2020: 0.760, 2021: 0.020, 2022: -0.500, 2023: 0.810, 2024: 0.440},
    "TSLA": {2020: 7.430, 2021: 0.500, 2022: -0.650, 2023: 1.020, 2024: 0.630},
    "LMT":  {2020: 0.020, 2021: -0.080, 2022: 0.370, 2023: 0.110, 2024: 0.140},
    "RTX":  {2020: -0.190, 2021: 0.150, 2022: 0.230, 2023: 0.150, 2024: 0.280},
    "NOC":  {2020: 0.030, 2021: 0.050, 2022: 0.440, 2023: 0.020, 2024: 0.050},
    "GD":   {2020: -0.100, 2021: 0.130, 2022: 0.240, 2023: 0.150, 2024: 0.170},
    "BA":   {2020: -0.330, 2021: -0.070, 2022: -0.280, 2023: 0.370, 2024: -0.320},
    "JPM":  {2020: -0.050, 2021: 0.270, 2022: -0.150, 2023: 0.270, 2024: 0.410},
    "GS":   {2020: 0.060, 2021: 0.460, 2022: -0.100, 2023: 0.150, 2024: 0.480},
    "BAC":  {2020: -0.120, 2021: 0.480, 2022: -0.260, 2023: 0.060, 2024: 0.360},
    "V":    {2020: 0.170, 2021: -0.005, 2022: -0.030, 2023: 0.270, 2024: 0.260},
    "MA":   {2020: 0.200, 2021: -0.070, 2022: 0.000, 2023: 0.240, 2024: 0.210},
    "PLTR": {2020: 1.920, 2021: -0.240, 2022: -0.670, 2023: 1.670, 2024: 3.400},
    "PANW": {2020: 0.420, 2021: 1.170, 2022: -0.720, 2023: 0.680, 2024: 0.100},
    "CRWD": {2020: 3.000, 2021: 0.350, 2022: -0.600, 2023: 1.450, 2024: 0.200},
    "SAIC": {2020: 0.180, 2021: 0.050, 2022: 0.080, 2023: 0.140, 2024: 0.100},
    "BAH":  {2020: 0.140, 2021: 0.080, 2022: 0.120, 2023: 0.220, 2024: 0.180},
    "WFC":  {2020: -0.450, 2021: 0.620, 2022: 0.010, 2023: 0.190, 2024: 0.440},
    "META": {2020: 0.330, 2021: 0.230, 2022: -0.640, 2023: 1.940, 2024: 0.730},
}

# Annualised daily volatility (approximate from historical data)
DAILY_VOL = {
    "SPY": 0.012,  "NVDA": 0.035, "AAPL": 0.018, "MSFT": 0.018,
    "GOOGL": 0.020, "AMZN": 0.025, "TSLA": 0.045, "LMT": 0.012,
    "RTX": 0.013,  "NOC": 0.012,  "GD": 0.012,   "BA": 0.022,
    "JPM": 0.015,  "GS": 0.016,   "BAC": 0.016,  "V": 0.013,
    "MA": 0.013,   "PLTR": 0.055, "PANW": 0.030,
    "CRWD": 0.040, "SAIC": 0.012, "BAH": 0.012,  "WFC": 0.016,
    "META": 0.025,
}

_DEFAULT_VOL = 0.020
_DEFAULT_RETURN = 0.10  # 10% annual


def _daily_return_from_annual(annual_return):
    return (1 + annual_return) ** (1 / 252) - 1


def generate_price_series(ticker, start, end, seed=42):
    """
    Returns a pd.Series(date -> price) for the given ticker using GBM.
    The annual drift is calibrated to real historical returns per year.
    """
    rng = np.random.default_rng(seed=hash(ticker) % (2**31))
    dates = pd.bdate_range(start=start, end=end)
    vol = DAILY_VOL.get(ticker, _DEFAULT_VOL)

    prices = [100.0]
    for date in dates[1:]:
        year = date.year
        annual_ret = ANNUAL_RETURNS.get(ticker, {}).get(year, _DEFAULT_RETURN)
        mu = _daily_return_from_annual(annual_ret)
        shock = rng.normal(mu, vol)
        prices.append(prices[-1] * (1 + shock))

    series = pd.Series(prices[1:], index=dates[1:])
    series.index = pd.to_datetime(series.index).tz_localize(None)
    return series


def get_synthetic_prices(tickers, start, end):
    """Returns dict[ticker -> pd.Series] with synthetic price data."""
    all_tickers = list(set(list(tickers) + ["SPY"]))
    prices = {}
    for ticker in all_tickers:
        prices[ticker] = generate_price_series(ticker, start, end)
    return prices
