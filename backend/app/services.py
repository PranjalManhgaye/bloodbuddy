import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.matching import find_matching_donors
from app.models import (
    AIExtraction, AvailabilityStatus, BloodRequest, ConsentRecord,
    DonorInvitation, InvitationStatus, NotificationEvent, RequestStatus,
    RequestStatusHistory, User, UserProfile, UserRole,
)
from app.schemas import (
    BloodRequestCreate, BloodRequestUpdate, InvitationCreate,
    InvitationUpdate, ProfileUpdate,
)


def _add_status_history(db: Session, request_id: str, from_status: Optional[str], to_status: str, note: str = ""):
    entry = RequestStatusHistory(
        id=str(uuid.uuid4()),
        request_id=request_id,
        from_status=from_status,
        to_status=to_status,
        note=note,
    )
    db.add(entry)


def _create_notification(db: Session, user_id: str, title: str, message: str, event_type: str, related_id: str = None):
    notif = NotificationEvent(
        id=str(uuid.uuid4()),
        user_id=user_id,
        title=title,
        message=message,
        event_type=event_type,
        related_id=related_id,
    )
    db.add(notif)


def get_profile(db: Session, user: User) -> dict:
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {
        "id": profile.id,
        "user_id": user.id,
        "display_name": user.display_name,
        "email": user.email,
        "role": user.role,
        "blood_group": profile.blood_group,
        "city": profile.city,
        "latitude": profile.latitude,
        "longitude": profile.longitude,
        "availability": profile.availability,
        "contact_method": profile.contact_method,
        "phone": profile.phone if user.id == user.id else None,
        "share_contact_on_accept": profile.share_contact_on_accept,
        "consent_notifications": profile.consent_notifications,
    }


def update_profile(db: Session, user: User, data: ProfileUpdate) -> dict:
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    if data.display_name is not None:
        user.display_name = data.display_name
    if data.blood_group is not None:
        profile.blood_group = data.blood_group
    if data.city is not None:
        profile.city = data.city
    if data.latitude is not None:
        profile.latitude = data.latitude
    if data.longitude is not None:
        profile.longitude = data.longitude
    if data.availability is not None:
        profile.availability = data.availability
    if data.contact_method is not None:
        profile.contact_method = data.contact_method
    if data.phone is not None:
        profile.phone = data.phone
    if data.share_contact_on_accept is not None:
        profile.share_contact_on_accept = data.share_contact_on_accept
    if data.consent_notifications is not None:
        profile.consent_notifications = data.consent_notifications

    db.commit()
    db.refresh(user)
    db.refresh(profile)
    return get_profile(db, user)


def _request_to_dict(req: BloodRequest, db: Session = None) -> dict:
    counts = None
    if db:
        invitations = db.query(DonorInvitation).filter(DonorInvitation.request_id == req.id).all()
        counts = {
            "total": len(invitations),
            "pending": sum(1 for i in invitations if i.status == InvitationStatus.PENDING),
            "accepted": sum(1 for i in invitations if i.status == InvitationStatus.ACCEPTED),
            "declined": sum(1 for i in invitations if i.status == InvitationStatus.DECLINED),
        }
    return {
        "id": req.id,
        "requester_id": req.requester_id,
        "reference_id": req.reference_id,
        "blood_group": req.blood_group,
        "units_requested": req.units_requested,
        "hospital_name": req.hospital_name,
        "city": req.city,
        "latitude": req.latitude,
        "longitude": req.longitude,
        "required_date": req.required_date,
        "urgency": req.urgency,
        "notes": req.notes,
        "contact_preference": req.contact_preference,
        "consent_confirmed": req.consent_confirmed,
        "status": req.status,
        "confirmed_from_ai": req.confirmed_from_ai,
        "ai_extraction_id": req.ai_extraction_id,
        "created_at": req.created_at,
        "updated_at": req.updated_at,
        "invitation_counts": counts,
    }


def create_request(db: Session, user: User, data: BloodRequestCreate) -> dict:
    if data.ai_extraction_id and not data.confirmed_from_ai:
        raise HTTPException(
            status_code=400,
            detail="AI-extracted data must be confirmed before creating a request",
        )

    if data.ai_extraction_id:
        extraction = db.query(AIExtraction).filter(AIExtraction.id == data.ai_extraction_id).first()
        if not extraction:
            raise HTTPException(status_code=400, detail="AI extraction not found")
        if not extraction.confirmed:
            raise HTTPException(status_code=400, detail="AI extraction must be confirmed first")

    req_id = str(uuid.uuid4())
    req = BloodRequest(
        id=req_id,
        requester_id=user.id,
        reference_id=data.reference_id,
        blood_group=data.blood_group,
        units_requested=data.units_requested,
        hospital_name=data.hospital_name,
        city=data.city,
        latitude=data.latitude,
        longitude=data.longitude,
        required_date=data.required_date,
        urgency=data.urgency,
        notes=data.notes,
        contact_preference=data.contact_preference,
        consent_confirmed=data.consent_confirmed,
        status=RequestStatus.SUBMITTED,
        confirmed_from_ai=data.confirmed_from_ai,
        ai_extraction_id=data.ai_extraction_id,
    )
    db.add(req)
    _add_status_history(db, req_id, None, RequestStatus.SUBMITTED.value, "Request submitted")
    _add_status_history(db, req_id, RequestStatus.SUBMITTED.value, RequestStatus.MATCHING.value, "Searching for donors")

    consent = ConsentRecord(
        id=str(uuid.uuid4()),
        user_id=user.id,
        consent_type="request_creation",
        granted=True,
        context=req_id,
    )
    db.add(consent)

    req.status = RequestStatus.MATCHING
    db.commit()
    db.refresh(req)
    return _request_to_dict(req, db)


def list_requests(db: Session, user: User) -> list[dict]:
    if user.role == UserRole.DONOR:
        invited_ids = [
            i.request_id for i in
            db.query(DonorInvitation).filter(DonorInvitation.donor_id == user.id).all()
        ]
        requests = db.query(BloodRequest).filter(BloodRequest.id.in_(invited_ids)).all() if invited_ids else []
    else:
        requests = db.query(BloodRequest).filter(BloodRequest.requester_id == user.id).order_by(BloodRequest.created_at.desc()).all()
    return [_request_to_dict(r, db) for r in requests]


def get_request(db: Session, user: User, request_id: str) -> dict:
    req = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if user.role != UserRole.ADMIN and req.requester_id != user.id:
        invited = db.query(DonorInvitation).filter(
            DonorInvitation.request_id == request_id,
            DonorInvitation.donor_id == user.id,
        ).first()
        if not invited:
            raise HTTPException(status_code=403, detail="Not authorized")
    return _request_to_dict(req, db)


def update_request(db: Session, user: User, request_id: str, data: BloodRequestUpdate) -> dict:
    req = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.requester_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    old_status = req.status
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(req, field, value)

    if data.status and data.status != old_status:
        _add_status_history(db, request_id, old_status.value, data.status.value)

    db.commit()
    db.refresh(req)
    return _request_to_dict(req, db)


def cancel_request(db: Session, user: User, request_id: str) -> dict:
    req = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.requester_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if req.status in (RequestStatus.CLOSED, RequestStatus.CANCELLED):
        raise HTTPException(status_code=400, detail="Request already closed or cancelled")

    old_status = req.status
    req.status = RequestStatus.CANCELLED
    _add_status_history(db, request_id, old_status.value, RequestStatus.CANCELLED.value, "Cancelled by requester")
    db.commit()
    db.refresh(req)
    return _request_to_dict(req, db)


def get_matches(db: Session, user: User, request_id: str) -> list[dict]:
    req = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.requester_id != user.id and user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")

    return find_matching_donors(
        db, req.blood_group, req.city, req.latitude, req.longitude, exclude_user_id=user.id,
    )


def create_invitation(db: Session, user: User, request_id: str, data: InvitationCreate) -> dict:
    req = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.requester_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    existing = db.query(DonorInvitation).filter(
        DonorInvitation.request_id == request_id,
        DonorInvitation.donor_id == data.donor_id,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Invitation already sent to this donor")

    donor = db.query(User).filter(User.id == data.donor_id, User.role == UserRole.DONOR).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor not found")

    inv_id = str(uuid.uuid4())
    invitation = DonorInvitation(
        id=inv_id,
        request_id=request_id,
        donor_id=data.donor_id,
        status=InvitationStatus.PENDING,
        message=data.message or f"Blood donation request for {req.blood_group.value} at {req.hospital_name}",
    )
    db.add(invitation)

    if req.status == RequestStatus.MATCHING:
        old_status = req.status
        req.status = RequestStatus.DONORS_CONTACTED
        _add_status_history(db, request_id, old_status.value, RequestStatus.DONORS_CONTACTED.value, "Donors contacted")

    _create_notification(
        db, data.donor_id,
        "New Donation Request",
        f"You have been invited to donate {req.blood_group.value} blood at {req.hospital_name}",
        "invitation", inv_id,
    )
    db.commit()
    db.refresh(invitation)
    return _invitation_to_dict(invitation, db)


def list_invitations(db: Session, user: User) -> list[dict]:
    if user.role == UserRole.DONOR:
        invitations = db.query(DonorInvitation).filter(DonorInvitation.donor_id == user.id).order_by(DonorInvitation.created_at.desc()).all()
    else:
        request_ids = [r.id for r in db.query(BloodRequest).filter(BloodRequest.requester_id == user.id).all()]
        invitations = db.query(DonorInvitation).filter(DonorInvitation.request_id.in_(request_ids)).order_by(DonorInvitation.created_at.desc()).all() if request_ids else []
    return [_invitation_to_dict(i, db) for i in invitations]


def _invitation_to_dict(inv: DonorInvitation, db: Session) -> dict:
    donor = db.query(User).filter(User.id == inv.donor_id).first()
    req = db.query(BloodRequest).filter(BloodRequest.id == inv.request_id).first()
    result = {
        "id": inv.id,
        "request_id": inv.request_id,
        "donor_id": inv.donor_id,
        "donor_name": donor.display_name if donor else None,
        "status": inv.status,
        "message": inv.message,
        "contact_shared": inv.contact_shared,
        "responded_at": inv.responded_at,
        "created_at": inv.created_at,
    }
    if req:
        result["request_details"] = _request_to_dict(req, db)
    return result


def update_invitation(db: Session, user: User, invitation_id: str, data: InvitationUpdate) -> dict:
    inv = db.query(DonorInvitation).filter(DonorInvitation.id == invitation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invitation not found")
    if inv.donor_id != user.id:
        raise HTTPException(status_code=403, detail="Only the invited donor can respond")
    if inv.status != InvitationStatus.PENDING:
        raise HTTPException(status_code=409, detail="Invitation already responded to")

    inv.status = data.status
    inv.responded_at = datetime.now(timezone.utc)

    if data.status == InvitationStatus.ACCEPTED and data.share_contact:
        profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
        if profile and profile.share_contact_on_accept:
            inv.contact_shared = True
            consent = ConsentRecord(
                id=str(uuid.uuid4()),
                user_id=user.id,
                consent_type="contact_sharing",
                granted=True,
                context=inv.id,
            )
            db.add(consent)

    req = db.query(BloodRequest).filter(BloodRequest.id == inv.request_id).first()
    if req:
        all_invitations = db.query(DonorInvitation).filter(DonorInvitation.request_id == req.id).all()
        has_response = any(i.status in (InvitationStatus.ACCEPTED, InvitationStatus.DECLINED) for i in all_invitations)
        has_accept = any(i.status == InvitationStatus.ACCEPTED for i in all_invitations)

        if has_response and req.status == RequestStatus.DONORS_CONTACTED:
            req.status = RequestStatus.RESPONSE_RECEIVED
            _add_status_history(db, req.id, RequestStatus.DONORS_CONTACTED.value, RequestStatus.RESPONSE_RECEIVED.value)
        if has_accept and req.status == RequestStatus.RESPONSE_RECEIVED:
            req.status = RequestStatus.COORDINATION
            _add_status_history(db, req.id, RequestStatus.RESPONSE_RECEIVED.value, RequestStatus.COORDINATION.value)

        status_text = "accepted" if data.status == InvitationStatus.ACCEPTED else "declined"
        _create_notification(
            db, req.requester_id,
            f"Donor Response: {status_text.title()}",
            f"A donor has {status_text} your blood donation request",
            "invitation_response", inv.id,
        )

    db.commit()
    db.refresh(inv)
    return _invitation_to_dict(inv, db)


def get_tracking(db: Session, user: User, request_id: str) -> dict:
    req = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.requester_id != user.id and user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")

    history = db.query(RequestStatusHistory).filter(
        RequestStatusHistory.request_id == request_id
    ).order_by(RequestStatusHistory.created_at).all()

    invitations = db.query(DonorInvitation).filter(DonorInvitation.request_id == request_id).all()

    return {
        "request": _request_to_dict(req, db),
        "status_history": [
            {"id": h.id, "from_status": h.from_status, "to_status": h.to_status,
             "note": h.note, "created_at": h.created_at}
            for h in history
        ],
        "invitations": [_invitation_to_dict(i, db) for i in invitations],
        "response_summary": {
            "total_invited": len(invitations),
            "pending": sum(1 for i in invitations if i.status == InvitationStatus.PENDING),
            "accepted": sum(1 for i in invitations if i.status == InvitationStatus.ACCEPTED),
            "declined": sum(1 for i in invitations if i.status == InvitationStatus.DECLINED),
        },
    }


def get_demo_stats(db: Session) -> dict:
    total_donors = db.query(User).filter(User.role == UserRole.DONOR).count()
    active_requests = db.query(BloodRequest).filter(
        BloodRequest.status.notin_([RequestStatus.CLOSED, RequestStatus.CANCELLED])
    ).count()
    pending_invitations = db.query(DonorInvitation).filter(
        DonorInvitation.status == InvitationStatus.PENDING
    ).count()
    completed = db.query(BloodRequest).filter(
        BloodRequest.status.in_([RequestStatus.CLOSED, RequestStatus.COORDINATION])
    ).count()
    return {
        "total_donors": total_donors,
        "active_requests": active_requests,
        "pending_invitations": pending_invitations,
        "completed_coordinations": completed,
        "is_demo_data": True,
    }


def list_notifications(db: Session, user: User) -> list[dict]:
    notifs = db.query(NotificationEvent).filter(
        NotificationEvent.user_id == user.id
    ).order_by(NotificationEvent.created_at.desc()).limit(50).all()
    return [
        {"id": n.id, "title": n.title, "message": n.message, "event_type": n.event_type,
         "related_id": n.related_id, "read": n.read, "created_at": n.created_at}
        for n in notifs
    ]
