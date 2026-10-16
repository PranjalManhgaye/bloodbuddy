import uuid
from sqlalchemy.orm import Session

from app.auth import hash_password
from app.models import (
    AvailabilityStatus, BloodGroup, User, UserProfile, UserRole,
)

DEMO_USERS = [
    {"id": "user-requester-1", "email": "requester@demo.bloodbuddy", "role": UserRole.REQUESTER,
     "display_name": "Priya Sharma", "password": "demo123"},
    {"id": "user-donor-1", "email": "donor1@demo.bloodbuddy", "role": UserRole.DONOR,
     "display_name": "Rahul Verma", "blood_group": BloodGroup.O_POS, "city": "Gwalior",
     "lat": 26.2183, "lon": 78.1828, "availability": AvailabilityStatus.AVAILABLE},
    {"id": "user-donor-2", "email": "donor2@demo.bloodbuddy", "role": UserRole.DONOR,
     "display_name": "Anita Singh", "blood_group": BloodGroup.O_POS, "city": "Gwalior",
     "lat": 26.2250, "lon": 78.1900, "availability": AvailabilityStatus.AVAILABLE},
    {"id": "user-donor-3", "email": "donor3@demo.bloodbuddy", "role": UserRole.DONOR,
     "display_name": "Vikram Patel", "blood_group": BloodGroup.A_POS, "city": "Morena",
     "lat": 26.4969, "lon": 77.9900, "availability": AvailabilityStatus.LIMITED},
    {"id": "user-donor-4", "email": "donor4@demo.bloodbuddy", "role": UserRole.DONOR,
     "display_name": "Sneha Gupta", "blood_group": BloodGroup.B_POS, "city": "Gwalior",
     "lat": 26.2100, "lon": 78.1750, "availability": AvailabilityStatus.AVAILABLE},
    {"id": "user-donor-5", "email": "donor5@demo.bloodbuddy", "role": UserRole.DONOR,
     "display_name": "Amit Kumar", "blood_group": BloodGroup.O_NEG, "city": "Gwalior",
     "lat": 26.2300, "lon": 78.1850, "availability": AvailabilityStatus.UNAVAILABLE},
    {"id": "user-admin-1", "email": "admin@demo.bloodbuddy", "role": UserRole.ADMIN,
     "display_name": "Demo Admin", "password": "demo123"},
]


def seed_demo_data(db: Session) -> None:
    if db.query(User).count() > 0:
        return

    for u in DEMO_USERS:
        user = User(
            id=u["id"],
            email=u["email"],
            password_hash=hash_password(u.get("password", "demo123")),
            role=u["role"],
            display_name=u["display_name"],
        )
        db.add(user)

        profile = UserProfile(
            id=str(uuid.uuid4()),
            user_id=u["id"],
            blood_group=u.get("blood_group"),
            city=u.get("city"),
            latitude=u.get("lat"),
            longitude=u.get("lon"),
            availability=u.get("availability", AvailabilityStatus.AVAILABLE),
            contact_method="in_app",
            share_contact_on_accept=True,
            consent_notifications=True,
        )
        db.add(profile)

    db.commit()


def reset_demo_data(db: Session) -> None:
    from app.models import (
        AIExtraction, BloodRequest, ConsentRecord, DonorInvitation,
        NotificationEvent, RequestStatusHistory,
    )
    db.query(NotificationEvent).delete()
    db.query(ConsentRecord).delete()
    db.query(RequestStatusHistory).delete()
    db.query(DonorInvitation).delete()
    db.query(AIExtraction).delete()
    db.query(BloodRequest).delete()
    db.commit()
