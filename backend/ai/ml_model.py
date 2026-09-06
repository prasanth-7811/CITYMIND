import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, r2_score
import pickle
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), "congestion_model.pkl")
SCALER_PATH = os.path.join(os.path.dirname(__file__), "scaler.pkl")

FEATURE_NAMES = [
    "avg_utilization",
    "max_utilization",
    "closed_road_utilization",
    "event_size_norm",
    "weather_impact",
    "traffic_condition_score",
    "hour_of_day",
    "is_peak_hour",
    "is_weekend",
    "num_reports",
    "avg_report_severity",
    "num_affected_roads",
    "road_capacity_ratio",
]

def generate_training_data(n_samples: int = 5000) -> pd.DataFrame:
    np.random.seed(42)
    records = []
    for _ in range(n_samples):
        hour = np.random.randint(0, 24)
        is_peak = 1 if (7 <= hour <= 9 or 17 <= hour <= 19) else 0
        is_weekend = np.random.choice([0, 1], p=[0.71, 0.29])
        avg_util = np.random.beta(2, 3)
        max_util = min(avg_util + np.random.uniform(0.1, 0.4), 1.0)
        closed_util = np.random.beta(3, 2) if np.random.random() > 0.5 else 0.0
        event_size_norm = np.random.choice([0, 0.1, 0.3, 0.6, 1.0], p=[0.5, 0.2, 0.15, 0.1, 0.05])
        weather_impact = np.random.choice([0, 0.05, 0.15, 0.25, 0.35, 0.45], p=[0.4, 0.15, 0.2, 0.1, 0.1, 0.05])
        traffic_score = np.random.choice([0.1, 0.3, 0.6, 0.9], p=[0.2, 0.4, 0.3, 0.1])
        num_reports = np.random.poisson(3)
        avg_severity = np.random.uniform(1, 5)
        num_affected = np.random.randint(0, 8)
        capacity_ratio = np.random.uniform(0.5, 1.5)

        # Ground truth congestion — realistic formula with noise
        congestion = (
            35 * avg_util +
            15 * max_util +
            12 * closed_util +
            10 * event_size_norm +
            8  * weather_impact +
            8  * traffic_score +
            5  * is_peak +
            3  * (num_reports / 20) +
            2  * (avg_severity / 5) +
            2  * (num_affected / 10)
        ) * 100 / (35+15+12+10+8+8+5+3+2+2)

        # Peak hour boost
        if is_peak:
            congestion *= 1.15
        if is_weekend:
            congestion *= 0.85

        congestion = float(np.clip(congestion + np.random.normal(0, 3), 5, 98))

        records.append({
            "avg_utilization": avg_util,
            "max_utilization": max_util,
            "closed_road_utilization": closed_util,
            "event_size_norm": event_size_norm,
            "weather_impact": weather_impact,
            "traffic_condition_score": traffic_score,
            "hour_of_day": hour,
            "is_peak_hour": is_peak,
            "is_weekend": is_weekend,
            "num_reports": num_reports,
            "avg_report_severity": avg_severity,
            "num_affected_roads": num_affected,
            "road_capacity_ratio": capacity_ratio,
            "congestion": congestion,
        })
    return pd.DataFrame(records)

def train_model():
    print("Generating training data...")
    df = generate_training_data(5000)
    X = df[FEATURE_NAMES]
    y = df["congestion"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    print("Training Random Forest model...")
    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=12,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train_scaled, y_train)

    y_pred = model.predict(X_test_scaled)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    print(f"Model trained — MAE: {mae:.2f}%, R²: {r2:.4f}")

    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    with open(SCALER_PATH, "wb") as f:
        pickle.dump(scaler, f)

    print(f"Model saved to {MODEL_PATH}")
    return model, scaler

def load_model():
    if not os.path.exists(MODEL_PATH) or not os.path.exists(SCALER_PATH):
        return train_model()
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)
    with open(SCALER_PATH, "rb") as f:
        scaler = pickle.load(f)
    return model, scaler

# Singleton
_model = None
_scaler = None

def get_model():
    global _model, _scaler
    if _model is None:
        _model, _scaler = load_model()
    return _model, _scaler
