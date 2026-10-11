from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database.db import get_db
from ..models.models import Road, Node, Zone, CitizenReport, Event, Simulation, SimulationResult, Recommendation
from ..schemas.schemas import SimulateRequest, ReportCreate, ReportOut
from ..services.city_service import get_dashboard_data, get_city_map_data
from ..simulation.engine import run_simulation
from ..ai.collective_intelligence import calculate_confidence

router = APIRouter()

@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db)):
    return get_dashboard_data(db)

@router.get("/city")
def city_map(db: Session = Depends(get_db)):
    return get_city_map_data(db)

@router.get("/roads")
def get_roads(db: Session = Depends(get_db)):
    roads = db.query(Road).all()
    return [{"id": r.id, "name": r.name, "status": r.status,
             "utilization": round(r.traffic_volume / max(r.capacity, 1), 2)} for r in roads]

@router.get("/events")
def get_events(db: Session = Depends(get_db)):
    return db.query(Event).all()

@router.get("/reports", response_model=List[ReportOut])
def get_reports(db: Session = Depends(get_db)):
    return db.query(CitizenReport).order_by(CitizenReport.created_at.desc()).all()

@router.post("/reports", response_model=ReportOut)
def create_report(report: ReportCreate, db: Session = Depends(get_db)):
    # Default coords if not provided
    lat = report.lat if report.lat else 51.505 + (hash(report.location) % 100) * 0.0002
    lon = report.lon if report.lon else -0.090 + (hash(report.location) % 100) * 0.0002
    db_report = CitizenReport(
        category=report.category,
        location=report.location,
        lat=lat, lon=lon,
        severity=report.severity,
        description=report.description,
        confidence=0.5
    )
    db.add(db_report)
    db.flush()
    # Recalculate confidence for this location
    same_loc = db.query(CitizenReport).filter(
        CitizenReport.location.ilike(f"%{report.location}%")
    ).all()
    db_report.confidence = calculate_confidence(same_loc)
    db.commit()
    db.refresh(db_report)
    return db_report

@router.post("/simulate")
def simulate(req: SimulateRequest, db: Session = Depends(get_db)):
    return run_simulation(req, db)

@router.get("/simulations/{sim_id}")
def get_simulation(sim_id: int, db: Session = Depends(get_db)):
    result = db.query(SimulationResult).filter(SimulationResult.simulation_id == sim_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return result.result_json

@router.get("/recommendations/{simulation_id}")
def get_recommendations(simulation_id: int, db: Session = Depends(get_db)):
    recs = db.query(Recommendation).filter(Recommendation.simulation_id == simulation_id).all()
    return [{"id": r.id, "text": r.text, "applied": r.applied} for r in recs]

@router.post("/apply-recommendation")
def apply_recommendation(body: dict, db: Session = Depends(get_db)):
    simulation_id = body.get("simulation_id")
    result = db.query(SimulationResult).filter(SimulationResult.simulation_id == simulation_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Simulation not found")
    data = result.result_json
    # Mark recommendations as applied
    db.query(Recommendation).filter(Recommendation.simulation_id == simulation_id).update({"applied": True})
    db.commit()
    return {
        **data,
        "applied": True,
        "final_metrics": data.get("recommended")
    }
