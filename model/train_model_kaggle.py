import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import json

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

def load_and_process_data():
    print("Loading data...")
    df = pd.read_csv(DATA_PATH)
    
    # Filter for Store 1
    df = df[df['store_id'] == 'store_1']
    
    # Filter for selected items
    df = df[df['item_id'].isin(ITEM_MAPPING.keys())]
    
    # Rename items
    df['item'] = df['item_id'].map(ITEM_MAPPING)
    
    # Ensure date is datetime
    df['date'] = pd.to_datetime(df['date'])
    
    return df

def train_model():
    df = load_and_process_data()
    
    # Prepare features
    # Kaggle data has: date, store_id, item, sales, price, promo, weekday, month
    # We will use: weekday, month, promo
    
    X = df[['weekday', 'month', 'promo']]
    y = df.pivot(index=['date', 'weekday', 'month', 'promo'], columns='item', values='sales').reset_index()
    y = y.fillna(0)
    
    # Pivot table has multi-index columns potentially, let's fix
    # The pivot result columns will be index cols + item names
    # But pivot structure is: index=date..., columns=item, values=sales.
    # So flattened, we get one row per date.
    
    # Features for the model (per date)
    feature_cols = ['weekday', 'month', 'promo']
    X_final = y[feature_cols]
    y_final = y[ITEMS] # Target: sales for each item
    
    print(f"Training data shape: {X_final.shape}")
    
    # Train/Test Split
    X_train, X_test, y_train, y_test = train_test_split(X_final, y_final, test_size=0.2, random_state=42)
    
    # Model
    print("Training RandomForestRegressor...")
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    # Evaluation
    y_pred = model.predict(X_test)
    print("\nModel Performance:")
    for i, item in enumerate(ITEMS):
        mae = mean_absolute_error(y_test[item], y_pred[:, i])
        r2 = r2_score(y_test[item], y_pred[:, i])
        print(f"{item}: MAE={mae:.2f}, R2={r2:.3f}")
        
    # Calculate Uncertainty (Residual Std Dev)
    # We use the whole training set residuals for this
    y_pred_train = model.predict(X_train)
    residuals = y_train - y_pred_train
    uncertainty = {item: np.std(residuals[item]) for item in ITEMS}
    print("\nUncertainty (Std Dev of Residuals):")
    print(json.dumps(uncertainty, indent=2))
    
    # Save Model
    model_data = {
        'model': model,
        'features': feature_cols,
        'items': ITEMS,
        'uncertainty': uncertainty,
        'daily_to_hourly_factors': get_hourly_factors() # Helper for distribution
    }
    joblib.dump(model_data, MODEL_PATH)
    print(f"\nModel saved to {MODEL_PATH}")

def get_hourly_factors():
    # Heuristic hourly distribution for a restaurant
    # Peak lunch (12-14) and dinner (19-21)
    # Hours 0-23
    factors = {}
    
    # Base pattern (sum = 1.0)
    # 0-9: Low/Closed
    # 10-11: Ramp up
    # 12-14: Lunch Peak
    # 15-17: Afternoon dip
    # 18-21: Dinner Peak
    # 22-23: Wind down
    
    weights = {
        0: 0.0, 1: 0.0, 2: 0.0, 3: 0.0, 4: 0.0, 5: 0.0, 
        6: 0.0, 7: 0.0, 8: 0.01, 9: 0.02, 
        10: 0.04, 11: 0.06, 
        12: 0.10, 13: 0.12, 14: 0.10, 
        15: 0.06, 16: 0.05, 17: 0.06, 
        18: 0.08, 19: 0.10, 20: 0.10, 21: 0.08, 
        22: 0.04, 23: 0.02
    }
    
    total_weight = sum(weights.values()) # Should be ~1.0 but normalize anyway
    for h, w in weights.items():
        factors[h] = w / total_weight
        
    return factors

if __name__ == "__main__":
    train_model()
