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
except Exception as e:
    # Fallback/Error handling if model not found
    print(json.dumps({'error': str(e)}))
    sys.exit(1)

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
        
        # Prepare input for Daily Model
        # Features: weekday, month, promo
        current_month = datetime.now().month
        
        # Create DataFrame for prediction
        X = pd.DataFrame([{
            'weekday': day_of_week,
            'month': current_month,
            'promo': event_flag
        }])
        
        # Predict Daily Demand
        daily_preds = model.predict(X)[0] # Array of sales for all items
        
        # Distribute to Hourly
        hourly_factor = hourly_factors.get(hour, 0.04)
        
        predictions = {}
        uncertainty = {}
        lower_bound = {}
        upper_bound = {}
        
        for i, item in enumerate(items):
            daily_val = daily_preds[i]
            
            # 1. Apply Hourly Factor
            hourly_val = daily_val * hourly_factor
            
            # 2. Apply Weather Adjustment
            hourly_val = apply_weather_adjustment(hourly_val, temperature, rainfall)
            
            predictions[item] = round(max(0, hourly_val), 1)
            
            # 3. Calculate Uncertainty
            # Scale daily uncertainty to hourly
            # Strictly speaking, hourly variance is higher relative to mean, 
            # but usually proportional to volume.
            # Let's use specific uncertainty * hourly_factor * safety_multiplier
            raw_uncertainty = daily_uncertainty[item] * hourly_factor * 1.5
            uncertainty[item] = round(max(0.5, raw_uncertainty), 2)
            
            # 4. Calculate Bounds (95% CI -> +/- 1.96 std dev)
            lower_bound[item] = round(max(0, hourly_val - 1.96 * uncertainty[item]), 1)
            upper_bound[item] = round(hourly_val + 1.96 * uncertainty[item], 1)
            
        output = {
            'predictions': predictions,
            'uncertainty': uncertainty,
            'lower_bound': lower_bound,
            'upper_bound': upper_bound
        }
        
        print(json.dumps(output))
        
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
