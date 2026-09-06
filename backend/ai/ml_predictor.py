import numpy as np
from typing import List
from backend.models.models import Road, CitizenReport
from backend.ai.ml_model import get_model, FEATURE_NAMES

WEATHER_IMPACT_MAP = {
    "clear": 0.0, "cloudy": 0.05, "light_rain": 0.15,
    "heavy_rain": 0.35, "fog": 0.25, "snow": 0.45
}
TRAFFIC_SCORE_MAP = {
    "light": 0.1, "normal": 0.3, "heavy": 0.6, "gridlock": 0.9
}

def build_features(
    roads: List[Road],
    reports: List[CitizenReport],
    scenario_type: str,
    weather: str,
    event_size: int,
    traffic_condition: str,
    affected_road_id: str,
    start_time: str,
    num_affected_roads: int
) -> np.ndarray:
    utilizations = [r.traffic_volume / max(r.capacity, 1) for r in roads]
    avg_util = float(np.mean(utilizations)) if utilizations else 0.0
    max_util = float(np.max(utilizations)) if utilizations else 0.0

    closed_road = next((r for r in roads if r.id == affected_road_id), None)
    closed_util = (closed_road.traffic_volume / max(closed_road.capacity, 1)) if closed_road else 0.0

    event_size_norm = min(event_size / 30000, 1.0)
    weather_impact = WEATHER_IMPACT_MAP.get(weather, 0.0)
    traffic_score = TRAFFIC_SCORE_MAP.get(traffic_condition, 0.3)

    try:
        hour = int(start_time.split(":")[0])
    except Exception:
        from datetime import datetime
        hour = datetime.now().hour

    is_peak = 1 if (7 <= hour <= 9 or 17 <= hour <= 19) else 0
    is_weekend = 0  # can be extended

    num_reports = len(reports)
    avg_severity = float(np.mean([r.severity for r in reports])) if reports else 1.0
    capacity_ratio = float(np.mean([r.capacity for r in roads])) / 1000 if roads else 1.0

    features = np.array([[
        avg_util,
        max_util,
        closed_util,
        event_size_norm,
        weather_impact,
        traffic_score,
        hour / 23.0,        # normalize hour
        is_peak,
        is_weekend,
        min(num_reports / 20, 1.0),
        avg_severity / 5.0,
        min(num_affected_roads / 10, 1.0),
        min(capacity_ratio, 2.0),
    ]])
    return features

def predict_congestion(
    roads: List[Road],
    reports: List[CitizenReport],
    scenario_type: str,
    weather: str,
    event_size: int,
    traffic_condition: str,
    affected_road_id: str,
    start_time: str,
    num_affected_roads: int = 0
) -> dict:
    model, scaler = get_model()

    features = build_features(
        roads, reports, scenario_type, weather,
        event_size, traffic_condition, affected_road_id,
        start_time, num_affected_roads
    )

    features_scaled = scaler.transform(features)
    predicted_congestion = float(np.clip(model.predict(features_scaled)[0], 5, 98))

    # Feature importances from Random Forest
    importances = model.feature_importances_
    feature_impacts = []
    for name, importance, raw_val in zip(FEATURE_NAMES, importances, features[0]):
        impact = round(importance * predicted_congestion * raw_val, 2)
        if impact > 0.5:
            feature_impacts.append({
                "factor": _feature_label(name),
                "impact": round(impact, 1),
                "importance": round(float(importance), 4)
            })

    feature_impacts.sort(key=lambda x: x["impact"], reverse=True)
    top_factors = feature_impacts[:5]

    return {
        "ml_congestion": round(predicted_congestion, 1),
        "ml_factors": top_factors,
        "model_type": "RandomForest",
        "feature_importances": {
            FEATURE_NAMES[i]: round(float(importances[i]), 4)
            for i in range(len(FEATURE_NAMES))
        }
    }

def _feature_label(name: str) -> str:
    labels = {
        "avg_utilization":          "Road Utilization",
        "max_utilization":          "Peak Road Load",
        "closed_road_utilization":  "Closed Road Impact",
        "event_size_norm":          "Event Demand",
        "weather_impact":           "Weather Conditions",
        "traffic_condition_score":  "Traffic Density",
        "hour_of_day":              "Time of Day",
        "is_peak_hour":             "Peak Hour Effect",
        "is_weekend":               "Weekend Pattern",
        "num_reports":              "Citizen Reports",
        "avg_report_severity":      "Report Severity",
        "num_affected_roads":       "Affected Road Count",
        "road_capacity_ratio":      "Network Capacity",
    }
    return labels.get(name, name.replace("_", " ").title())
