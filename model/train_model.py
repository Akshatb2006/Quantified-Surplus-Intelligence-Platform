"""
Demand Prediction Model Training
Trains a RandomForest multi-output regressor on synthetic sales data
with uncertainty estimation via residual standard deviation.
"""

import pandas as pd
import numpy as np
import joblib
import os
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score

ITEMS = ['burger', 'fries', 'wrap', 'bucket', 'drink']
FEATURES = ['hour', 'day_of_week', 'temperature', 'rainfall', 'event_flag']

def main():
    # Load data
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_path = os.path.join(base_dir, 'data', 'synthetic_data.csv')
    df = pd.read_csv(data_path)

    target_cols = [f'{item}_orders' for item in ITEMS]

    X = df[FEATURES].values
    y = df[target_cols].values

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Train multi-output RandomForest
    model = RandomForestRegressor(
        n_estimators=150,
        max_depth=12,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    print("📊 Model Performance:")
    for i, item in enumerate(ITEMS):
        mae = mean_absolute_error(y_test[:, i], y_pred[:, i])
        r2 = r2_score(y_test[:, i], y_pred[:, i])
        print(f"   {item:>8}: MAE={mae:.2f}, R²={r2:.3f}")

    # Calculate uncertainty (residual standard deviation per item)
    y_pred_train = model.predict(X_train)
    residuals = y_train - y_pred_train
    uncertainty = {
        item: float(np.std(residuals[:, i]))
        for i, item in enumerate(ITEMS)
    }
    print(f"\n📉 Uncertainty (residual std dev):")
    for item, std in uncertainty.items():
        print(f"   {item:>8}: ±{std:.2f}")

    # Save model and metadata
    model_dir = os.path.dirname(os.path.abspath(__file__))
    model_data = {
        'model': model,
        'features': FEATURES,
        'items': ITEMS,
        'target_cols': target_cols,
        'uncertainty': uncertainty,
    }
    model_path = os.path.join(model_dir, 'demand_model.pkl')
    joblib.dump(model_data, model_path)
    print(f"\n✅ Model saved to {model_path}")

if __name__ == '__main__':
    main()
