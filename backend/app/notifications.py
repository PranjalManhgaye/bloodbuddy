import enum
import urllib.parse
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models import (
    BloodRequest, DonorInvitation, InvitationStatus, User, UserProfile, UserRole,
)
from app.schemas import NotificationChannel, NotificationPreviewResponse


DEMO_DISCLAIMER = (
    "DEMO MODE: External messaging is not automated. This pre-filled message is generated "
    "for manual review and dispatch. BloodBuddy does not send unauthorized external messages."
)


def generate_request_share_message(
    db: Session,
    request_id: str,
    channel: NotificationChannel = NotificationChannel.WHATSAPP,
    base_url: str = "http://localhost:5173",
) -> NotificationPreviewResponse:
    """Generate a shareable pre-filled coordination message for a blood request."""
    req = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blood request not found")

    date_str = f" by {req.required_date}" if req.required_date else ""
    app_link = f"{base_url}/requests/{req.id}"

    if channel == NotificationChannel.WHATSAPP:
        message = (
            f"🩸 *URGENT BLOOD NEED - BloodBuddy*\n\n"
            f"Patient requires *{req.units_requested} unit(s)* of *{req.blood_group.value}* blood at *{req.hospital_name}*, {req.city}{date_str}.\n\n"
            f"Urgency Level: *{req.urgency.value.upper()}*\n"
            f"Reference: #{req.id[:8]}\n\n"
            f"Can you donate or help coordinate? Connect safely through BloodBuddy:\n{app_link}\n\n"
            f"_(Privacy note: Coordinated safely with consent on BloodBuddy)_"
        )
        share_url = f"https://wa.me/?text={urllib.parse.quote(message)}"
    else:  # SMS
        message = (
            f"URGENT: {req.units_requested} unit(s) of {req.blood_group.value} blood needed at "
            f"{req.hospital_name}, {req.city}{date_str}. Coordinate safely: {app_link}"
        )
        share_url = f"sms:?body={urllib.parse.quote(message)}"

    return NotificationPreviewResponse(
        channel=channel,
        message=message,
        share_url=share_url,
        recipient_phone=None,
        contact_shared=False,
        is_demo_mode=True,
        disclaimer=DEMO_DISCLAIMER,
        provider_status="demo_manual",
    )


def generate_invitation_preview_message(
    db: Session,
    user: User,
    invitation_id: str,
    channel: NotificationChannel = NotificationChannel.WHATSAPP,
    base_url: str = "http://localhost:5173",
) -> NotificationPreviewResponse:
    """
    Generate a pre-filled preview message for a specific donor invitation.
    Enforces privacy: recipient phone numbers are NEVER exposed unless explicit mutual consent was given.
    """
    inv = db.query(DonorInvitation).filter(DonorInvitation.id == invitation_id).first()
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")

    req = db.query(BloodRequest).filter(BloodRequest.id == inv.request_id).first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated blood request not found")

    # Access control: only the requester, the invited donor, or an admin can preview the invitation message
    if user.id not in (req.requester_id, inv.donor_id) and user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to preview this invitation")

    donor = db.query(User).filter(User.id == inv.donor_id).first()
    donor_profile = db.query(UserProfile).filter(UserProfile.user_id == inv.donor_id).first() if donor else None
    requester = db.query(User).filter(User.id == req.requester_id).first()

    app_link = f"{base_url}/requests/{req.id}"
    recipient_phone: Optional[str] = None
    contact_shared = bool(inv.contact_shared)

    # If contact sharing has been consented and user is the requester, provide the donor's contact
    if contact_shared and user.id == req.requester_id and donor_profile and donor_profile.phone:
        recipient_phone = donor_profile.phone

    if inv.status == InvitationStatus.ACCEPTED:
        # Message for accepted coordination
        if contact_shared and donor_profile and donor_profile.phone:
            contact_line = f"Donor Phone: {donor_profile.phone} (Shared with donor's consent)"
        else:
            contact_line = "Contact details remain private in-app until mutual confirmation."

        if channel == NotificationChannel.WHATSAPP:
            message = (
                f"✅ *BloodBuddy Donation Coordination Update*\n\n"
                f"Donor *{donor.display_name if donor else 'Registered Donor'}* has accepted the invitation for "
                f"*{req.blood_group.value}* blood at *{req.hospital_name}*, {req.city}.\n\n"
                f"{contact_line}\n"
                f"Request Reference: #{req.id[:8]}\n"
                f"Coordination Link: {app_link}\n\n"
                f"_(Demo Message: Please reach out directly to coordinate hospital arrival.)_"
            )
        else:
            message = (
                f"BloodBuddy: Donor {donor.display_name if donor else 'Donor'} accepted {req.blood_group.value} "
                f"request at {req.hospital_name}. {contact_line} Details: {app_link}"
            )
    else:
        # Message for initial invitation / notification
        if channel == NotificationChannel.WHATSAPP:
            message = (
                f"🩸 *BloodBuddy Donation Invitation*\n\n"
                f"Hello{f' {donor.display_name}' if donor else ''},\n"
                f"You have been invited to help coordinate a donation for *{req.units_requested} unit(s)* of "
                f"*{req.blood_group.value}* blood at *{req.hospital_name}*, {req.city}.\n\n"
                f"Please review and accept or decline on your BloodBuddy dashboard:\n{app_link}\n\n"
                f"_(Your contact information will NEVER be shared unless you explicitly click Accept.)_"
            )
        else:
            message = (
                f"BloodBuddy: You have a new donation invite for {req.blood_group.value} at "
                f"{req.hospital_name}. Review & respond safely: {app_link}"
            )

    # Form target WhatsApp URL: if phone consented, prefill wa.me/phone, otherwise wa.me/?text=...
    if channel == NotificationChannel.WHATSAPP:
        clean_phone = "".join(filter(str.isdigit, recipient_phone)) if recipient_phone else ""
        if clean_phone:
            share_url = f"https://wa.me/{clean_phone}?text={urllib.parse.quote(message)}"
        else:
            share_url = f"https://wa.me/?text={urllib.parse.quote(message)}"
    else:
        share_url = f"sms:{recipient_phone or ''}?body={urllib.parse.quote(message)}"

    return NotificationPreviewResponse(
        channel=channel,
        message=message,
        share_url=share_url,
        recipient_phone=recipient_phone,
        contact_shared=contact_shared,
        is_demo_mode=True,
        disclaimer=DEMO_DISCLAIMER,
        provider_status="demo_manual",
    )
