"""
Train the booking demand prediction model using Random Forest.
Run: python training/train_demand.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import pickle
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
from utils.db import get_db
from utils.features import extract_booking_features

SAVE_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "demand_model.pkl")


def train():
    db       = get_db()
    bookings = list(db.bookings.find({"status": "Confirmed"}, {"date": 1, "time": 1, "guests": 1}))

    if len(bookings) < 10:
        print(f"⚠️  Only {len(bookings)} confirmed bookings found. Need at least 10 to train.")
        print("   Training a mock model for demonstration...")
        return train_mock()

    rows = [extract_booking_features(b) for b in bookings]
    df   = pd.DataFrame(rows)

    # Aggregate: count bookings per (day_of_week, hour) slot
    demand = df.groupby(["day_of_week", "hour"]).size().reset_index(name="bookings")

    # Fill missing slots with 0
    all_slots = pd.DataFrame(
        [(d, h) for d in range(7) for h in range(12, 22)],
        columns=["day_of_week", "hour"]
    )
    merged = all_slots.merge(demand, on=["day_of_week", "hour"], how="left").fillna(0)

    X = merged[["day_of_week", "hour"]]
    y = merged["bookings"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    mae = mean_absolute_error(y_test, model.predict(X_test))
    print(f"✅ Demand model trained on {len(bookings)} bookings | MAE: {mae:.2f} bookings/slot")

    os.makedirs(os.path.dirname(SAVE_PATH), exist_ok=True)
    with open(SAVE_PATH, "wb") as f:
        pickle.dump(model, f)
    print(f"   Saved to {SAVE_PATH}")


def train_mock():
    """Train on synthetic data so the API still returns predictions"""
    import numpy as np

    rows = []
    for day in range(7):
        for hour in range(12, 22):
            base   = 4.0 if day >= 5 else 2.0    # weekends busier
            peak   = 1.5 if hour in [19, 20] else 0  # dinner rush
            count  = max(0, int(base + peak + np.random.uniform(-0.5, 1.0)))
            for _ in range(count):
                rows.append({"day_of_week": day, "hour": hour})

    df = pd.DataFrame(rows)
    demand = df.groupby(["day_of_week", "hour"]).size().reset_index(name="bookings")
    all_slots = pd.DataFrame(
        [(d, h) for d in range(7) for h in range(12, 22)],
        columns=["day_of_week", "hour"]
    )
    merged = all_slots.merge(demand, on=["day_of_week", "hour"], how="left").fillna(0)

    model = RandomForestRegressor(n_estimators=50, random_state=42)
    model.fit(merged[["day_of_week", "hour"]], merged["bookings"])

    os.makedirs(os.path.dirname(SAVE_PATH), exist_ok=True)
    with open(SAVE_PATH, "wb") as f:
        pickle.dump(model, f)
    print(f"✅ Mock demand model saved to {SAVE_PATH}")


if __name__ == "__main__":
    train()
