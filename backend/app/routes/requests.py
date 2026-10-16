import uuid
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.ai.provider import get_ai_provider
from app.auth import get_current_user
from app.config import get_settings
from app.database import get_db
from app.models import AIExtraction, User
from app.notifications import generate_request_share_message
from app.schemas import (
    AIExtractionResponse, BloodRequestCreate, BloodRequestResponse,
    BloodRequestUpdate, DonorMatch, NotificationChannel,
    NotificationPreviewResponse, RequestTrackingResponse,
)
from app.services import (
    cancel_request, create_request, get_matches, get_request,
    get_tracking, list_requests, update_request,
)

router = APIRouter(prefix="/api/requests", tags=["requests"])
settings = get_settings()

ALLOWED_TYPES = {
    "image/jpeg", "image/png", "image/webp", "image/gif",
    "application/pdf", "text/plain",
}


@router.post("", response_model=BloodRequestResponse, status_code=201)
def post_request(
    data: BloodRequestCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return create_request(db, user, data)


@router.get("", response_model=list[BloodRequestResponse])
def get_requests(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return list_requests(db, user)


@router.get("/{request_id}", response_model=BloodRequestResponse)
def get_request_by_id(
    request_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_request(db, user, request_id)


@router.patch("/{request_id}", response_model=BloodRequestResponse)
def patch_request(
    request_id: str,
    data: BloodRequestUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return update_request(db, user, request_id, data)


@router.post("/{request_id}/cancel", response_model=BloodRequestResponse)
def post_cancel(
    request_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return cancel_request(db, user, request_id)


@router.get("/{request_id}/matches", response_model=list[DonorMatch])
def get_request_matches(
    request_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_matches(db, user, request_id)


@router.get("/{request_id}/tracking", response_model=RequestTrackingResponse)
def get_request_tracking(
    request_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_tracking(db, user, request_id)


@router.post("/extract-document", response_model=AIExtractionResponse)
async def extract_document(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"File type not allowed: {file.content_type}")

    contents = await file.read()
    if len(contents) > settings.max_upload_bytes:
        raise HTTPException(status_code=400, detail=f"File too large. Max {settings.max_upload_size_mb}MB")

    provider = get_ai_provider()
    result = await provider.extract_blood_request(contents, file.filename or "upload", file.content_type or "application/octet-stream")

    extraction_id = str(uuid.uuid4())
    extraction = AIExtraction(
        id=extraction_id,
        provider=provider.name,
        filename=file.filename,
        extracted_data=result,
        field_confidence=result.get("field_confidence", {}),
        needs_confirmation=True,
        confirmed=False,
    )
    db.add(extraction)
    db.commit()
    db.refresh(extraction)

    return AIExtractionResponse(
        id=extraction.id,
        provider=extraction.provider,
        provider_label=result.get("provider_label", provider.label),
        filename=extraction.filename,
        extracted_data=extraction.extracted_data,
        field_confidence=extraction.field_confidence,
        needs_confirmation=extraction.needs_confirmation,
        confirmed=extraction.confirmed,
        created_at=extraction.created_at,
    )


@router.post("/extractions/{extraction_id}/confirm", response_model=AIExtractionResponse)
def confirm_extraction(
    extraction_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    extraction = db.query(AIExtraction).filter(AIExtraction.id == extraction_id).first()
    if not extraction:
        raise HTTPException(status_code=404, detail="Extraction not found")

    from datetime import datetime, timezone
    extraction.confirmed = True
    extraction.confirmed_at = datetime.now(timezone.utc)
    extraction.needs_confirmation = False
    db.commit()
    db.refresh(extraction)

    return AIExtractionResponse(
        id=extraction.id,
        provider=extraction.provider,
        provider_label=extraction.extracted_data.get("provider_label", extraction.provider),
        filename=extraction.filename,
        extracted_data=extraction.extracted_data,
        field_confidence=extraction.field_confidence,
        needs_confirmation=extraction.needs_confirmation,
        confirmed=extraction.confirmed,
        created_at=extraction.created_at,
    )


@router.get("/{request_id}/share-message", response_model=NotificationPreviewResponse)
def get_request_share_message(
    request_id: str,
    channel: NotificationChannel = NotificationChannel.WHATSAPP,
    db: Session = Depends(get_db),
):
    return generate_request_share_message(db, request_id, channel)

