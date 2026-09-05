from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

class SimulateRequest(BaseModel):
    scenario_type: str
    road_id: Optional[str] = None
    start_time: str = "08:00"
    duration: float = 2.0
    weather: str = "clear"
    event_size: int = 0
    traffic_condition: str = "normal"
    apply_recommendation: bool = False
    recommendation_action: Optional[str] = None

class ReportCreate(BaseModel):
    category: str
    location: str
    lat: Optional[float] = None
    lon: Optional[float] = None
    severity: int = 1
    description: str

class ReportOut(BaseModel):
    id: int
    category: str
    location: str
    lat: Optional[float]
    lon: Optional[float]
    severity: int
    description: str
    status: str
    confidence: float
    created_at: Optional[datetime]

    class Config:
        from_attributes = True

class Factor(BaseModel):
    factor: str
    impact: float

class AffectedRoad(BaseModel):
    road: str
    traffic_increase: float

class BaselineMetrics(BaseModel):
    congestion: float
    avg_speed: float
    travel_time: float
    bus_delay: float
    emergency_accessibility: float
    citizens_affected: int

class SimulationResponse(BaseModel):
    simulation_id: int
    scenario: str
    road: str
    risk_score: float
    baseline: BaselineMetrics
    predicted: BaselineMetrics
    recommended: Optional[BaselineMetrics]
    affected_roads: List[AffectedRoad]
    emergency_impact: str
    citizens_affected: int
    explanation: List[Factor]
    recommendations: List[str]
    context: dict
