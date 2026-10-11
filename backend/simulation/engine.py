from sqlalchemy.orm import Session
from typing import List
from models.models import Road, Node, CitizenReport, Event, Simulation, SimulationResult, Recommendation
from simulation.graph_engine import CityGraph
from ai.risk_engine import calculate_risk_score
from ai.ambient_engine import get_ambient_context
from ai.recommendation_engine import generate_recommendations, apply_recommendation_impact
from ai.ml_predictor import predict_congestion
from schemas.schemas import SimulateRequest

WEATHER_SPEED_FACTOR = {
    "clear": 1.0, "cloudy": 0.97, "light_rain": 0.88,
    "heavy_rain": 0.72, "fog": 0.78, "snow": 0.60
}

def run_simulation(req: SimulateRequest, db: Session) -> dict:
    roads = db.query(Road).all()
    nodes = db.query(Node).all()
    reports = db.query(CitizenReport).all()
    events = db.query(Event).all()

    # ── 1. Build Digital Twin Graph ──────────────────────────────────────────
    graph = CityGraph()
    graph.build(roads, nodes)

    # ── 2. Baseline metrics (pre-scenario) ───────────────────────────────────
    baseline_emergency = graph.get_emergency_accessibility()
    baseline_net = graph.get_network_stats()
    baseline_congestion = baseline_net["avg_utilization"]
    baseline_speed = _calc_avg_speed(roads)
    baseline_travel = _calc_travel_time(roads, baseline_speed)
    baseline_bus_delay = _calc_bus_delay(baseline_congestion)
    baseline_affected = sum(n.population for n in nodes)

    baseline = {
        "congestion": round(baseline_congestion, 1),
        "avg_speed": round(baseline_speed, 1),
        "travel_time": round(baseline_travel, 1),
        "bus_delay": round(baseline_bus_delay, 1),
        "emergency_accessibility": baseline_emergency["score"],
        "citizens_affected": baseline_affected
    }

    # ── 3. Apply scenario to graph ───────────────────────────────────────────
    affected_road_increases: dict = {}
    closed_road = None
    scenario_label = _scenario_label(req.scenario_type)

    if req.scenario_type in ("road_closure", "road_maintenance") and req.road_id:
        closed_road = next((r for r in roads if r.id == req.road_id), None)
        if closed_road:
            graph.close_road(req.road_id)
            affected_road_increases = graph.redistribute_traffic(req.road_id, roads)

    elif req.scenario_type == "large_event":
        # Simulate event by increasing utilization on roads near event zone
        for road in roads:
            if road.id in ("R1", "R8", "R11", "R12"):  # roads near Codissia/Peelamedu
                affected_road_increases[road.id] = min(req.event_size / 500, 60.0)

    elif req.scenario_type == "add_bus_route":
        # Bus route reduces private vehicle load on main corridors
        for road in roads:
            if road.id in ("R1", "R5", "R15"):
                affected_road_increases[road.id] = -min(req.event_size / 2000, 15.0)

    # ── 4. Post-scenario graph stats ─────────────────────────────────────────
    post_emergency = graph.get_emergency_accessibility()
    post_net = graph.get_network_stats()

    # ── 5. Rule-based risk score ─────────────────────────────────────────────
    risk_result = calculate_risk_score(
        roads, reports, req.scenario_type, req.weather,
        req.event_size, req.traffic_condition, req.road_id
    )

    # ── 6. ML prediction ─────────────────────────────────────────────────────
    ml_result = predict_congestion(
        roads, reports, req.scenario_type, req.weather,
        req.event_size, req.traffic_condition,
        req.road_id or "", req.start_time,
        len(affected_road_increases)
    )

    # ── 7. Ambient context ───────────────────────────────────────────────────
    context = get_ambient_context(req.weather, req.traffic_condition, events, reports, req.start_time)
    context.update({
        "ml_model": ml_result["model_type"],
        "ml_congestion": ml_result["ml_congestion"],
        "network_connected": post_net["is_connected"],
        "congested_roads_count": post_net["congested_roads"],
        "emergency_accessible_nodes": post_emergency["accessible_nodes"],
        "emergency_blocked_nodes": post_emergency["blocked_nodes"],
    })

    # ── 8. Blended prediction (60% ML + 40% rule) ────────────────────────────
    weather_factor = WEATHER_SPEED_FACTOR.get(req.weather, 1.0)
    risk_ratio = risk_result["risk_score"] / 100
    rule_congestion = min(baseline_congestion + risk_ratio * 45 + (req.event_size / 30000 * 20), 98)
    pred_congestion = round(0.6 * ml_result["ml_congestion"] + 0.4 * rule_congestion, 1)
    pred_speed = round(max(baseline_speed * weather_factor * (1 - risk_ratio * 0.55), 8), 1)
    pred_travel = round(baseline_travel * (baseline_speed / max(pred_speed, 1)), 1)
    pred_bus_delay = round(baseline_bus_delay + risk_ratio * 15 + (req.event_size / 10000 * 3), 1)
    pred_emergency = round(post_emergency["score"] * (1 - risk_ratio * 0.35), 1)
    pred_affected = int(baseline_affected * (1 + risk_ratio * 1.2))

    predicted = {
        "congestion": pred_congestion,
        "avg_speed": pred_speed,
        "travel_time": pred_travel,
        "bus_delay": pred_bus_delay,
        "emergency_accessibility": max(pred_emergency, 20.0),
        "citizens_affected": pred_affected
    }

    # ── 9. Emergency impact classification ───────────────────────────────────
    emergency_impact = "LOW"
    if predicted["emergency_accessibility"] < 50:
        emergency_impact = "HIGH"
    elif predicted["emergency_accessibility"] < 70:
        emergency_impact = "MEDIUM"

    # ── 10. Affected roads list ───────────────────────────────────────────────
    affected_roads_list = [
        {
            "road": next((r.name for r in roads if r.id == rid), rid),
            "road_id": rid,
            "traffic_increase": round(inc, 1),
            "severity": "high" if inc > 40 else "medium" if inc > 20 else "low"
        }
        for rid, inc in sorted(affected_road_increases.items(), key=lambda x: -abs(x[1]))[:6]
        if inc > 0
    ]

    # ── 11. Recommendations ───────────────────────────────────────────────────
    recs = generate_recommendations(
        risk_result["risk_score"], pred_congestion, baseline_congestion,
        emergency_impact, req.scenario_type, context, affected_roads_list
    )

    # ── 12. Post-recommendation metrics ──────────────────────────────────────
    recommended = apply_recommendation_impact(predicted, recs, risk_result["risk_score"])

    # ── 13. Explanation — ML factors with plain-language summary ─────────────
    explanation = ml_result["ml_factors"] if ml_result["ml_factors"] else risk_result["factors"]
    explanation_summary = _build_explanation_summary(explanation, pred_congestion, context)

    # ── 14. Persist to DB ────────────────────────────────────────────────────
    sim = Simulation(
        scenario_type=req.scenario_type, road_id=req.road_id,
        start_time=req.start_time, duration=req.duration,
        weather=req.weather, event_size=req.event_size,
        traffic_condition=req.traffic_condition
    )
    db.add(sim)
    db.flush()

    result_data = {
        "simulation_id": sim.id,
        "scenario": scenario_label,
        "road": closed_road.name if closed_road else req.scenario_type.replace("_", " ").title(),
        "risk_score": risk_result["risk_score"],
        "ml_congestion": ml_result["ml_congestion"],
        "prediction_method": "60% RandomForest + 40% Rule-Based",
        "baseline": baseline,
        "predicted": predicted,
        "recommended": recommended,
        "affected_roads": affected_roads_list,
        "emergency_impact": emergency_impact,
        "emergency_detail": {
            "before": baseline_emergency,
            "after": post_emergency,
        },
        "citizens_affected": pred_affected,
        "explanation": explanation,
        "explanation_summary": explanation_summary,
        "recommendations": recs,
        "context": context,
        "network_stats": {
            "baseline": baseline_net,
            "post_scenario": post_net
        }
    }

    db.add(SimulationResult(simulation_id=sim.id, result_json=result_data))
    for rec_text in recs:
        db.add(Recommendation(simulation_id=sim.id, text=rec_text, action_type="auto"))
    db.commit()

    return result_data

def _build_explanation_summary(factors: list, congestion: float, context: dict) -> str:
    if not factors:
        return "Congestion is driven by current traffic conditions."
    top = factors[0]["factor"]
    parts = [f"{top} is the largest contributor to the predicted {congestion}% congestion."]
    if context.get("peak_hour"):
        parts.append("Peak hour traffic amplifies the impact.")
    if context.get("weather_impact"):
        parts.append(f"Weather ({context.get('weather', '')}) reduces road capacity.")
    if context.get("large_event"):
        parts.append("An active large event is generating additional demand.")
    return " ".join(parts)

def _scenario_label(s: str) -> str:
    return {
        "road_closure": "Road Closure",
        "add_bus_route": "Add Bus Route",
        "large_event": "Large Event",
        "road_maintenance": "Road Maintenance"
    }.get(s, s.replace("_", " ").title())

def _calc_avg_speed(roads: List[Road]) -> float:
    return sum(r.avg_speed for r in roads) / len(roads) if roads else 50.0

def _calc_travel_time(roads: List[Road], avg_speed: float) -> float:
    return (sum(r.length for r in roads) / max(avg_speed, 1)) * 60

def _calc_bus_delay(congestion: float) -> float:
    return max(0.0, (congestion - 30) / 10)
