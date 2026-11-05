import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
import pickle

df = pd.read_csv("data/raw_freight_data.csv")
df['date'] = pd.to_datetime(df['date'])
df['day_of_year'] = df['date'].dt.dayofyear
df['month'] = df['date'].dt.month

# Multi-route model dict
routes = {
    "Australia_Paradip": "rate_aus_paradip",
    "Indonesia_Dhamra": "rate_indo_dhamra",
    "SouthAfrica_Vizag": "rate_sa_vizag"
}

models_dict = {}

for route_name, target_col in routes.items():
    temp_df = df.copy()
    for lag in [7, 14, 30]:
        temp_df[f'rate_lag_{lag}'] = temp_df[target_col].shift(lag)
        temp_df[f'bdi_lag_{lag}'] = temp_df['baltic_dry_index'].shift(lag)
    
    temp_df = temp_df.dropna()
    features = ['day_of_year', 'month', 'bunker_fuel_vlsfo_usd', 'baltic_dry_index',
                'rate_lag_7', 'rate_lag_14', 'rate_lag_30', 'bdi_lag_7']
    
    X = temp_df[features]
    y = temp_df[target_col]
    
    # Train test split (last 120 days test)
    split_idx = len(X) - 120
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]
    
    rf = RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42)
    rf.fit(X_train, y_train)
    
    preds = rf.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    r2 = r2_score(y_test, preds)
    print(f"[{route_name}] MAE: {mae:.2f} $/tonne, R2 Score: {r2:.3f}")
    
    models_dict[route_name] = {
        "model": rf,
        "features": features,
        "last_known_features": X.iloc[-1].to_dict(),
        "last_rate": float(y.iloc[-1]),
        "mae": round(float(mae), 2)
    }

with open("models/freight_model.pkl", "wb") as f:
    pickle.dump(models_dict, f)

print("Saved multi-route models to models/freight_model.pkl")
