from typing import List, Dict

def generate_recommendations(
    risk_score: float,
    predicted_congestion: float,
    baseline_congestion: float,
    emergency_impact: str,
    scenario_type: str,
    context: dict,
    affected_roads: List[Dict]
) -> List[str]:
    recs = []
    congestion_increase = predicted_congestion - baseline_congestion
    travel_time_increase_pct = congestion_increase / max(baseline_congestion, 1) * 100

    if predicted_congestion > 75:
        recs.append("Redirect traffic through Route D (estimated 20% congestion reduction)")
    if predicted_congestion > 60 and scenario_type in ("road_closure", "road_maintenance"):
        recs.append("Activate dynamic traffic signals on alternate routes")
    if context.get("large_event") or context.get("event_nearby"):
        recs.append("Add temporary bus service from Central Station to Stadium")
    if emergency_impact == "HIGH":
        recs.append("Preserve hospital emergency corridor — restrict non-emergency vehicles on Hospital Road")
    if travel_time_increase_pct > 25:
        recs.append("Notify citizens via app to depart 20 minutes earlier")
    if context.get("weather_impact"):
        recs.append("Reduce speed limits by 20 km/h on affected roads due to weather conditions")
    if context.get("peak_hour"):
        recs.append("Deploy traffic officers at Central Station and North Junction intersections")
    if len(affected_roads) > 3:
        recs.append("Coordinate with public transport to increase bus frequency on high-demand corridors")
    if risk_score > 80:
        recs.append("Issue public advisory: avoid city center between 17:00–20:00")
    if not recs:
        recs.append("Monitor situation — current conditions are manageable")
    return recs

def apply_recommendation_impact(predicted: dict, recommendations: List[str], risk_score: float) -> dict:
    improved = dict(predicted)
    reduction_factor = 0.0
    if any("Route D" in r for r in recommendations):
        reduction_factor += 0.12
    if any("dynamic traffic" in r for r in recommendations):
        reduction_factor += 0.06
    if any("bus service" in r for r in recommendations):
        reduction_factor += 0.05
    if any("emergency corridor" in r for r in recommendations):
        reduction_factor += 0.04
    if any("depart" in r for r in recommendations):
        reduction_factor += 0.05
    if any("speed limits" in r for r in recommendations):
        reduction_factor += 0.03

    reduction_factor = min(reduction_factor, 0.30)
    improved["congestion"] = round(predicted["congestion"] * (1 - reduction_factor), 1)
    improved["avg_speed"] = round(predicted["avg_speed"] * (1 + reduction_factor * 0.8), 1)
    improved["travel_time"] = round(predicted["travel_time"] * (1 - reduction_factor * 0.7), 1)
    improved["bus_delay"] = round(predicted["bus_delay"] * (1 - reduction_factor * 0.6), 1)
    improved["emergency_accessibility"] = round(min(predicted["emergency_accessibility"] * (1 + reduction_factor), 100), 1)
    improved["citizens_affected"] = int(predicted["citizens_affected"] * (1 - reduction_factor * 0.5))
    return improved
