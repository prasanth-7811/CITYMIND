import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database.db import engine
from .models.models import Base
from .api.routes import router
from .data.seed import seed_data

Base.metadata.create_all(bind=engine)
seed_data()

app = FastAPI(title="CityMind API", version="1.0.0")

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    os.getenv("FRONTEND_URL", ""),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o for o in ALLOWED_ORIGINS if o],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.get("/seed")
def force_seed():
    from .data.seed import seed_data
    seed_data()
    return {"message": "Seeded"}

@app.get("/")
def root():
    return {"message": "CityMind API running", "docs": "/docs"}
