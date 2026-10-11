from sqlalchemy.orm import Session
from ..models.models import Road, Node, Zone, CitizenReport, Event
from ..ai.collective_intelligence import detect_hotspots

def get_dashboard_data(db: Session) -> dict:
    roads = db.query(Road).all()
    nodes = db.query(Node).all()
    reports = db.query(CitizenReport).all()
    events = db.query(Event).all()

    open_roads = [r for r in roads if r.status == "open"]
    active_events = [e for e in events if e.active]
    open_reports = [r for r in reports if r.status == "open"]

    avg_congestion = (
        sum(r.traffic_volume / max(r.capacity, 1) for r in open_roads) /
        max(len(open_roads), 1) * 100
    )
    avg_speed = sum(r.avg_speed for r in open_roads) / max(len(open_roads), 1)

    # Emergency route health — roads leading to GKNM Hospital
    hospital_roads = [r for r in roads if r.id in ("R6", "R16")]
    hospital_util = (
        sum(r.traffic_volume / max(r.capacity, 1) for r in hospital_roads) /
        max(len(hospital_roads), 1)
    ) if hospital_roads else 0
    emergency_health = round((1 - hospital_util) * 100, 1)

    # Congestion trend (last 5 roads by utilization)
    sorted_roads = sorted(open_roads, key=lambda r: r.traffic_volume / max(r.capacity, 1), reverse=True)
    top_congested = [
        {"name": r.name, "utilization": round(r.traffic_volume / max(r.capacity, 1) * 100, 1)}
        for r in sorted_roads[:5]
    ]

    return {
        "congestion_risk": round(avg_congestion, 1),
        "active_issues": len(open_reports),
        "citizen_reports": len(reports),
        "affected_population": sum(n.population for n in nodes),
        "emergency_route_risk": emergency_health,
        "active_events": len(active_events),
        "avg_speed": round(avg_speed, 1),
        "total_roads": len(roads),
        "open_roads": len(open_roads),
        "top_congested_roads": top_congested,
        "hotspots": detect_hotspots(reports),
        "data_source": "CityMind Digital Twin (Synthetic Demo Data)",
        "last_updated": __import__("datetime").datetime.now().isoformat()
    }

def get_city_map_data(db: Session) -> dict:
    roads = db.query(Road).all()
    nodes = db.query(Node).all()
    zones = db.query(Zone).all()
    reports = db.query(CitizenReport).all()
    events = db.query(Event).all()

    def congestion_level(r: Road) -> str:
        u = r.traffic_volume / max(r.capacity, 1)
        return "low" if u < 0.4 else "medium" if u < 0.7 else "high"

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
             "description": r.description, "confidence": r.confidence,
             "status": r.status}
            for r in reports if r.lat and r.lon
        ],
        "events": [
            {"id": e.id, "name": e.name, "type": e.event_type,
             "lat": e.lat, "lon": e.lon, "size": e.size, "active": e.active}
            for e in events
        ]
    }
