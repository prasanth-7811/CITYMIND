# CITYMIND — AI-Powered Urban Intelligence Platform

> Real-time city traffic simulation, risk prediction, and citizen reporting for Coimbatore, Tamil Nadu.

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 20+
- MongoDB (running locally on port 27017)

### Terminal 1 — FastAPI Backend
```bash
cd C:\Users\hp\OneDrive\Desktop\AIML\WEHACK5.0
pip install -r backend/requirements.txt
python -m uvicorn backend.main:app --reload --port 8000
```
Swagger docs → http://localhost:8000/docs

### Terminal 2 — Node.js Server
```bash
cd C:\Users\hp\OneDrive\Desktop\AIML\WEHACK5.0\server
npm install
node index.js
```
Node API → http://localhost:3001

### Terminal 3 — React Frontend
```bash
cd C:\Users\hp\OneDrive\Desktop\AIML\WEHACK5.0\frontend
npm install
npm run dev
```
App → http://localhost:5173

### One-Click Start (Windows)
```powershell
.\start.ps1
```
Opens all 3 servers in separate windows and launches the browser automatically.

---

## Routes

| Path | Description |
|------|-------------|
| `/` | Dashboard — live stats, map, what-if simulator |
| `/reports` | Submit a citizen report → MongoDB via Node.js |
| `/manage` | Manage reports — full CRUD (resolve, delete) |

---

## Architecture

```
Browser (React + TypeScript + Tailwind + Leaflet + Recharts)
    ↓ React Router v6  (/, /reports, /manage)
    ↓ Axios
    ├── Node.js / Express  (port 3001)
    │       ├── express-validator  — input validation & error handling
    │       ├── Mongoose → MongoDB — citizen reports CRUD
    │       │       Model: Report { category, location, lat, lon,
    │       │                       severity, description, status, confidence }
    │       └── Proxy routes → FastAPI (simulation, dashboard, map)
    │
    └── FastAPI / Python  (port 8000)
            ├── Simulation Engine  (NetworkX Digital Twin)
            ├── Risk Engine        (weighted formula)
            ├── ML Engine          (Random Forest — scikit-learn, 5 000 samples)
            ├── Explainability Engine
            ├── Recommendation Engine
            └── SQLite             (roads, nodes, zones, events, simulations)
```

---

## API Reference

### Node.js — Reports (MongoDB)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports` | List all reports |
| GET | `/api/reports/:id` | Get single report |
| POST | `/api/reports` | Create report |
| PUT | `/api/reports/:id` | Full update |
| PATCH | `/api/reports/:id/status` | Resolve / reopen |
| DELETE | `/api/reports/:id` | Delete report |

### Node.js — Proxy to FastAPI

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Live city metrics |
| GET | `/api/city` | Full map data |
| GET | `/api/roads` | Road list |
| POST | `/api/simulate` | Run what-if simulation |
| POST | `/api/apply-recommendation` | Apply AI recommendations |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Mapping | Leaflet, React-Leaflet |
| Charts | Recharts |
| Routing | React Router v6 |
| HTTP | Axios |
| Node Server | Express.js, express-validator, CORS |
| Database | MongoDB + Mongoose |
| AI Backend | FastAPI, Python |
| ML | scikit-learn (Random Forest) |
| Graph | NetworkX (Digital Twin) |
| DB (AI) | SQLite + SQLAlchemy |

---

## Rubric Coverage

| Criterion | Implementation |
|-----------|---------------|
| HTML / CSS semantics | Semantic tags, Tailwind responsive grid, accessible labels |
| JavaScript / AJAX | Axios AJAX calls, DOM event handling, form validation |
| ReactJS — Components | 8 reusable components + 2 pages |
| ReactJS — Routing | React Router v6: `BrowserRouter`, `Routes`, `Route`, `NavLink` |
| ReactJS — State binding | `useState`, `useEffect`, `useCallback` data binding |
| Node.js — HTTP server | Express on port 3001, JSON middleware, CORS, request logger |
| Node.js — Routing | Modular routers: `routes/reports.js`, `routes/proxy.js` |
| Node.js — Validation & errors | `express-validator`, 404 handler, global error handler |
| MongoDB — Design | Mongoose schema with enum, min/max, required validators |
| MongoDB — CRUD | GET, POST, PUT, PATCH, DELETE via Express routes |
| MongoDB — Validation | Schema-level + `express-validator` middleware validation |
| Integration — API | Frontend ↔ Node.js ↔ FastAPI proxy chain |
| Integration — End-to-end | Submit report → MongoDB → map pin → dashboard hotspot |

---

## Project Structure

```
WEHACK5.0/
├── backend/                  # FastAPI + AI engine
│   ├── ai/                   # ML, risk, recommendations, explainability
│   ├── api/routes.py         # FastAPI endpoints
│   ├── data/seed.py          # Coimbatore road/node data
│   ├── models/               # SQLAlchemy models
│   ├── simulation/           # NetworkX digital twin
│   └── main.py
├── frontend/                 # React + TypeScript
│   └── src/
│       ├── api/client.ts     # Axios API client
│       ├── components/       # DashboardStats, CityMap, SimulatorPanel, ...
│       ├── pages/            # CitizenReportPage
│       ├── types/index.ts    # TypeScript interfaces
│       └── App.tsx           # React Router layout
├── server/                   # Node.js + Express
│   ├── models/Report.js      # Mongoose schema
│   ├── routes/reports.js     # CRUD routes
│   ├── routes/proxy.js       # FastAPI proxy
│   └── index.js              # Server entry point
├── start.ps1                 # One-click launcher (PowerShell)
├── start.bat                 # One-click launcher (CMD)
└── README.md
```

---

> ⚠ Uses synthetic demo data — not a live government feed.
