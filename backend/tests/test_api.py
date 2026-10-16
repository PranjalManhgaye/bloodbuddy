import io
import pytest


def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"


def test_demo_login(client):
    resp = client.post("/api/auth/demo-login", json={"email": "requester@demo.bloodbuddy", "password": "demo123"})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["role"] == "requester"


def test_invalid_login(client):
    resp = client.post("/api/auth/demo-login", json={"email": "bad@email.com", "password": "wrong"})
    assert resp.status_code == 401


def test_profile(client, requester_token):
    resp = client.get("/api/profile", headers={"Authorization": f"Bearer {requester_token}"})
    assert resp.status_code == 200
    assert resp.json()["display_name"] == "Priya Sharma"


def test_create_request_without_consent(client, requester_token):
    resp = client.post(
        "/api/requests",
        headers={"Authorization": f"Bearer {requester_token}"},
        json={
            "blood_group": "O+",
            "units_requested": 2,
            "hospital_name": "Test Hospital",
            "city": "Gwalior",
            "consent_confirmed": False,
        },
    )
    assert resp.status_code == 422


def test_create_request(client, requester_token):
    resp = client.post(
        "/api/requests",
        headers={"Authorization": f"Bearer {requester_token}"},
        json={
            "blood_group": "O+",
            "units_requested": 2,
            "hospital_name": "Test Hospital",
            "city": "Gwalior",
            "urgency": "urgent",
            "consent_confirmed": True,
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "matching"
    assert data["blood_group"] == "O+"


def test_donor_matching(client, requester_token):
    create_resp = client.post(
        "/api/requests",
        headers={"Authorization": f"Bearer {requester_token}"},
        json={
            "blood_group": "O+",
            "units_requested": 1,
            "hospital_name": "City Hospital",
            "city": "Gwalior",
            "consent_confirmed": True,
        },
    )
    request_id = create_resp.json()["id"]
    resp = client.get(
        f"/api/requests/{request_id}/matches",
        headers={"Authorization": f"Bearer {requester_token}"},
    )
    assert resp.status_code == 200
    matches = resp.json()
    assert len(matches) >= 1
    assert all(m["blood_group"] == "O+" for m in matches)


def test_ai_extraction_demo(client, requester_token):
    file_content = b"sample blood request document"
    resp = client.post(
        "/api/requests/extract-document",
        headers={"Authorization": f"Bearer {requester_token}"},
        files={"file": ("sample_blood_request.png", io.BytesIO(file_content), "image/png")},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["provider"] == "demo"
    assert data["needs_confirmation"] is True
    assert data["confirmed"] is False
    assert data["extracted_data"]["blood_group"] == "O+"


def test_ai_extraction_unconfirmed_request_blocked(client, requester_token):
    file_content = b"sample"
    extract_resp = client.post(
        "/api/requests/extract-document",
        headers={"Authorization": f"Bearer {requester_token}"},
        files={"file": ("sample_blood_request.png", io.BytesIO(file_content), "image/png")},
    )
    extraction_id = extract_resp.json()["id"]

    resp = client.post(
        "/api/requests",
        headers={"Authorization": f"Bearer {requester_token}"},
        json={
            "blood_group": "O+",
            "units_requested": 2,
            "hospital_name": "City General Hospital",
            "city": "Gwalior",
            "consent_confirmed": True,
            "ai_extraction_id": extraction_id,
            "confirmed_from_ai": True,
        },
    )
    assert resp.status_code == 400


def test_ai_extraction_confirmed_flow(client, requester_token):
    file_content = b"sample"
    extract_resp = client.post(
        "/api/requests/extract-document",
        headers={"Authorization": f"Bearer {requester_token}"},
        files={"file": ("sample_blood_request.png", io.BytesIO(file_content), "image/png")},
    )
    extraction_id = extract_resp.json()["id"]

    confirm_resp = client.post(
        f"/api/requests/extractions/{extraction_id}/confirm",
        headers={"Authorization": f"Bearer {requester_token}"},
    )
    assert confirm_resp.status_code == 200
    assert confirm_resp.json()["confirmed"] is True

    resp = client.post(
        "/api/requests",
        headers={"Authorization": f"Bearer {requester_token}"},
        json={
            "blood_group": "O+",
            "units_requested": 2,
            "hospital_name": "City General Hospital",
            "city": "Gwalior",
            "consent_confirmed": True,
            "ai_extraction_id": extraction_id,
            "confirmed_from_ai": True,
        },
    )
    assert resp.status_code == 201


def test_invitation_flow(client, requester_token, donor_token):
    create_resp = client.post(
        "/api/requests",
        headers={"Authorization": f"Bearer {requester_token}"},
        json={
            "blood_group": "O+",
            "units_requested": 1,
            "hospital_name": "Test Hospital",
            "city": "Gwalior",
            "consent_confirmed": True,
        },
    )
    request_id = create_resp.json()["id"]

    inv_resp = client.post(
        f"/api/requests/{request_id}/invitations",
        headers={"Authorization": f"Bearer {requester_token}"},
        json={"donor_id": "user-donor-1"},
    )
    assert inv_resp.status_code == 201
    invitation_id = inv_resp.json()["id"]

    accept_resp = client.patch(
        f"/api/invitations/{invitation_id}",
        headers={"Authorization": f"Bearer {donor_token}"},
        json={"status": "accepted", "share_contact": True},
    )
    assert accept_resp.status_code == 200
    assert accept_resp.json()["status"] == "accepted"

    tracking = client.get(
        f"/api/requests/{request_id}/tracking",
        headers={"Authorization": f"Bearer {requester_token}"},
    )
    assert tracking.status_code == 200
    assert tracking.json()["response_summary"]["accepted"] == 1


def test_duplicate_invitation(client, requester_token):
    create_resp = client.post(
        "/api/requests",
        headers={"Authorization": f"Bearer {requester_token}"},
        json={
            "blood_group": "O+",
            "units_requested": 1,
            "hospital_name": "Test Hospital",
            "city": "Gwalior",
            "consent_confirmed": True,
        },
    )
    request_id = create_resp.json()["id"]

    client.post(
        f"/api/requests/{request_id}/invitations",
        headers={"Authorization": f"Bearer {requester_token}"},
        json={"donor_id": "user-donor-1"},
    )
    dup_resp = client.post(
        f"/api/requests/{request_id}/invitations",
        headers={"Authorization": f"Bearer {requester_token}"},
        json={"donor_id": "user-donor-1"},
    )
    assert dup_resp.status_code == 409


def test_cancel_request(client, requester_token):
    create_resp = client.post(
        "/api/requests",
        headers={"Authorization": f"Bearer {requester_token}"},
        json={
            "blood_group": "A+",
            "units_requested": 1,
            "hospital_name": "Test Hospital",
            "city": "Gwalior",
            "consent_confirmed": True,
        },
    )
    request_id = create_resp.json()["id"]
    resp = client.post(
        f"/api/requests/{request_id}/cancel",
        headers={"Authorization": f"Bearer {requester_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "cancelled"


def test_invalid_upload_type(client, requester_token):
    resp = client.post(
        "/api/requests/extract-document",
        headers={"Authorization": f"Bearer {requester_token}"},
        files={"file": ("test.exe", io.BytesIO(b"bad"), "application/x-msdownload")},
    )
    assert resp.status_code == 400


def test_demo_reset(client, admin_token):
    resp = client.post("/api/demo/reset", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200


def test_demo_stats(client):
    resp = client.get("/api/demo/stats")
    assert resp.status_code == 200
    assert resp.json()["is_demo_data"] is True


def test_unauthorized(client):
    resp = client.get("/api/profile")
    assert resp.status_code == 401
