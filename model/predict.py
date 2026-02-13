import sys
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime

# Load model artifacts
import os
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'demand_model_kaggle.pkl')
try:
    model_data = joblib.load(MODEL_PATH)
    model = model_data['model']
    features = model_data['features']
    items = model_data['items']
    daily_uncertainty = model_data['uncertainty']
    hourly_factors = model_data['daily_to_hourly_factors']
    model_version = model_data.get('model_version', 'v1')
except Exception as e:
    print(json.dumps({'error': str(e)}))
    sys.exit(1)

# Historical averages (fallback for lag/rolling features when no history is available)
# These are per-item mean sales from the training data
HISTORICAL_MEANS = {
    'burger': 37.0, 'fries': 32.0, 'wrap': 36.0, 'bucket': 35.0, 'drink': 27.0
}
HISTORICAL_STDS = {
    'burger': 5.0, 'fries': 4.5, 'wrap': 5.0, 'bucket': 4.8, 'drink': 3.5
}
# Typical prices from the training data
DEFAULT_PRICES = {
    'burger': 21.3, 'fries': 14.2, 'wrap': 18.4, 'bucket': 32.5, 'drink': 8.7
}

def apply_weather_adjustment(demand, temperature, rainfall):
    """
    Heuristic weather adjustment since Kaggle dataset lacks weather.
    """
    adj = 1.0
    
    # Rainfall penalty
    if rainfall > 0:
        if rainfall > 5:
            adj *= 0.85 # Heavy rain
        else:
            adj *= 0.95 # Light rain
            
    # Temperature penalty (too hot/cold)
    if temperature > 35 or temperature < 5:
        adj *= 0.90
        
    return demand * adj

def build_v2_features(day_of_week, current_month, event_flag):
    """Build v2 feature vector (44 features) with reasonable defaults for lag/rolling."""
    row = {
        'weekday': day_of_week,
        'month': current_month,
        'promo': event_flag,
        'day_of_month': datetime.now().day,
        'year': datetime.now().year,
        'is_weekend': 1 if day_of_week >= 5 else 0,
        'is_month_start': 1 if datetime.now().day <= 3 else 0,
        'is_month_end': 1 if datetime.now().day >= 28 else 0,
        'quarter': (current_month - 1) // 3 + 1,
    }
    
    # Add per-item features: lag_1, lag_7, lag_14, price, rolling_mean_7, rolling_std_7, rolling_mean_30
    for item in items:
        mean_val = HISTORICAL_MEANS.get(item, 30.0)
        std_val = HISTORICAL_STDS.get(item, 5.0)
        
        # Add small noise to lag values so they vary realistically
        noise_factor = 1.0 + (day_of_week - 3) * 0.02  # Weekday variation
        
        row[f'lag_1_{item}'] = round(mean_val * noise_factor, 1)
        row[f'lag_7_{item}'] = round(mean_val * 1.0, 1) # Same weekday last week
        row[f'lag_14_{item}'] = round(mean_val * 0.98, 1) # 2 weeks ago
        row[f'price_{item}'] = DEFAULT_PRICES.get(item, 15.0)
        row[f'rolling_mean_7_{item}'] = round(mean_val, 1)
        row[f'rolling_std_7_{item}'] = round(std_val, 2)
        row[f'rolling_mean_30_{item}'] = round(mean_val * 0.98, 1)
    
    return row

def build_v1_features(day_of_week, current_month, event_flag):
    """Build v1 feature vector (3 features)."""
    return {
        'weekday': day_of_week,
        'month': current_month,
        'promo': event_flag
    }

def main():
    try:
        # Read input from stdin
        input_str = sys.stdin.read()
        if not input_str:
            return
            
        input_data = json.loads(input_str)
        
        # Extract features
        hour = input_data.get('hour', 12)
        day_of_week = input_data.get('day_of_week', 0)
        temperature = input_data.get('temperature', 25)
        rainfall = input_data.get('rainfall', 0)
        event_flag = input_data.get('event_flag', 0)
        
        current_month = datetime.now().month
        
        # Build features based on model version
        if model_version == 'v2':
            row = build_v2_features(day_of_week, current_month, event_flag)
        else:
            row = build_v1_features(day_of_week, current_month, event_flag)
        
        # Create DataFrame with correct feature order
        X = pd.DataFrame([row])
        # Ensure columns match model's expected features
        X = X.reindex(columns=features, fill_value=0)
        
        # Predict Daily Demand
        daily_preds = model.predict(X)[0] # Array of sales for all items
        
        # Distribute to Hourly
        hourly_factor = hourly_factors.get(hour, 0.04)
        
        predictions = {}
        uncertainty = {}
        lower_bound = {}
        upper_bound = {}
        
        for i, item in enumerate(items):
            daily_val = max(0, daily_preds[i])
            
            # 1. Apply Hourly Factor
            hourly_val = daily_val * hourly_factor
            
            # 2. Apply Weather Adjustment
            hourly_val = apply_weather_adjustment(hourly_val, temperature, rainfall)
            
            predictions[item] = round(max(0, hourly_val), 1)
            
            # 3. Calculate Uncertainty (scaled for hourly)
            raw_uncertainty = daily_uncertainty[item] * hourly_factor * 1.5
            uncertainty[item] = round(max(0.5, raw_uncertainty), 2)
            
            # 4. Calculate Bounds (95% CI -> +/- 1.96 std dev)
            lower_bound[item] = round(max(0, hourly_val - 1.96 * uncertainty[item]), 1)
            upper_bound[item] = round(hourly_val + 1.96 * uncertainty[item], 1)
            
        # Prepare Daily Predictions Dict
        daily_predictions = {}
        daily_unc = {}
        for i, item in enumerate(items):
            daily_predictions[item] = round(max(0, daily_preds[i]), 1)
            daily_unc[item] = daily_uncertainty[item]

        output = {
            'predictions': predictions,
            'uncertainty': uncertainty,
            'lower_bound': lower_bound,
            'upper_bound': upper_bound,
            'daily_predictions': daily_predictions,
            'daily_uncertainty': daily_unc,
            'hourly_forecast': {},
            'model_version': model_version,
            'model_accuracy': model_data.get('accuracy', {})
        }

        # Generate 24h forecast (aggregated across all items)
        total_daily_demand = sum(max(0, p) for p in daily_preds)
        for h in range(24):
            factor = hourly_factors.get(h, 0.04)
            h_val = total_daily_demand * factor
            h_val = apply_weather_adjustment(h_val, temperature, rainfall)
            output['hourly_forecast'][h] = round(h_val, 1)
        
        print(json.dumps(output))
        
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
