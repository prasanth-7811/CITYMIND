from database.db import SessionLocal
from models.models import Road, Node, Zone, Event

# Real Coimbatore, Tamil Nadu coordinates
NODES = [
    {"id": "N1",  "name": "Coimbatore Junction (Railway)",  "node_type": "hub",          "lat": 11.0018, "lon": 76.9629, "population": 8000},
    {"id": "N2",  "name": "Gandhipuram Central Bus Stand",  "node_type": "hub",          "lat": 11.0168, "lon": 76.9558, "population": 6000},
    {"id": "N3",  "name": "RS Puram",                       "node_type": "intersection", "lat": 10.9905, "lon": 76.9558, "population": 5000},
    {"id": "N4",  "name": "Peelamedu",                      "node_type": "intersection", "lat": 11.0270, "lon": 77.0170, "population": 7000},
    {"id": "N5",  "name": "Ukkadam",                        "node_type": "intersection", "lat": 10.9880, "lon": 76.9750, "population": 4500},
    {"id": "N6",  "name": "GKNM Hospital",                  "node_type": "hospital",     "lat": 11.0100, "lon": 76.9650, "population": 1000},
    {"id": "N7",  "name": "Codissia Trade Fair Complex",    "node_type": "stadium",      "lat": 11.0310, "lon": 77.0050, "population": 500},
    {"id": "N8",  "name": "Coimbatore Airport",             "node_type": "intersection", "lat": 11.0300, "lon": 77.0434, "population": 3000},
    {"id": "N9",  "name": "Singanallur",                    "node_type": "intersection", "lat": 11.0020, "lon": 77.0230, "population": 5500},
    {"id": "N10", "name": "Saibaba Colony",                 "node_type": "intersection", "lat": 11.0230, "lon": 76.9680, "population": 4000},
    {"id": "N11", "name": "Tidel Park / IT Corridor",       "node_type": "intersection", "lat": 11.0130, "lon": 77.0100, "population": 6000},
    {"id": "N12", "name": "PSG Tech / Peelamedu",           "node_type": "intersection", "lat": 11.0240, "lon": 77.0050, "population": 9000},
    {"id": "N13", "name": "Town Hall",                      "node_type": "intersection", "lat": 11.0050, "lon": 76.9620, "population": 5000},
    {"id": "N14", "name": "Podanur Junction",               "node_type": "intersection", "lat": 10.9750, "lon": 76.9800, "population": 3500},
    {"id": "N15", "name": "Hopes College",                  "node_type": "intersection", "lat": 11.0200, "lon": 76.9750, "population": 4000},
]

ROADS = [
    # Avinashi Road (NH-544) — main arterial east
    {"id": "R1",  "name": "Avinashi Road",           "source_node": "N2",  "dest_node": "N4",  "capacity": 2000, "traffic_volume": 1600, "avg_speed": 35, "length": 5.2, "status": "open", "lat1": 11.0168, "lon1": 76.9558, "lat2": 11.0270, "lon2": 77.0170},
    # Trichy Road (NH-83) — south arterial
    {"id": "R2",  "name": "Trichy Road",             "source_node": "N5",  "dest_node": "N9",  "capacity": 1800, "traffic_volume": 1300, "avg_speed": 40, "length": 4.8, "status": "open", "lat1": 10.9880, "lon1": 76.9750, "lat2": 11.0020, "lon2": 77.0230},
    # DB Road — central connector
    {"id": "R3",  "name": "DB Road",                 "source_node": "N1",  "dest_node": "N3",  "capacity": 1000, "traffic_volume": 750,  "avg_speed": 30, "length": 1.5, "status": "open", "lat1": 11.0018, "lon1": 76.9629, "lat2": 10.9905, "lon2": 76.9558},
    # Sathy Road — north
    {"id": "R4",  "name": "Sathy Road",              "source_node": "N2",  "dest_node": "N10", "capacity": 1200, "traffic_volume": 850,  "avg_speed": 42, "length": 2.1, "status": "open", "lat1": 11.0168, "lon1": 76.9558, "lat2": 11.0230, "lon2": 76.9680},
    # Mettupalayam Road
    {"id": "R5",  "name": "Mettupalayam Road",       "source_node": "N2",  "dest_node": "N15", "capacity": 1100, "traffic_volume": 780,  "avg_speed": 38, "length": 2.5, "status": "open", "lat1": 11.0168, "lon1": 76.9558, "lat2": 11.0200, "lon2": 76.9750},
    # Hospital Road — GKNM connector
    {"id": "R6",  "name": "Hospital Road",           "source_node": "N1",  "dest_node": "N6",  "capacity": 700,  "traffic_volume": 380,  "avg_speed": 28, "length": 0.9, "status": "open", "lat1": 11.0018, "lon1": 76.9629, "lat2": 11.0100, "lon2": 76.9650},
    # Airport Road
    {"id": "R7",  "name": "Airport Road",            "source_node": "N4",  "dest_node": "N8",  "capacity": 1500, "traffic_volume": 900,  "avg_speed": 55, "length": 3.2, "status": "open", "lat1": 11.0270, "lon1": 77.0170, "lat2": 11.0300, "lon2": 77.0434},
    # Codissia / Trade Fair Road
    {"id": "R8",  "name": "Trade Fair Road",         "source_node": "N12", "dest_node": "N7",  "capacity": 1300, "traffic_volume": 400,  "avg_speed": 45, "length": 0.8, "status": "open", "lat1": 11.0240, "lon1": 77.0050, "lat2": 11.0310, "lon2": 77.0050},
    # Singanallur to Peelamedu
    {"id": "R9",  "name": "Singanallur - Peelamedu", "source_node": "N9",  "dest_node": "N4",  "capacity": 1000, "traffic_volume": 720,  "avg_speed": 35, "length": 2.8, "status": "open", "lat1": 11.0020, "lon1": 77.0230, "lat2": 11.0270, "lon2": 77.0170},
    # Ukkadam to RS Puram
    {"id": "R10", "name": "Ukkadam - RS Puram",      "source_node": "N5",  "dest_node": "N3",  "capacity": 900,  "traffic_volume": 680,  "avg_speed": 28, "length": 1.2, "status": "open", "lat1": 10.9880, "lon1": 76.9750, "lat2": 10.9905, "lon2": 76.9558},
    # Tidel Park IT Road
    {"id": "R11", "name": "IT Corridor Road",        "source_node": "N11", "dest_node": "N12", "capacity": 1100, "traffic_volume": 650,  "avg_speed": 48, "length": 1.5, "status": "open", "lat1": 11.0130, "lon1": 77.0100, "lat2": 11.0240, "lon2": 77.0050},
    # Avinashi Rd to IT Corridor
    {"id": "R12", "name": "Peelamedu - IT Link",     "source_node": "N4",  "dest_node": "N11", "capacity": 950,  "traffic_volume": 580,  "avg_speed": 40, "length": 1.1, "status": "open", "lat1": 11.0270, "lon1": 77.0170, "lat2": 11.0130, "lon2": 77.0100},
    # Town Hall to Junction
    {"id": "R13", "name": "Town Hall Road",          "source_node": "N13", "dest_node": "N1",  "capacity": 800,  "traffic_volume": 560,  "avg_speed": 25, "length": 0.6, "status": "open", "lat1": 11.0050, "lon1": 76.9620, "lat2": 11.0018, "lon2": 76.9629},
    # Podanur Road
    {"id": "R14", "name": "Podanur Road",            "source_node": "N14", "dest_node": "N5",  "capacity": 850,  "traffic_volume": 490,  "avg_speed": 35, "length": 1.8, "status": "open", "lat1": 10.9750, "lon1": 76.9800, "lat2": 10.9880, "lon2": 76.9750},
    # Gandhipuram to Town Hall
    {"id": "R15", "name": "Nehru Street",            "source_node": "N2",  "dest_node": "N13", "capacity": 700,  "traffic_volume": 520,  "avg_speed": 22, "length": 0.8, "status": "open", "lat1": 11.0168, "lon1": 76.9558, "lat2": 11.0050, "lon2": 76.9620},
    # Saibaba Colony connector
    {"id": "R16", "name": "Saibaba Colony Road",     "source_node": "N10", "dest_node": "N6",  "capacity": 750,  "traffic_volume": 420,  "avg_speed": 32, "length": 1.3, "status": "open", "lat1": 11.0230, "lon1": 76.9680, "lat2": 11.0100, "lon2": 76.9650},
    # Hopes College to Peelamedu
    {"id": "R17", "name": "Hopes - Peelamedu Road",  "source_node": "N15", "dest_node": "N12", "capacity": 900,  "traffic_volume": 610,  "avg_speed": 38, "length": 2.0, "status": "open", "lat1": 11.0200, "lon1": 76.9750, "lat2": 11.0240, "lon2": 77.0050},
]

ZONES = [
    {"id": "Z1", "name": "GKNM Hospital",              "zone_type": "hospital",   "lat": 11.0100, "lon": 76.9650, "population": 800},
    {"id": "Z2", "name": "Codissia Trade Fair Complex", "zone_type": "stadium",    "lat": 11.0310, "lon": 77.0050, "population": 35000},
    {"id": "Z3", "name": "Gandhipuram Market",          "zone_type": "commercial", "lat": 11.0168, "lon": 76.9558, "population": 12000},
    {"id": "Z4", "name": "PSG College of Technology",   "zone_type": "education",  "lat": 11.0240, "lon": 77.0050, "population": 15000},
    {"id": "Z5", "name": "TIDEL Park IT Hub",           "zone_type": "business",   "lat": 11.0130, "lon": 77.0100, "population": 8000},
    {"id": "Z6", "name": "Coimbatore Airport",          "zone_type": "transport",  "lat": 11.0300, "lon": 77.0434, "population": 4000},
    {"id": "Z7", "name": "RS Puram Shopping District",  "zone_type": "commercial", "lat": 10.9905, "lon": 76.9558, "population": 9000},
    {"id": "Z8", "name": "Coimbatore Medical College",  "zone_type": "hospital",   "lat": 10.9880, "lon": 76.9750, "population": 2000},
]

EVENTS = [
    {"id": "E1", "name": "Codissia Trade Fair",     "event_type": "exhibition", "location": "Codissia Trade Fair Complex", "lat": 11.0310, "lon": 77.0050, "size": 30000, "start_time": "09:00", "end_time": "21:00", "active": True},
    {"id": "E2", "name": "Gandhipuram Festival",    "event_type": "festival",   "location": "Gandhipuram",                 "lat": 11.0168, "lon": 76.9558, "size": 8000,  "start_time": "17:00", "end_time": "22:00", "active": False},
]

def seed_data():
    db = SessionLocal()
    try:
        # Always seed — /tmp is wiped on Vercel cold starts
        existing_ids = {r.id for r in db.query(Road).all()}
        for n in NODES:
            if not db.query(Node).filter_by(id=n["id"]).first():
                db.add(Node(**n))
        for r in ROADS:
            if r["id"] not in existing_ids:
                db.add(Road(**r))
        for z in ZONES:
            if not db.query(Zone).filter_by(id=z["id"]).first():
                db.add(Zone(**z))
        for e in EVENTS:
            if not db.query(Event).filter_by(id=e["id"]).first():
                db.add(Event(**e))
        db.commit()
    finally:
        db.close()
