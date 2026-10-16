import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os.environ["DATABASE_URL"] = "sqlite://"
os.environ["JWT_SECRET"] = "test-secret"
os.environ["AI_PROVIDER"] = "demo"

from app.database import Base, get_db
from app.main import app
from app.seed import seed_demo_data


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    seed_demo_data(db)
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def requester_token(client):
    resp = client.post("/api/auth/demo-login", json={"email": "requester@demo.bloodbuddy", "password": "demo123"})
    return resp.json()["access_token"]


@pytest.fixture()
def donor_token(client):
    resp = client.post("/api/auth/demo-login", json={"email": "donor1@demo.bloodbuddy", "password": "demo123"})
    return resp.json()["access_token"]


@pytest.fixture()
def admin_token(client):
    resp = client.post("/api/auth/demo-login", json={"email": "admin@demo.bloodbuddy", "password": "demo123"})
    return resp.json()["access_token"]
