from app.matching import find_matching_donors, haversine_km, is_compatible_donor
from app.models import BloodGroup


def test_haversine_same_point():
    assert haversine_km(26.2183, 78.1828, 26.2183, 78.1828) == 0.0


def test_haversine_distance():
    dist = haversine_km(26.2183, 78.1828, 26.4969, 77.9900)
    assert 30 < dist < 40


def test_same_blood_group_match():
    assert is_compatible_donor(BloodGroup.O_POS, BloodGroup.O_POS) is True


def test_different_blood_group_no_match():
    assert is_compatible_donor(BloodGroup.O_POS, BloodGroup.A_POS) is False


def test_find_matching_donors_approximate_coordinates(db_session):
    matches = find_matching_donors(
        db_session,
        blood_group=BloodGroup.O_POS,
        city="Gwalior",
        latitude=26.2183,
        longitude=78.1828,
    )
    assert len(matches) > 0
    for match in matches:
        if match["approximate_latitude"] is not None:
            # Verify coordinates are rounded to at most 2 decimal places
            lat_str = str(match["approximate_latitude"])
            lon_str = str(match["approximate_longitude"])
            if "." in lat_str:
                assert len(lat_str.split(".")[1]) <= 2
            if "." in lon_str:
                assert len(lon_str.split(".")[1]) <= 2


def test_matches_api_returns_approximate_locations(client, requester_token):
    # Create request
    create_resp = client.post(
        "/api/requests",
        headers={"Authorization": f"Bearer {requester_token}"},
        json={
            "blood_group": "O+",
            "units_requested": 1,
            "hospital_name": "Gwalior General Hospital",
            "city": "Gwalior",
            "latitude": 26.2183,
            "longitude": 78.1828,
            "consent_confirmed": True,
        },
    )
    assert create_resp.status_code == 201
    req_id = create_resp.json()["id"]

    # Fetch matches
    matches_resp = client.get(
        f"/api/requests/{req_id}/matches",
        headers={"Authorization": f"Bearer {requester_token}"},
    )
    assert matches_resp.status_code == 200
    matches = matches_resp.json()
    assert len(matches) > 0
    first_match = matches[0]
    assert "approximate_latitude" in first_match
    assert "approximate_longitude" in first_match
    # Exact raw coordinate was 26.2183 or 26.2250 -> rounded to 2 decimal places (26.22 or 26.23)
    assert first_match["approximate_latitude"] in (26.22, 26.23)
