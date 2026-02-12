"""
Synthetic Historical Sales Data Generator
Generates 30 days × 24 hours of realistic restaurant sales data
for 5 menu items with weather and event correlations.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

np.random.seed(42)

ITEMS = ['burger', 'fries', 'wrap', 'bucket', 'drink']
NUM_DAYS = 30
START_DATE = datetime(2025, 1, 1)

def generate_weather(num_days):
    """Generate realistic daily weather patterns."""
    temps = []
    rainfalls = []
    for d in range(num_days):
        # Base temperature with seasonal variation
        base_temp = 25 + 10 * np.sin(2 * np.pi * d / 365)
        for h in range(24):
            # Diurnal temperature variation
            hour_offset = -5 * np.cos(2 * np.pi * (h - 14) / 24)
            temp = base_temp + hour_offset + np.random.normal(0, 2)
            temps.append(round(temp, 1))

            # Rainfall: higher probability on some days
            rain_prob = 0.3 if d % 7 in [2, 5] else 0.1
            rain = max(0, np.random.exponential(2)) if np.random.random() < rain_prob else 0.0
            rainfalls.append(round(rain, 1))
    return temps, rainfalls

def generate_event_flags(num_days):
    """Generate event flags (weekend evenings, special events)."""
    flags = []
    for d in range(num_days):
        day_of_week = (START_DATE + timedelta(days=d)).weekday()
        for h in range(24):
            is_weekend_evening = day_of_week >= 4 and 17 <= h <= 22
            is_special_event = d in [5, 12, 20, 27] and 18 <= h <= 22  # Match days
            flag = 1 if (is_weekend_evening or is_special_event) else 0
            flags.append(flag)
    return flags

def generate_orders(hour, day_of_week, temperature, rainfall, event_flag):
    """Generate order counts for each item based on features."""

    # Base orders per item per hour (peak at lunch/dinner)
    lunch_peak = np.exp(-0.5 * ((hour - 13) / 2) ** 2)
    dinner_peak = np.exp(-0.5 * ((hour - 20) / 2.5) ** 2)
    time_factor = 0.1 + 0.9 * (lunch_peak + dinner_peak)

    # Weekend multiplier
    # Weekend multiplier: MASSIVE boost for lunch too
    weekend_mult = 2.5 if day_of_week >= 5 else 1.0

    # Rain effect: increases delivery orders (all items)
    rain_mult = 1.0 + 0.3 * min(rainfall / 5, 1.0)

    # Event effect: MASSIVE spike to force baseline stockout
    event_mult = 3.0 if event_flag else 1.0

    orders = {}
    # Base demand per item
    base = {
        'burger': 15, 'fries': 20, 'wrap': 10,
        'bucket': 8, 'drink': 25
    }

    for item in ITEMS:
        base_demand = base[item] * time_factor * weekend_mult * rain_mult * event_mult

        # Temperature effect on drinks
        if item == 'drink':
            temp_mult = 1.0 + 0.02 * max(0, temperature - 25)
            base_demand *= temp_mult

        # Bucket more popular on weekends
        if item == 'bucket':
            base_demand *= (1.3 if day_of_week >= 5 else 1.0)

        # Add noise
        noise = np.random.poisson(max(1, base_demand * 0.15))
        orders[item] = max(0, int(base_demand + noise - base_demand * 0.15))

    return orders

def main():
    """Generate and save synthetic dataset."""
    temps, rainfalls = generate_weather(NUM_DAYS)
    event_flags = generate_event_flags(NUM_DAYS)

    rows = []
    for d in range(NUM_DAYS):
        date = START_DATE + timedelta(days=d)
        day_of_week = date.weekday()

        for h in range(24):
            idx = d * 24 + h
            temperature = temps[idx]
            rainfall = rainfalls[idx]
            event_flag = event_flags[idx]

            orders = generate_orders(h, day_of_week, temperature, rainfall, event_flag)

            rows.append({
                'date': date.strftime('%Y-%m-%d'),
                'hour': h,
                'day_of_week': day_of_week,
                'temperature': temperature,
                'rainfall': rainfall,
                'event_flag': event_flag,
                'burger_orders': orders['burger'],
                'fries_orders': orders['fries'],
                'wrap_orders': orders['wrap'],
                'bucket_orders': orders['bucket'],
                'drink_orders': orders['drink'],
            })

    df = pd.DataFrame(rows)

    # Ensure data directory exists
    data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data')
    os.makedirs(data_dir, exist_ok=True)
    filepath = os.path.join(data_dir, 'synthetic_data.csv')
    df.to_csv(filepath, index=False)

    print(f"✅ Generated {len(df)} rows of synthetic data")
    print(f"   Date range: {df['date'].min()} to {df['date'].max()}")
    print(f"   Saved to: {filepath}")
    print(f"\n   Sample stats:")
    for item in ITEMS:
        col = f"{item}_orders"
        print(f"   {item:>8}: mean={df[col].mean():.1f}, max={df[col].max()}, total={df[col].sum()}")

if __name__ == '__main__':
    main()
