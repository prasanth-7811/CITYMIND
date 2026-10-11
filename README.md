# CITYMIND — AI-Powered Urban Intelligence Platform

## Quick Start

### Terminal 1 — Python Backend (FastAPI + AI Engine)
```bash
cd c:\Users\hp\OneDrive\Desktop\AIML\WEHACK5.0
python -m uvicorn backend.main:app --reload --port 8000
```
API docs: http://localhost:8000/docs

### Terminal 2 — Node.js Server (Express + MongoDB)
```bash
cd c:\Users\hp\OneDrive\Desktop\AIML\WEHACK5.0\server
node index.js
```
Node API: http://localhost:3001

> MongoDB must be running locally: `mongod` (default port 27017)
> If MongoDB is unavailable the server still starts — reports CRUD will return errors.

### Terminal 3 — Frontend (React + Vite)
```bash
cd c:\Users\hp\OneDrive\Desktop\AIML\WEHACK5.0\frontend
npm run dev
```
App: http://localhost:5173

---

## Routes
| Path | Description |
|------|-------------|
| `/` | Dashboard — live stats, map, what-if simulator |
| `/reports` | Submit citizen report (POST → MongoDB via Node.js) |
| `/manage` | Manage reports — full CRUD (GET/PUT/PATCH/DELETE → MongoDB) |

---

## Architecture

```
Browser (React + TypeScript + Tailwind + Leaflet + Recharts)
    ↓ React Router (/, /reports, /manage)
    ↓ Axios
    ├── Node.js / Express (port 3001)
    │       ├── Mongoose → MongoDB (citizen reports CRUD)
    │       │       Model: Report { category, location, lat, lon,
    │       │                       severity, description, status, confidence }
    │       └── Proxy → FastAPI (simulation, dashboard, map)
    │
    └── FastAPI / Python (port 8000)
            ├── Simulation Engine (NetworkX Digital Twin)
            ├── Risk Engine (weighted formula)
            ├── ML Engine (Random Forest — scikit-learn)
            ├── Explainability Engine
            ├── Recommendation Engine
            └── SQLite (roads, nodes, zones, events, simulations)
```

## Key APIs

### Node.js (Express + MongoDB)
- `GET    /api/reports`          — list all reports
- `GET    /api/reports/:id`      — get single report
- `POST   /api/reports`          — create report
- `PUT    /api/reports/:id`      — update report
- `PATCH  /api/reports/:id/status` — resolve/reopen
- `DELETE /api/reports/:id`      — delete report

### FastAPI (via Node.js proxy or direct)
- `GET  /api/dashboard`          — live city metrics
- `GET  /api/city`               — full map data
- `GET  /api/roads`              — road list
- `POST /api/simulate`           — run what-if simulation
- `POST /api/apply-recommendation` — apply AI recommendations

## Rubric Coverage
| Criterion | Implementation |
|-----------|---------------|
| HTML/CSS semantics | Semantic tags, Tailwind responsive grid |
| JavaScript / AJAX | Axios AJAX calls, DOM event handling, form validation |
| ReactJS | Components, React Router, useState/useEffect data binding |
| Node.js | Express HTTP server, middleware, routing, error handling |
| MongoDB CRUD | Mongoose model, full CRUD via Express routes + validation |
| Integration | Frontend ↔ Node.js ↔ MongoDB + FastAPI end-to-end |
