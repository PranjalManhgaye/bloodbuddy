from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import User
from app.notifications import generate_invitation_preview_message
from app.schemas import (
    InvitationCreate, InvitationResponse, InvitationUpdate,
    NotificationChannel, NotificationPreviewResponse,
)
from app.services import create_invitation, list_invitations, update_invitation

router = APIRouter(prefix="/api", tags=["invitations"])


@router.post("/requests/{request_id}/invitations", response_model=InvitationResponse, status_code=201)
def post_invitation(
    request_id: str,
    data: InvitationCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return create_invitation(db, user, request_id, data)


@router.get("/invitations", response_model=list[InvitationResponse])
def get_invitations(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return list_invitations(db, user)


@router.patch("/invitations/{invitation_id}", response_model=InvitationResponse)
def patch_invitation(
    invitation_id: str,
    data: InvitationUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return update_invitation(db, user, invitation_id, data)


@router.get("/invitations/{invitation_id}/preview-message", response_model=NotificationPreviewResponse)
def get_invitation_preview_message(
    invitation_id: str,
    channel: NotificationChannel = NotificationChannel.WHATSAPP,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return generate_invitation_preview_message(db, user, invitation_id, channel)

