import enum
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator

from app.models import (
    AvailabilityStatus, BloodGroup, InvitationStatus,
    RequestStatus, UrgencyLevel, UserRole,
)

VALID_BLOOD_GROUPS = {bg.value for bg in BloodGroup}


class DemoLoginRequest(BaseModel):
    email: str
    password: str = "demo123"


class UserResponse(BaseModel):
    id: str
    email: str
    role: UserRole
    display_name: str
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    blood_group: Optional[BloodGroup] = None
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    availability: Optional[AvailabilityStatus] = None
    contact_method: Optional[str] = None
    phone: Optional[str] = None
    share_contact_on_accept: Optional[bool] = None
    consent_notifications: Optional[bool] = None


class ProfileResponse(BaseModel):
    id: str
    user_id: str
    display_name: str
    email: str
    role: UserRole
    blood_group: Optional[BloodGroup] = None
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    availability: AvailabilityStatus
    contact_method: str
    phone: Optional[str] = None
    share_contact_on_accept: bool
    consent_notifications: bool

    class Config:
        from_attributes = True


class BloodRequestCreate(BaseModel):
    reference_id: Optional[str] = None
    blood_group: BloodGroup
    units_requested: int = Field(ge=1, le=10)
    hospital_name: str = Field(min_length=2, max_length=200)
    city: str = Field(min_length=2, max_length=100)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    required_date: Optional[str] = None
    urgency: UrgencyLevel = UrgencyLevel.ROUTINE
    notes: Optional[str] = Field(None, max_length=2000)
    contact_preference: str = "in_app"
    consent_confirmed: bool = False
    ai_extraction_id: Optional[str] = None
    confirmed_from_ai: bool = False

    @field_validator("consent_confirmed")
    @classmethod
    def consent_required(cls, v):
        if not v:
            raise ValueError("Consent confirmation is required")
        return v


class BloodRequestUpdate(BaseModel):
    reference_id: Optional[str] = None
    blood_group: Optional[BloodGroup] = None
    units_requested: Optional[int] = Field(None, ge=1, le=10)
    hospital_name: Optional[str] = None
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    required_date: Optional[str] = None
    urgency: Optional[UrgencyLevel] = None
    notes: Optional[str] = None
    contact_preference: Optional[str] = None
    status: Optional[RequestStatus] = None


class BloodRequestResponse(BaseModel):
    id: str
    requester_id: str
    reference_id: Optional[str]
    blood_group: BloodGroup
    units_requested: int
    hospital_name: str
    city: str
    latitude: Optional[float]
    longitude: Optional[float]
    required_date: Optional[str]
    urgency: UrgencyLevel
    notes: Optional[str]
    contact_preference: str
    consent_confirmed: bool
    status: RequestStatus
    confirmed_from_ai: bool
    ai_extraction_id: Optional[str]
    created_at: datetime
    updated_at: datetime
    invitation_counts: Optional[dict] = None

    class Config:
        from_attributes = True


class ExtractionField(BaseModel):
    value: Optional[str] = None
    confidence: Optional[str] = None  # high, medium, low, missing
    needs_review: bool = False


class AIExtractionResult(BaseModel):
    blood_group: Optional[str] = None
    units_requested: Optional[int] = None
    hospital_name: Optional[str] = None
    city: Optional[str] = None
    required_date: Optional[str] = None
    requester_notes: Optional[str] = None
    field_confidence: dict[str, str] = {}
    needs_confirmation: bool = True
    provider: str
    provider_label: str


class AIExtractionResponse(BaseModel):
    id: str
    provider: str
    provider_label: str
    filename: Optional[str]
    extracted_data: dict
    field_confidence: Optional[dict]
    needs_confirmation: bool
    confirmed: bool
    created_at: datetime

    class Config:
        from_attributes = True


class DonorMatch(BaseModel):
    donor_id: str
    display_name: str
    blood_group: BloodGroup
    city: Optional[str]
    distance_km: Optional[float]
    availability: AvailabilityStatus
    match_type: str = "same_blood_group"


class InvitationCreate(BaseModel):
    donor_id: str
    message: Optional[str] = None


class InvitationResponse(BaseModel):
    id: str
    request_id: str
    donor_id: str
    donor_name: Optional[str] = None
    status: InvitationStatus
    message: Optional[str]
    contact_shared: bool
    responded_at: Optional[datetime]
    created_at: datetime
    request_details: Optional[BloodRequestResponse] = None

    class Config:
        from_attributes = True


class InvitationUpdate(BaseModel):
    status: InvitationStatus
    share_contact: bool = False

    @field_validator("status")
    @classmethod
    def valid_status(cls, v):
        if v not in (InvitationStatus.ACCEPTED, InvitationStatus.DECLINED):
            raise ValueError("Status must be accepted or declined")
        return v


class StatusHistoryEntry(BaseModel):
    id: str
    from_status: Optional[str]
    to_status: str
    note: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class RequestTrackingResponse(BaseModel):
    request: BloodRequestResponse
    status_history: list[StatusHistoryEntry]
    invitations: list[InvitationResponse]
    response_summary: dict


class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    event_type: str
    related_id: Optional[str]
    read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class DemoStatsResponse(BaseModel):
    total_donors: int
    active_requests: int
    pending_invitations: int
    completed_coordinations: int
    is_demo_data: bool = True


class NotificationChannel(str, enum.Enum):
    WHATSAPP = "whatsapp"
    SMS = "sms"


class NotificationPreviewResponse(BaseModel):
    channel: NotificationChannel
    message: str
    share_url: Optional[str] = None
    recipient_phone: Optional[str] = None
    contact_shared: bool = False
    is_demo_mode: bool = True
    disclaimer: str
    provider_status: str = "demo_manual"


class ErrorResponse(BaseModel):
    detail: str

