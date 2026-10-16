import pytest
from app.models import UserProfile


def test_request_share_message_whatsapp(client, requester_token):
    # 1. Create a blood request
    req_resp = client.post(
        "/api/requests",
        headers={"Authorization": f"Bearer {requester_token}"},
        json={
            "blood_group": "O+",
            "units_requested": 2,
            "hospital_name": "City General Hospital",
            "city": "Gwalior",
            "urgency": "urgent",
            "consent_confirmed": True,
        },
    )
    assert req_resp.status_code == 201
    req_id = req_resp.json()["id"]

    # 2. Get WhatsApp share message
    resp = client.get(f"/api/requests/{req_id}/share-message?channel=whatsapp")
    assert resp.status_code == 200
    data = resp.json()
    assert data["channel"] == "whatsapp"
    assert data["is_demo_mode"] is True
    assert "DEMO MODE" in data["disclaimer"]
    assert "City General Hospital" in data["message"]
    assert "O+" in data["message"]
    assert data["share_url"].startswith("https://wa.me/?text=")
    assert data["recipient_phone"] is None
    assert data["contact_shared"] is False


def test_request_share_message_sms(client, requester_token):
    req_resp = client.post(
        "/api/requests",
        headers={"Authorization": f"Bearer {requester_token}"},
        json={
            "blood_group": "A+",
            "units_requested": 1,
            "hospital_name": "Metro Clinic",
            "city": "Gwalior",
            "urgency": "routine",
            "consent_confirmed": True,
        },
    )
    assert req_resp.status_code == 201
    req_id = req_resp.json()["id"]

    resp = client.get(f"/api/requests/{req_id}/share-message?channel=sms")
    assert resp.status_code == 200
    data = resp.json()
    assert data["channel"] == "sms"
    assert data["share_url"].startswith("sms:?body=")
    assert "Metro Clinic" in data["message"]


def test_invitation_preview_privacy_before_consent(client, requester_token):
    # 1. Create request
    req_resp = client.post(
        "/api/requests",
        headers={"Authorization": f"Bearer {requester_token}"},
        json={
            "blood_group": "O+",
            "units_requested": 2,
            "hospital_name": "City General Hospital",
            "city": "Gwalior",
            "urgency": "urgent",
            "consent_confirmed": True,
        },
    )
    req_id = req_resp.json()["id"]

    # 2. Create invitation for donor 1
    inv_resp = client.post(
        f"/api/requests/{req_id}/invitations",
        headers={"Authorization": f"Bearer {requester_token}"},
        json={"donor_id": "user-donor-1", "message": "Urgent requirement"},
    )
    assert inv_resp.status_code == 201
    inv_id = inv_resp.json()["id"]

    # 3. Preview message as requester (before donor acceptance)
    resp = client.get(
        f"/api/invitations/{inv_id}/preview-message?channel=whatsapp",
        headers={"Authorization": f"Bearer {requester_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["channel"] == "whatsapp"
    assert data["is_demo_mode"] is True
    # Privacy check: recipient phone must be hidden
    assert data["recipient_phone"] is None
    assert data["contact_shared"] is False
    assert "wa.me/?text=" in data["share_url"]


def test_invitation_preview_after_acceptance_with_consent(client, requester_token, donor_token, db_session):
    # 1. Set donor phone number in profile
    profile = db_session.query(UserProfile).filter(UserProfile.user_id == "user-donor-1").first()
    profile.phone = "+91-9876543210"
    profile.share_contact_on_accept = True
    db_session.commit()

    # 2. Create request
    req_resp = client.post(
        "/api/requests",
        headers={"Authorization": f"Bearer {requester_token}"},
        json={
            "blood_group": "O+",
            "units_requested": 2,
            "hospital_name": "City General Hospital",
            "city": "Gwalior",
            "urgency": "urgent",
            "consent_confirmed": True,
        },
    )
    req_id = req_resp.json()["id"]

    # 3. Create invitation
    inv_resp = client.post(
        f"/api/requests/{req_id}/invitations",
        headers={"Authorization": f"Bearer {requester_token}"},
        json={"donor_id": "user-donor-1"},
    )
    inv_id = inv_resp.json()["id"]

    # 4. Donor accepts with share_contact=True
    accept_resp = client.patch(
        f"/api/invitations/{inv_id}",
        headers={"Authorization": f"Bearer {donor_token}"},
        json={"status": "accepted", "share_contact": True},
    )
    assert accept_resp.status_code == 200
    assert accept_resp.json()["contact_shared"] is True

    # 5. Requester previews invitation message
    preview_resp = client.get(
        f"/api/invitations/{inv_id}/preview-message?channel=whatsapp",
        headers={"Authorization": f"Bearer {requester_token}"},
    )
    assert preview_resp.status_code == 200
    data = preview_resp.json()
    assert data["contact_shared"] is True
    assert data["recipient_phone"] == "+91-9876543210"
    assert "919876543210" in data["share_url"]


def test_invitation_preview_unauthorized(client, requester_token, db_session):
    # Create request
    req_resp = client.post(
        "/api/requests",
        headers={"Authorization": f"Bearer {requester_token}"},
        json={
            "blood_group": "O+",
            "units_requested": 2,
            "hospital_name": "City General Hospital",
            "city": "Gwalior",
            "consent_confirmed": True,
        },
    )
    req_id = req_resp.json()["id"]

    # Create invitation for donor 1
    inv_resp = client.post(
        f"/api/requests/{req_id}/invitations",
        headers={"Authorization": f"Bearer {requester_token}"},
        json={"donor_id": "user-donor-1"},
    )
    inv_id = inv_resp.json()["id"]

    # Login as an unrelated donor (donor 2)
    donor2_login = client.post("/api/auth/demo-login", json={"email": "donor2@demo.bloodbuddy", "password": "demo123"})
    donor2_token = donor2_login.json()["access_token"]

    # Attempt to preview donor 1's invitation
    resp = client.get(
        f"/api/invitations/{inv_id}/preview-message",
        headers={"Authorization": f"Bearer {donor2_token}"},
    )
    assert resp.status_code == 403
    assert "Not authorized" in resp.json()["detail"]


def test_preview_not_found(client, requester_token):
    resp = client.get(
        "/api/invitations/nonexistent-id/preview-message",
        headers={"Authorization": f"Bearer {requester_token}"},
    )
    assert resp.status_code == 404

    share_resp = client.get("/api/requests/nonexistent-id/share-message")
    assert share_resp.status_code == 404
