from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import User, UserRole
from app.schemas import DemoStatsResponse, NotificationResponse
from app.seed import reset_demo_data
from app.services import get_demo_stats, list_notifications

router = APIRouter(prefix="/api/demo", tags=["demo"])


@router.get("/stats", response_model=DemoStatsResponse)
def demo_stats(db: Session = Depends(get_db)):
    return get_demo_stats(db)


@router.post("/reset")
def demo_reset(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != UserRole.ADMIN:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Admin only")
    reset_demo_data(db)
    return {"message": "Demo data reset successfully"}


@router.get("/notifications", response_model=list[NotificationResponse])
def get_notifications(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return list_notifications(db, user)
