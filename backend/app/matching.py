import math
from typing import Optional
from sqlalchemy.orm import Session

from app.models import (
    AvailabilityStatus, BloodGroup, User, UserProfile, UserRole,
)


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def is_compatible_donor(requested: BloodGroup, donor: BloodGroup) -> bool:
    """Same-blood-group matching for coordination purposes only."""
    return requested == donor


def find_matching_donors(
    db: Session,
    blood_group: BloodGroup,
    city: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    exclude_user_id: Optional[str] = None,
) -> list[dict]:
    query = (
        db.query(User, UserProfile)
        .join(UserProfile, User.id == UserProfile.user_id)
        .filter(User.role == UserRole.DONOR)
        .filter(UserProfile.blood_group == blood_group)
        .filter(UserProfile.availability != AvailabilityStatus.UNAVAILABLE)
    )
    if exclude_user_id:
        query = query.filter(User.id != exclude_user_id)

    results = []
    for user, profile in query.all():
        distance_km = None
        if latitude and longitude and profile.latitude and profile.longitude:
            distance_km = round(haversine_km(latitude, longitude, profile.latitude, profile.longitude), 1)

        results.append({
            "donor_id": user.id,
            "display_name": user.display_name,
            "blood_group": profile.blood_group,
            "city": profile.city,
            "distance_km": distance_km,
            "availability": profile.availability,
            "match_type": "same_blood_group",
        })

    results.sort(key=lambda d: (d["distance_km"] is None, d["distance_km"] or 9999))
    return results
