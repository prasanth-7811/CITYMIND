from pydantic import BaseModel, field_validator
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

    @field_validator("scenario_type")
    @classmethod
    def validate_scenario(cls, v):
        valid = {"road_closure", "add_bus_route", "large_event", "road_maintenance"}
        if v not in valid:
            raise ValueError(f"scenario_type must be one of {valid}")
        return v

    @field_validator("weather")
    @classmethod
    def validate_weather(cls, v):
        valid = {"clear", "cloudy", "light_rain", "heavy_rain", "fog", "snow"}
        if v not in valid:
            raise ValueError(f"weather must be one of {valid}")
        return v

    @field_validator("traffic_condition")
    @classmethod
    def validate_traffic(cls, v):
        valid = {"light", "normal", "heavy", "gridlock"}
        if v not in valid:
            raise ValueError(f"traffic_condition must be one of {valid}")
        return v

class ReportCreate(BaseModel):
    category: str
    location: str
    lat: Optional[float] = None
    lon: Optional[float] = None
    severity: int = 1
    description: str

    @field_validator("severity")
    @classmethod
    def validate_severity(cls, v):
        if not 1 <= v <= 5:
            raise ValueError("severity must be between 1 and 5")
        return v

    @field_validator("category")
    @classmethod
    def validate_category(cls, v):
        valid = {"Traffic", "Pothole", "Garbage", "Water", "Streetlight", "Bus Issue"}
        if v not in valid:
            raise ValueError(f"category must be one of {valid}")
        return v

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
