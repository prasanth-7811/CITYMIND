from datetime import datetime
from typing import List
from models.models import Event, CitizenReport

def get_ambient_context(
    weather: str,
    traffic_condition: str,
    events: List[Event],
    reports: List[CitizenReport],
    start_time: str = None
) -> dict:
    now = datetime.now()
    hour = now.hour
    if start_time:
        try:
            hour = int(start_time.split(":")[0])
        except Exception:
            pass

    peak_hour = (7 <= hour <= 9) or (17 <= hour <= 19)
    night = hour < 6 or hour >= 22
    active_events = [e for e in events if e.active]
    large_event = any(e.size > 10000 for e in active_events)
    event_nearby = len(active_events) > 0
    maintenance_active = any(r.category == "Traffic" and r.severity >= 3 for r in reports)
    high_report_density = len(reports) >= 5

    return {
        "peak_hour": peak_hour,
        "night_time": night,
        "weather": weather,
        "weather_impact": weather in ("heavy_rain", "snow", "fog"),
        "event_nearby": event_nearby,
        "large_event": large_event,
        "active_events": len(active_events),
        "maintenance_active": maintenance_active,
        "traffic_condition": traffic_condition,
        "high_report_density": high_report_density,
        "report_count": len(reports),
        "timestamp": now.isoformat()
    }
