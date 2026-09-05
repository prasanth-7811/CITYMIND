# CITYMIND — AI-Powered Urban Intelligence Platform

## Quick Start

### Terminal 1 — Backend
```bash
cd c:\Users\hp\OneDrive\Desktop\AIML\WEHACK5.0
python -m uvicorn backend.main:app --reload --port 8000
```
API docs: http://localhost:8000/docs

### Terminal 2 — Frontend
```bash
cd c:\Users\hp\OneDrive\Desktop\AIML\WEHACK5.0\frontend
npm run dev
```
App: http://localhost:5173

---

## Demo Flow (Judge Walkthrough)

1. Open http://localhost:5173
2. Dashboard loads with live city stats and interactive map
3. Roads colored Green/Yellow/Red by congestion level
4. Click **⚡ Simulator** panel → select "Close Road" → pick "Main Road A"
5. Set Weather: Heavy Rain, Traffic: Heavy → click **SIMULATE**
6. Map updates — closed road goes grey/dashed, affected roads turn red
7. **📊 Results** tab shows Before/After/+AI metrics with charts
8. **🧠 Explain** tab shows AI factors (Road Utilization, Weather, etc.)
9. **💡 Recs** tab shows generated recommendations
10. Click **✅ APPLY RECOMMENDATION** → congestion drops (e.g. 82% → 61%)
11. Navigate to **📝 Report Issue** → submit a citizen report → appears on map

---

## Architecture

```
Frontend (React + TypeScript + Tailwind + Leaflet + Recharts)
    ↓ REST API (Axios)
Backend (FastAPI + Python)
    ↓
Simulation Engine (NetworkX Digital Twin Graph)
    ↓
Risk Engine (weighted formula: utilization + event + weather + closure + reports)
    ↓
Explainability Engine (factor decomposition)
    ↓
Recommendation Engine (rule-based + context-aware)
    ↓
SQLite Database (roads, nodes, reports, simulations, recommendations)
```

## Key APIs
- `GET  /api/dashboard`         — live city metrics
- `GET  /api/city`              — full map data (roads, nodes, zones, events, reports)
- `GET  /api/roads`             — road list for simulator dropdown
- `POST /api/simulate`          — run what-if simulation
- `POST /api/reports`           — submit citizen report
- `POST /api/apply-recommendation` — apply AI recommendations
