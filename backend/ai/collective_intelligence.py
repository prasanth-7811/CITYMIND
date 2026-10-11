from typing import List
from datetime import datetime, timezone
from models.models import CitizenReport

def calculate_confidence(reports: List[CitizenReport]) -> float:
    if not reports:
        return 0.0
    count_factor = min(len(reports) / 10, 1.0) * 0.4
    severity_factor = (sum(r.severity for r in reports) / (len(reports) * 5)) * 0.35
    now = datetime.now(timezone.utc)
    recency_scores = []
    for r in reports:
        if r.created_at:
            created = r.created_at
            if created.tzinfo is None:
                created = created.replace(tzinfo=timezone.utc)
            hours_ago = (now - created).total_seconds() / 3600
            recency_scores.append(max(0, 1 - hours_ago / 24))
    recency_factor = (sum(recency_scores) / len(recency_scores) if recency_scores else 0.5) * 0.25
    return round(min(count_factor + severity_factor + recency_factor, 1.0), 2)

def detect_hotspots(reports: List[CitizenReport]) -> List[dict]:
    if not reports:
        return []
    location_groups = {}
    for r in reports:
        key = r.location.lower().strip()
        if key not in location_groups:
            location_groups[key] = []
        location_groups[key].append(r)
    hotspots = []
    for loc, group in location_groups.items():
        if len(group) >= 2:
            confidence = calculate_confidence(group)
            hotspots.append({
                "location": group[0].location,
                "lat": group[0].lat,
                "lon": group[0].lon,
                "report_count": len(group),
                "categories": list(set(r.category for r in group)),
                "avg_severity": round(sum(r.severity for r in group) / len(group), 1),
                "confidence": confidence
            })
    hotspots.sort(key=lambda x: x["confidence"], reverse=True)
    return hotspots
