import pandas as pd
import numpy as np

np.random.seed(42)
dates = pd.date_range(start="2022-01-01", end="2026-06-30", freq="D")
n = len(dates)

# Simulated core maritime drivers
bunker_fuel = 480 + 90 * np.sin(np.linspace(0, 18, n)) + np.random.normal(0, 12, n)
bdi_index = 1600 + 650 * np.cos(np.linspace(0, 14, n)) + np.random.normal(0, 40, n)
bci_index = bdi_index * 1.45 + np.random.normal(0, 60, n) # Capesize index
bpi_index = bdi_index * 0.95 + np.random.normal(0, 35, n) # Panamax index

# Port wait days at East Coast Indian ports
paradip_wait = np.clip(np.random.poisson(lam=3.8, size=n), 1, 14)
vizag_wait = np.clip(np.random.poisson(lam=1.5, size=n), 1, 8)
haldia_wait = np.clip(np.random.poisson(lam=6.2, size=n), 2, 18)

# Freight rates ($/tonne)
# Australia (Hay Point) -> Paradip (Capesize)
rate_aus_paradip = 13.5 + (bci_index * 0.005) + (bunker_fuel * 0.012) + np.random.normal(0, 0.6, n)
# Indonesia (Taboneo) -> Haldia/Dhamra (Panamax)
rate_indo_dhamra = 9.8 + (bpi_index * 0.0042) + (bunker_fuel * 0.010) + np.random.normal(0, 0.45, n)
# South Africa (Richards Bay) -> Vizag (Capesize/Panamax)
rate_sa_vizag = 15.2 + (bci_index * 0.0048) + (bunker_fuel * 0.015) + np.random.normal(0, 0.7, n)

df = pd.DataFrame({
    "date": dates,
    "baltic_dry_index": np.round(bdi_index, 0),
    "baltic_capesize_index": np.round(bci_index, 0),
    "baltic_panamax_index": np.round(bpi_index, 0),
    "bunker_fuel_vlsfo_usd": np.round(bunker_fuel, 2),
    "paradip_wait_days": paradip_wait,
    "vizag_wait_days": vizag_wait,
    "haldia_wait_days": haldia_wait,
    "rate_aus_paradip": np.round(rate_aus_paradip, 2),
    "rate_indo_dhamra": np.round(rate_indo_dhamra, 2),
    "rate_sa_vizag": np.round(rate_sa_vizag, 2)
})

df.to_csv("data/raw_freight_data.csv", index=False)
print(f"Generated {len(df)} records in data/raw_freight_data.csv")
