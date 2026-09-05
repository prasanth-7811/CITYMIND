from sqlalchemy.orm import Session
from backend.models.models import Road, Node, Zone, CitizenReport, Event
from backend.ai.collective_intelligence import detect_hotspots, calculate_confidence

def get_dashboard_data(db: Session) -> dict:
    roads = db.query(Road).all()
    nodes = db.query(Node).all()
    reports = db.query(CitizenReport).all()
    events = db.query(Event).all()

    total_pop = sum(n.population for n in nodes)
    active_issues = len([r for r in reports if r.status == "open"])
    active_events = [e for e in events if e.active]
    avg_congestion = sum(r.traffic_volume / max(r.capacity, 1) for r in roads) / max(len(roads), 1) * 100
    avg_speed = sum(r.avg_speed for r in roads) / max(len(roads), 1)
    hospital_roads = [r for r in roads if r.id in ("R5", "R11", "R12")]
    emergency_risk = 100 - (sum(r.traffic_volume / max(r.capacity, 1) for r in hospital_roads) / max(len(hospital_roads), 1) * 100)

    return {
        "congestion_risk": round(avg_congestion, 1),
        "active_issues": active_issues,
        "citizen_reports": len(reports),
        "affected_population": total_pop,
        "emergency_route_risk": round(emergency_risk, 1),
        "active_events": len(active_events),
        "avg_speed": round(avg_speed, 1),
        "total_roads": len(roads),
        "open_roads": len([r for r in roads if r.status == "open"]),
        "hotspots": detect_hotspots(reports)
    }

def get_city_map_data(db: Session) -> dict:
    roads = db.query(Road).all()
    nodes = db.query(Node).all()
    zones = db.query(Zone).all()
    reports = db.query(CitizenReport).all()
    events = db.query(Event).all()

    def congestion_level(r: Road) -> str:
        util = r.traffic_volume / max(r.capacity, 1)
        if util < 0.4:
            return "low"
        elif util < 0.7:
            return "medium"
        return "high"

    return {
        "roads": [
            {
                "id": r.id, "name": r.name,
                "source": r.source_node, "dest": r.dest_node,
                "capacity": r.capacity, "traffic_volume": r.traffic_volume,
                "avg_speed": r.avg_speed, "length": r.length,
                "status": r.status,
                "utilization": round(r.traffic_volume / max(r.capacity, 1), 2),
                "congestion_level": congestion_level(r),
                "coords": [[r.lat1, r.lon1], [r.lat2, r.lon2]]
            } for r in roads
        ],
        "nodes": [
            {"id": n.id, "name": n.name, "type": n.node_type,
             "lat": n.lat, "lon": n.lon, "population": n.population}
            for n in nodes
        ],
        "zones": [
            {"id": z.id, "name": z.name, "type": z.zone_type,
             "lat": z.lat, "lon": z.lon, "population": z.population}
            for z in zones
        ],
        "reports": [
            {"id": r.id, "category": r.category, "location": r.location,
             "lat": r.lat, "lon": r.lon, "severity": r.severity,
             "description": r.description, "confidence": r.confidence}
            for r in reports if r.lat and r.lon
        ],
        "events": [
            {"id": e.id, "name": e.name, "type": e.event_type,
             "lat": e.lat, "lon": e.lon, "size": e.size, "active": e.active}
            for e in events
        ]
    }
