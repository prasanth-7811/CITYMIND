from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON
from sqlalchemy.sql import func
from backend.database.db import Base

class Road(Base):
    __tablename__ = "roads"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    source_node = Column(String, nullable=False)
    dest_node = Column(String, nullable=False)
    capacity = Column(Integer, default=1000)
    traffic_volume = Column(Integer, default=0)
    avg_speed = Column(Float, default=50.0)
    length = Column(Float, default=1.0)
    status = Column(String, default="open")
    lat1 = Column(Float)
    lon1 = Column(Float)
    lat2 = Column(Float)
    lon2 = Column(Float)

class Node(Base):
    __tablename__ = "nodes"
    id = Column(String, primary_key=True)
    name = Column(String)
    node_type = Column(String, default="intersection")
    lat = Column(Float)
    lon = Column(Float)
    population = Column(Integer, default=0)

class Zone(Base):
    __tablename__ = "zones"
    id = Column(String, primary_key=True)
    name = Column(String)
    zone_type = Column(String)
    lat = Column(Float)
    lon = Column(Float)
    population = Column(Integer, default=0)

class CitizenReport(Base):
    __tablename__ = "citizen_reports"
    id = Column(Integer, primary_key=True, autoincrement=True)
    category = Column(String)
    location = Column(String)
    lat = Column(Float)
    lon = Column(Float)
    severity = Column(Integer, default=1)
    description = Column(Text)
    status = Column(String, default="open")
    confidence = Column(Float, default=0.5)
    created_at = Column(DateTime, server_default=func.now())

class Event(Base):
    __tablename__ = "events"
    id = Column(String, primary_key=True)
    name = Column(String)
    event_type = Column(String)
    location = Column(String)
    lat = Column(Float)
    lon = Column(Float)
    size = Column(Integer, default=0)
    start_time = Column(String)
    end_time = Column(String)
    active = Column(Boolean, default=True)

class Simulation(Base):
    __tablename__ = "simulations"
    id = Column(Integer, primary_key=True, autoincrement=True)
    scenario_type = Column(String)
    road_id = Column(String)
    start_time = Column(String)
    duration = Column(Float)
    weather = Column(String)
    event_size = Column(Integer, default=0)
    traffic_condition = Column(String, default="normal")
    created_at = Column(DateTime, server_default=func.now())

class SimulationResult(Base):
    __tablename__ = "simulation_results"
    id = Column(Integer, primary_key=True, autoincrement=True)
    simulation_id = Column(Integer)
    result_json = Column(JSON)
    created_at = Column(DateTime, server_default=func.now())

class Recommendation(Base):
    __tablename__ = "recommendations"
    id = Column(Integer, primary_key=True, autoincrement=True)
    simulation_id = Column(Integer)
    text = Column(String)
    action_type = Column(String)
    applied = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
