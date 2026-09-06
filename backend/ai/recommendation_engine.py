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
    congestion_delta = predicted_congestion - baseline_congestion
    travel_increase_pct = congestion_delta / max(baseline_congestion, 1) * 100

    # Traffic diversion
    if predicted_congestion > 75:
        recs.append("Redirect traffic via Trichy Road and DB Road to bypass congestion")
    if predicted_congestion > 60 and scenario_type in ("road_closure", "road_maintenance"):
        recs.append("Activate dynamic traffic signals on Avinashi Road alternate corridors")

    # Public transport
    if context.get("large_event") or context.get("event_nearby"):
        recs.append("Deploy additional TNSTC buses from Gandhipuram Bus Stand to Codissia Trade Fair")
    if scenario_type == "add_bus_route" or predicted_congestion > 65:
        recs.append("Increase bus frequency on Gandhipuram–Peelamedu–Singanallur corridor")

    # Emergency
    if emergency_impact == "HIGH":
        recs.append("Preserve GKNM Hospital emergency corridor — restrict non-emergency vehicles on Hospital Road")
    if emergency_impact in ("HIGH", "MEDIUM"):
        recs.append("Alert Coimbatore City Police to deploy officers at Gandhipuram and RS Puram junctions")

    # Citizen notification
    if travel_increase_pct > 25:
        recs.append("Push citizen notification via CityMind app: depart 20 minutes earlier to avoid delays")
    if context.get("weather_impact"):
        recs.append(f"Reduce speed limits by 20 km/h on all arterials due to {context.get('weather', 'adverse')} weather")

    # Peak hour
    if context.get("peak_hour"):
        recs.append("Deploy traffic wardens at Coimbatore Junction, Town Hall, and Peelamedu intersections")

    # High load on alternate roads
    high_load = [r for r in affected_roads if r.get("traffic_increase", 0) > 35]
    if len(high_load) >= 2:
        recs.append("Coordinate with TNSTC to increase bus frequency on overloaded alternate corridors")

    # Severity-based advisory
    if risk_score > 80:
        recs.append("Issue public advisory: avoid Avinashi Road and city centre between 17:00–20:00")

    if not recs:
        recs.append("Current conditions are manageable — continue monitoring via CityMind dashboard")

    return recs

def apply_recommendation_impact(predicted: dict, recommendations: List[str], risk_score: float) -> dict:
    improved = dict(predicted)
    reduction = 0.0

    if any("Redirect" in r or "bypass" in r for r in recommendations):
        reduction += 0.12
    if any("dynamic traffic signals" in r for r in recommendations):
        reduction += 0.06
    if any("buses" in r.lower() or "bus" in r.lower() for r in recommendations):
        reduction += 0.05
    if any("Hospital" in r or "emergency corridor" in r for r in recommendations):
        reduction += 0.04
    if any("depart" in r or "notification" in r for r in recommendations):
        reduction += 0.05
    if any("speed limits" in r for r in recommendations):
        reduction += 0.03
    if any("wardens" in r or "officers" in r or "Police" in r for r in recommendations):
        reduction += 0.04

    reduction = min(reduction, 0.32)

    improved["congestion"] = round(predicted["congestion"] * (1 - reduction), 1)
    improved["avg_speed"] = round(predicted["avg_speed"] * (1 + reduction * 0.8), 1)
    improved["travel_time"] = round(predicted["travel_time"] * (1 - reduction * 0.7), 1)
    improved["bus_delay"] = round(predicted["bus_delay"] * (1 - reduction * 0.65), 1)
    improved["emergency_accessibility"] = round(
        min(predicted["emergency_accessibility"] * (1 + reduction * 1.1), 100), 1
    )
    improved["citizens_affected"] = int(predicted["citizens_affected"] * (1 - reduction * 0.5))
    return improved
