import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Boolean, Column, DateTime, Enum, Float, ForeignKey, Integer, String, Text, JSON
)
from sqlalchemy.orm import relationship

from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class UserRole(str, enum.Enum):
    REQUESTER = "requester"
    DONOR = "donor"
    ADMIN = "admin"


class BloodGroup(str, enum.Enum):
    A_POS = "A+"
    A_NEG = "A-"
    B_POS = "B+"
    B_NEG = "B-"
    AB_POS = "AB+"
    AB_NEG = "AB-"
    O_POS = "O+"
    O_NEG = "O-"


class UrgencyLevel(str, enum.Enum):
    ROUTINE = "routine"
    URGENT = "urgent"
    CRITICAL = "critical"


class RequestStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    MATCHING = "matching"
    DONORS_CONTACTED = "donors_contacted"
    RESPONSE_RECEIVED = "response_received"
    COORDINATION = "coordination"
    CLOSED = "closed"
    CANCELLED = "cancelled"


class InvitationStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    EXPIRED = "expired"


class AvailabilityStatus(str, enum.Enum):
    AVAILABLE = "available"
    UNAVAILABLE = "unavailable"
    LIMITED = "limited"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=True)
    role = Column(Enum(UserRole), nullable=False)
    display_name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    profile = relationship("UserProfile", back_populates="user", uselist=False)
    requests = relationship("BloodRequest", back_populates="requester")
    invitations = relationship("DonorInvitation", back_populates="donor")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    blood_group = Column(Enum(BloodGroup), nullable=True)
    city = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    availability = Column(Enum(AvailabilityStatus), default=AvailabilityStatus.AVAILABLE)
    contact_method = Column(String, default="in_app")
    phone = Column(String, nullable=True)
    share_contact_on_accept = Column(Boolean, default=False)
    consent_notifications = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="profile")


class BloodRequest(Base):
    __tablename__ = "blood_requests"

    id = Column(String, primary_key=True)
    requester_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    reference_id = Column(String, nullable=True)
    blood_group = Column(Enum(BloodGroup), nullable=False)
    units_requested = Column(Integer, nullable=False, default=1)
    hospital_name = Column(String, nullable=False)
    city = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    required_date = Column(String, nullable=True)
    urgency = Column(Enum(UrgencyLevel), default=UrgencyLevel.ROUTINE)
    notes = Column(Text, nullable=True)
    contact_preference = Column(String, default="in_app")
    consent_confirmed = Column(Boolean, default=False)
    status = Column(Enum(RequestStatus), default=RequestStatus.DRAFT, index=True)
    ai_extraction_id = Column(String, ForeignKey("ai_extractions.id"), nullable=True)
    confirmed_from_ai = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    requester = relationship("User", back_populates="requests")
    ai_extraction = relationship("AIExtraction", foreign_keys=[ai_extraction_id])
    invitations = relationship("DonorInvitation", back_populates="request")
    status_history = relationship("RequestStatusHistory", back_populates="request")


class AIExtraction(Base):
    __tablename__ = "ai_extractions"

    id = Column(String, primary_key=True)
    provider = Column(String, nullable=False)
    filename = Column(String, nullable=True)
    extracted_data = Column(JSON, nullable=False)
    field_confidence = Column(JSON, nullable=True)
    needs_confirmation = Column(Boolean, default=True)
    confirmed = Column(Boolean, default=False)
    confirmed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)


class DonorInvitation(Base):
    __tablename__ = "donor_invitations"

    id = Column(String, primary_key=True)
    request_id = Column(String, ForeignKey("blood_requests.id"), nullable=False, index=True)
    donor_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    status = Column(Enum(InvitationStatus), default=InvitationStatus.PENDING)
    message = Column(Text, nullable=True)
    contact_shared = Column(Boolean, default=False)
    responded_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    request = relationship("BloodRequest", back_populates="invitations")
    donor = relationship("User", back_populates="invitations")


class RequestStatusHistory(Base):
    __tablename__ = "request_status_history"

    id = Column(String, primary_key=True)
    request_id = Column(String, ForeignKey("blood_requests.id"), nullable=False, index=True)
    from_status = Column(String, nullable=True)
    to_status = Column(String, nullable=False)
    note = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    request = relationship("BloodRequest", back_populates="status_history")


class NotificationEvent(Base):
    __tablename__ = "notification_events"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    event_type = Column(String, nullable=False)
    related_id = Column(String, nullable=True)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)


class ConsentRecord(Base):
    __tablename__ = "consent_records"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    consent_type = Column(String, nullable=False)
    granted = Column(Boolean, nullable=False)
    context = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
