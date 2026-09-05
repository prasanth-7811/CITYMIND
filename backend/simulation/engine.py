from sqlalchemy.orm import Session
from typing import List
from backend.models.models import Road, Node, CitizenReport, Event, Simulation, SimulationResult, Recommendation
from backend.simulation.graph_engine import CityGraph
from backend.ai.risk_engine import calculate_risk_score
from backend.ai.ambient_engine import get_ambient_context
from backend.ai.recommendation_engine import generate_recommendations, apply_recommendation_impact
from backend.schemas.schemas import SimulateRequest

WEATHER_SPEED_FACTOR = {
    "clear": 1.0, "cloudy": 0.97, "light_rain": 0.88,
    "heavy_rain": 0.72, "fog": 0.78, "snow": 0.60
}

def run_simulation(req: SimulateRequest, db: Session) -> dict:
    roads = db.query(Road).all()
    nodes = db.query(Node).all()
    reports = db.query(CitizenReport).all()
    events = db.query(Event).all()

    # Build graph
    graph = CityGraph()
    graph.build(roads, nodes)

    # Baseline metrics
    baseline_congestion = _calc_congestion(roads)
    baseline_speed = _calc_avg_speed(roads)
    baseline_travel = _calc_travel_time(roads, baseline_speed)
    baseline_bus_delay = _calc_bus_delay(baseline_congestion)
    baseline_emergency = _calc_emergency_access(roads, None)
    baseline_affected = _calc_affected_population(nodes, [])

    baseline = {
        "congestion": round(baseline_congestion, 1),
        "avg_speed": round(baseline_speed, 1),
        "travel_time": round(baseline_travel, 1),
        "bus_delay": round(baseline_bus_delay, 1),
        "emergency_accessibility": round(baseline_emergency, 1),
        "citizens_affected": baseline_affected
    }

    # Apply scenario to graph
    affected_road_increases = {}
    closed_road = None
    if req.scenario_type in ("road_closure", "road_maintenance") and req.road_id:
        closed_road = next((r for r in roads if r.id == req.road_id), None)
        if closed_road:
            graph.close_road(req.road_id)
            affected_road_increases = graph.redistribute_traffic(req.road_id, roads)

    # Risk calculation
    risk_result = calculate_risk_score(
        roads, reports, req.scenario_type, req.weather,
        req.event_size, req.traffic_condition, req.road_id
    )

    # Ambient context
    context = get_ambient_context(req.weather, req.traffic_condition, events, reports, req.start_time)

    # Predicted metrics
    weather_factor = WEATHER_SPEED_FACTOR.get(req.weather, 1.0)
    risk_ratio = risk_result["risk_score"] / 100

    pred_congestion = min(baseline_congestion + risk_ratio * 45 + (req.event_size / 30000 * 20), 98)
    pred_speed = max(baseline_speed * weather_factor * (1 - risk_ratio * 0.55), 8)
    pred_travel = baseline_travel * (baseline_speed / max(pred_speed, 1))
    pred_bus_delay = baseline_bus_delay + risk_ratio * 15 + (req.event_size / 10000 * 3)
    pred_emergency = max(baseline_emergency - risk_ratio * 40, 20)
    pred_affected = int(baseline_affected * (1 + risk_ratio * 1.2))

    predicted = {
        "congestion": round(pred_congestion, 1),
        "avg_speed": round(pred_speed, 1),
        "travel_time": round(pred_travel, 1),
        "bus_delay": round(pred_bus_delay, 1),
        "emergency_accessibility": round(pred_emergency, 1),
        "citizens_affected": pred_affected
    }

    # Emergency impact
    emergency_impact = "LOW"
    if pred_emergency < 50:
        emergency_impact = "HIGH"
    elif pred_emergency < 70:
        emergency_impact = "MEDIUM"

    # Affected roads list
    affected_roads_list = [
        {"road": next((r.name for r in roads if r.id == rid), rid),
         "traffic_increase": round(inc, 1)}
        for rid, inc in sorted(affected_road_increases.items(), key=lambda x: -x[1])[:5]
    ]

    # Citizens affected
    citizens_affected = pred_affected

    # Recommendations
    recs = generate_recommendations(
        risk_result["risk_score"], pred_congestion, baseline_congestion,
        emergency_impact, req.scenario_type, context, affected_roads_list
    )

    # Recommended metrics (after applying interventions)
    recommended = apply_recommendation_impact(predicted, recs, risk_result["risk_score"])

    # Save simulation
    sim = Simulation(
        scenario_type=req.scenario_type,
        road_id=req.road_id,
        start_time=req.start_time,
        duration=req.duration,
        weather=req.weather,
        event_size=req.event_size,
        traffic_condition=req.traffic_condition
    )
    db.add(sim)
    db.flush()

    result_data = {
        "scenario": _scenario_label(req.scenario_type),
        "road": closed_road.name if closed_road else req.scenario_type.replace("_", " ").title(),
        "risk_score": risk_result["risk_score"],
        "baseline": baseline,
        "predicted": predicted,
        "recommended": recommended,
        "affected_roads": affected_roads_list,
        "emergency_impact": emergency_impact,
        "citizens_affected": citizens_affected,
        "explanation": risk_result["factors"],
        "recommendations": recs,
        "context": context
    }

    db.add(SimulationResult(simulation_id=sim.id, result_json=result_data))
    for rec_text in recs:
        db.add(Recommendation(simulation_id=sim.id, text=rec_text, action_type="auto"))
    db.commit()

    return {"simulation_id": sim.id, **result_data}

def _scenario_label(s: str) -> str:
    return {"road_closure": "Road Closure", "add_bus_route": "Add Bus Route",
            "large_event": "Large Event", "road_maintenance": "Road Maintenance"}.get(s, s.title())

def _calc_congestion(roads: List[Road]) -> float:
    if not roads:
        return 0
    return sum(r.traffic_volume / max(r.capacity, 1) for r in roads) / len(roads) * 100

def _calc_avg_speed(roads: List[Road]) -> float:
    if not roads:
        return 50
    return sum(r.avg_speed for r in roads) / len(roads)

def _calc_travel_time(roads: List[Road], avg_speed: float) -> float:
    total_length = sum(r.length for r in roads)
    return (total_length / max(avg_speed, 1)) * 60

def _calc_bus_delay(congestion: float) -> float:
    return max(0, (congestion - 30) / 10)

def _calc_emergency_access(roads: List[Road], closed_road_id) -> float:
    hospital_roads = ["R5", "R11", "R12"]
    open_hospital_roads = [r for r in roads if r.id in hospital_roads and r.status == "open"]
    if closed_road_id in hospital_roads:
        open_hospital_roads = [r for r in open_hospital_roads if r.id != closed_road_id]
    return (len(open_hospital_roads) / len(hospital_roads)) * 100

def _calc_affected_population(nodes, closed_road_ids) -> int:
    return sum(n.population for n in nodes)
