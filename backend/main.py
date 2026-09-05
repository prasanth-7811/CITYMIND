from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database.db import engine
from backend.models.models import Base
from backend.api.routes import router
from backend.data.seed import seed_data

Base.metadata.create_all(bind=engine)
seed_data()

app = FastAPI(title="CityMind API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.get("/")
def root():
    return {"message": "CityMind API running", "docs": "/docs"}
