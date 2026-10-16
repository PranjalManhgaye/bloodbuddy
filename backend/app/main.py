import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import Base, engine, SessionLocal
from app.seed import seed_demo_data
from app.routes import auth, profile, requests, invitations, demo

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("bloodbuddy")

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_demo_data(db)
        logger.info("Database initialized and demo data seeded")
    finally:
        db.close()
    yield


app = FastAPI(
    title="BloodBuddy API",
    description="Community-driven blood donor coordination platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(requests.router)
app.include_router(invitations.router)
app.include_router(demo.router)


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "bloodbuddy",
        "auth_mode": settings.auth_mode,
        "ai_provider": settings.ai_provider,
    }
