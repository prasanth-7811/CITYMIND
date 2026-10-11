from typing import List
from ..models.models import Road, CitizenReport

WEATHER_WEIGHTS = {
    "clear": 0.0, "cloudy": 0.05, "light_rain": 0.15,
    "heavy_rain": 0.35, "fog": 0.25, "snow": 0.45
}

TRAFFIC_WEIGHTS = {
    "light": 0.1, "normal": 0.3, "heavy": 0.6, "gridlock": 0.9
}

def calculate_utilization_score(roads: List[Road], affected_road_id: str = None) -> float:
    if not roads:
        return 0.0
    total_util = sum(r.traffic_volume / max(r.capacity, 1) for r in roads)
    avg_util = total_util / len(roads)
    if affected_road_id:
        closed = next((r for r in roads if r.id == affected_road_id), None)
        if closed:
            closed_util = closed.traffic_volume / max(closed.capacity, 1)
            avg_util = min(avg_util + closed_util * 0.4, 1.0)
    return min(avg_util, 1.0)

def calculate_event_score(event_size: int, scenario_type: str) -> float:
    if scenario_type == "large_event":
        return min(event_size / 30000, 1.0)
    if event_size > 0:
        return min(event_size / 50000, 0.5)
    return 0.0

def calculate_weather_score(weather: str) -> float:
    return WEATHER_WEIGHTS.get(weather, 0.0)

def calculate_closure_score(scenario_type: str, road: Road = None) -> float:
    if scenario_type == "road_closure":
        if road:
            return min(road.traffic_volume / max(road.capacity, 1) * 0.8, 1.0)
        return 0.5
    if scenario_type == "road_maintenance":
        return 0.3
    return 0.0

def calculate_report_score(reports: List[CitizenReport]) -> float:
    if not reports:
        return 0.0
    high_severity = sum(1 for r in reports if r.severity >= 4)
    return min((len(reports) * 0.05 + high_severity * 0.1), 1.0)

def calculate_risk_score(
    roads: List[Road],
    reports: List[CitizenReport],
    scenario_type: str,
    weather: str,
    event_size: int,
    traffic_condition: str,
    affected_road_id: str = None
) -> dict:
    util_score = calculate_utilization_score(roads, affected_road_id)
    event_score = calculate_event_score(event_size, scenario_type)
    weather_score = calculate_weather_score(weather)
    closure_score = calculate_closure_score(scenario_type, next((r for r in roads if r.id == affected_road_id), None))
    report_score = calculate_report_score(reports)
    traffic_mult = TRAFFIC_WEIGHTS.get(traffic_condition, 0.3)

    raw = (
        0.35 * util_score +
        0.25 * event_score +
        0.15 * weather_score +
        0.15 * closure_score +
        0.10 * report_score
    )
    risk = min(raw * (1 + traffic_mult * 0.3) * 100, 100)

    factors = [
        {"factor": "Road Utilization",    "impact": round(util_score * 35 * (1 + traffic_mult * 0.3), 1)},
        {"factor": "Event Demand",         "impact": round(event_score * 25, 1)},
        {"factor": "Weather Conditions",   "impact": round(weather_score * 15, 1)},
        {"factor": "Road Closure Impact",  "impact": round(closure_score * 15, 1)},
        {"factor": "Citizen Reports",      "impact": round(report_score * 10, 1)},
    ]
    factors = [f for f in factors if f["impact"] > 0]
    factors.sort(key=lambda x: x["impact"], reverse=True)

    return {"risk_score": round(risk, 1), "factors": factors}
