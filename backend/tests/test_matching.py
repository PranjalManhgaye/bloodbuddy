from app.matching import haversine_km, is_compatible_donor
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
