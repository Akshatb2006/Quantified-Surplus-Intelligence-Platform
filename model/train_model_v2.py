"""
Improved Demand Prediction Model (v2)
========================================
Features engineered:
  - weekday, month, promo (original)
  - price
  - day_of_month, is_weekend, is_month_start, is_month_end
  - lag_1, lag_7 (previous day & same day last week)
  - rolling_mean_7, rolling_std_7 (7-day rolling stats)
  - rolling_mean_30 (30-day rolling mean)
  - year (trend capture)
  - item encoded (train one model, more data)

Uses multiple stores for more training data.
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score, mean_squared_error
from sklearn.multioutput import MultiOutputRegressor
import joblib
import json
import warnings
warnings.filterwarnings('ignore')

# Configuration
DATA_PATH = '../data/kaggle_data.csv'
MODEL_PATH = 'demand_model_kaggle.pkl'

# Map Kaggle items to our menu
ITEM_MAPPING = {
    'item_1': 'burger',
    'item_2': 'fries',
    'item_3': 'wrap',
    'item_4': 'bucket',
    'item_5': 'drink'
}

ITEMS = list(ITEM_MAPPING.values())

# Use top 10 stores for more data (not just store_1)
STORES_TO_USE = [f'store_{i}' for i in range(1, 11)]


def load_and_process_data():
    print("Loading data...")
    df = pd.read_csv(DATA_PATH)

    # Use multiple stores for more training data
    df = df[df['store_id'].isin(STORES_TO_USE)]
    df = df[df['item_id'].isin(ITEM_MAPPING.keys())]
    df['item'] = df['item_id'].map(ITEM_MAPPING)
    df['date'] = pd.to_datetime(df['date'])

    print(f"  Filtered data: {len(df)} rows from {df['store_id'].nunique()} stores")
    return df


def engineer_features(df):
    """Create rich feature set from raw data."""
    print("Engineering features...")

    # Sort for lag computation
    df = df.sort_values(['store_id', 'item', 'date']).reset_index(drop=True)

    # Basic time features
    df['day_of_month'] = df['date'].dt.day
    df['year'] = df['date'].dt.year
    df['is_weekend'] = (df['weekday'] >= 5).astype(int)
    df['is_month_start'] = (df['day_of_month'] <= 3).astype(int)
    df['is_month_end'] = (df['day_of_month'] >= 28).astype(int)
    df['quarter'] = df['date'].dt.quarter

    # Lag features (per store+item group)
    group = df.groupby(['store_id', 'item'])['sales']
    df['lag_1'] = group.shift(1)
    df['lag_7'] = group.shift(7)
    df['lag_14'] = group.shift(14)

    # Rolling features
    df['rolling_mean_7'] = group.transform(lambda x: x.rolling(7, min_periods=1).mean())
    df['rolling_std_7'] = group.transform(lambda x: x.rolling(7, min_periods=1).std())
    df['rolling_mean_30'] = group.transform(lambda x: x.rolling(30, min_periods=1).mean())

    # Fill NaN from lags (first few rows per group)
    df['lag_1'] = df['lag_1'].fillna(df['rolling_mean_7'])
    df['lag_7'] = df['lag_7'].fillna(df['rolling_mean_7'])
    df['lag_14'] = df['lag_14'].fillna(df['rolling_mean_30'])
    df['rolling_std_7'] = df['rolling_std_7'].fillna(0)

    # Drop any remaining NaN
    df = df.dropna()

    print(f"  After feature engineering: {len(df)} rows")
    return df


def train_model():
    df = load_and_process_data()
    df = engineer_features(df)

    # Pivot: one row per (date, store_id) with sales for each item as columns
    pivot_df = df.pivot_table(
        index=['date', 'store_id', 'weekday', 'month', 'promo', 'day_of_month',
               'year', 'is_weekend', 'is_month_start', 'is_month_end', 'quarter'],
        columns='item',
        values=['sales', 'price', 'lag_1', 'lag_7', 'lag_14',
                'rolling_mean_7', 'rolling_std_7', 'rolling_mean_30'],
        aggfunc='first'
    ).reset_index()

    # Flatten multi-level columns
    pivot_df.columns = ['_'.join(col).strip('_') if isinstance(col, tuple) else col
                        for col in pivot_df.columns]

    pivot_df = pivot_df.fillna(0)

    # Define feature columns (everything except target sales columns and identifiers)
    id_cols = ['date', 'store_id']
    target_cols = [f'sales_{item}' for item in ITEMS]

    feature_cols = [c for c in pivot_df.columns if c not in id_cols + target_cols]

    X = pivot_df[feature_cols]
    Y = pivot_df[target_cols]
    Y.columns = ITEMS  # Rename back to item names

    print(f"\nFeature matrix: {X.shape[0]} rows × {X.shape[1]} features")
    print(f"Features: {feature_cols}")

    # Time-based split (more realistic than random)
    # Use last 20% of dates as test set
    dates = pivot_df['date'].sort_values().unique()
    split_date = dates[int(len(dates) * 0.8)]
    train_mask = pivot_df['date'] < split_date
    test_mask = pivot_df['date'] >= split_date

    X_train, X_test = X[train_mask], X[test_mask]
    y_train, y_test = Y[train_mask], Y[test_mask]

    print(f"Train: {len(X_train)} rows, Test: {len(X_test)} rows")
    print(f"Train period: up to {split_date}")

    # Model: GradientBoosting for better accuracy
    print("\nTraining GradientBoostingRegressor (multi-output)...")
    base_model = GradientBoostingRegressor(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        random_state=42
    )
    model = MultiOutputRegressor(base_model, n_jobs=-1)
    model.fit(X_train, y_train)

    # Evaluation on test set
    y_pred = model.predict(X_test)
    print("\n" + "=" * 60)
    print("MODEL PERFORMANCE (Test Set — Time-Based Split)")
    print("=" * 60)
    print(f'{"Item":<10} {"MAE":>8} {"RMSE":>8} {"R²":>8} {"MAPE":>8} {"AvgSales":>10}')
    print('-' * 60)
    r2s = []
    for i, item in enumerate(ITEMS):
        mae = mean_absolute_error(y_test[item], y_pred[:, i])
        rmse = np.sqrt(mean_squared_error(y_test[item], y_pred[:, i]))
        r2 = r2_score(y_test[item], y_pred[:, i])
        avg = y_test[item].mean()
        mape = (mae / avg * 100) if avg > 0 else 0
        r2s.append(r2)
        print(f'{item:<10} {mae:>8.2f} {rmse:>8.2f} {r2:>8.3f} {mape:>7.1f}% {avg:>10.1f}')
    print('-' * 60)
    avg_r2 = np.mean(r2s)
    print(f'{"AVERAGE":<10} {"":>8} {"":>8} {avg_r2:>8.3f}')
    print(f'\nOverall R² Score: {avg_r2:.3f} ({avg_r2 * 100:.1f}%)')

    # Uncertainty from residuals
    y_pred_train = model.predict(X_train)
    residuals = y_train.values - y_pred_train
    uncertainty = {item: float(np.std(residuals[:, i])) for i, item in enumerate(ITEMS)}
    print("\nUncertainty (Std Dev of Residuals):")
    for item, unc in uncertainty.items():
        print(f"  {item}: {unc:.2f}")

    # Feature importance (from first sub-model as representative)
    importances = model.estimators_[0].feature_importances_
    feat_imp = sorted(zip(feature_cols, importances), key=lambda x: -x[1])[:15]
    print("\nTop 15 Features:")
    for feat, imp in feat_imp:
        print(f"  {feat:<35} {imp:.4f}")

    # Save model (keep backward-compatible structure)
    model_data = {
        'model': model,
        'features': feature_cols,
        'items': ITEMS,
        'uncertainty': uncertainty,
        'daily_to_hourly_factors': get_hourly_factors(),
        'model_version': 'v2',
        'accuracy': {
            'avg_r2': round(avg_r2, 4),
            'per_item_r2': {item: round(r2s[i], 4) for i, item in enumerate(ITEMS)}
        }
    }
    joblib.dump(model_data, MODEL_PATH)
    print(f"\nModel saved to {MODEL_PATH}")
    print(f"Model version: v2 (GradientBoosting, {len(feature_cols)} features)")


def get_hourly_factors():
    """Heuristic hourly distribution for a restaurant."""
    weights = {
        0: 0.0, 1: 0.0, 2: 0.0, 3: 0.0, 4: 0.0, 5: 0.0,
        6: 0.0, 7: 0.0, 8: 0.01, 9: 0.02,
        10: 0.04, 11: 0.06,
        12: 0.10, 13: 0.12, 14: 0.10,
        15: 0.06, 16: 0.05, 17: 0.06,
        18: 0.08, 19: 0.10, 20: 0.10, 21: 0.08,
        22: 0.04, 23: 0.02
    }
    total = sum(weights.values())
    return {h: w / total for h, w in weights.items()}


if __name__ == '__main__':
    train_model()
