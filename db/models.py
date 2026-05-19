"""
Pydantic v2 models for the Flood Response Platform.
Used by the FastAPI + Motor (async MongoDB) backend.

Collections:
  - tickets         Core flood report tickets
  - subscriptions   SMS/voice/push alert opt-ins
  - moderators      Staff accounts for ticket review
  - audit_log       Immutable record of every moderator action
  - weather_alerts  Cache of active NWS alert polygons
  - guidance        Flood preparedness content (supports i18n)
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Annotated, Literal, Optional, Union

from pydantic import BaseModel, Field, field_validator, model_validator


# ─── Helpers ──────────────────────────────────────────────────────────────────

def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def new_id() -> str:
    return str(uuid.uuid4())


# ─── Enums ────────────────────────────────────────────────────────────────────

class Classification(str, Enum):
    medical = "medical"
    hazard = "hazard"
    food_water = "food_water"
    transportation = "transportation"
    other = "other"


class TicketStatus(str, Enum):
    active = "active"
    pending = "pending"
    resolved = "resolved"


class ReporterChannel(str, Enum):
    smartphone = "smartphone"
    dumbphone = "dumbphone"
    landline = "landline"


class LocationSource(str, Enum):
    gps = "gps"
    sms_geocoded = "sms_geocoded"
    landline_lookup = "landline_lookup"


class AlertChannel(str, Enum):
    sms = "sms"
    voice = "voice"
    push = "push"


class AlertSeverity(str, Enum):
    extreme = "Extreme"
    severe = "Severe"
    moderate = "Moderate"
    minor = "Minor"
    unknown = "Unknown"


class GuidancePhase(str, Enum):
    before = "before"
    during = "during"
    after = "after"


class AuditAction(str, Enum):
    verify = "verify"
    resolve = "resolve"
    flag = "flag"
    hide = "hide"
    restore = "restore"


# ─── Geospatial ───────────────────────────────────────────────────────────────

class GeoPoint(BaseModel):
    """GeoJSON Point — used for 2dsphere indexing on ticket locations."""
    type: Literal["Point"] = "Point"
    # MongoDB convention: [longitude, latitude]
    coordinates: Annotated[list[float], Field(min_length=2, max_length=2)]

    @field_validator("coordinates")
    @classmethod
    def validate_coordinates(cls, v: list[float]) -> list[float]:
        lng, lat = v
        if not (-180 <= lng <= 180):
            raise ValueError(f"Longitude {lng} is out of range [-180, 180]")
        if not (-90 <= lat <= 90):
            raise ValueError(f"Latitude {lat} is out of range [-90, 90]")
        return v


class GeoPolygon(BaseModel):
    """GeoJSON Polygon — used for subscription regions and NWS alert zones."""
    type: Literal["Polygon"] = "Polygon"
    # coordinates[0] is the exterior ring; subsequent rings are holes.
    # Each position is [longitude, latitude].
    coordinates: list[list[list[float]]]


# ─── Tickets ──────────────────────────────────────────────────────────────────

class TicketLocation(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    source: LocationSource
    # Derived GeoJSON point stored alongside lat/lng for 2dsphere queries.
    # Set automatically in model_post_init; do not supply manually.
    point: GeoPoint = Field(default=None)  # type: ignore[assignment]

    def model_post_init(self, __context: object) -> None:
        if self.point is None:
            object.__setattr__(
                self, "point", GeoPoint(coordinates=[self.lng, self.lat])
            )


class TicketReporter(BaseModel):
    channel: ReporterChannel
    # SHA-256 hex digest of the E.164 phone number. Never store the raw number.
    contactHash: Annotated[str, Field(min_length=64, max_length=64)]


class CreateTicketPayload(BaseModel):
    """Shape accepted by POST /api/tickets (mirrors the frontend type)."""
    classification: Classification
    location: TicketLocation
    message: Annotated[str, Field(min_length=1, max_length=500)]
    reporter: TicketReporter


class Ticket(CreateTicketPayload):
    """Full ticket document as stored in MongoDB."""
    id: str = Field(default_factory=new_id)
    createdAt: datetime = Field(default_factory=utcnow)
    status: TicketStatus = TicketStatus.pending
    verifiedBy: list[str] = Field(default_factory=list)  # moderator IDs
    flaggedCount: int = Field(default=0, ge=0)
    # hidden = True when flaggedCount >= FLAG_THRESHOLD; excluded from public map
    hidden: bool = False
    # Twilio message SID used for deduplication of inbound SMS
    twilioMessageSid: Optional[str] = None


class TicketUpdate(BaseModel):
    """Partial update payload used internally (not exposed to frontend)."""
    status: Optional[TicketStatus] = None
    hidden: Optional[bool] = None
    flaggedCount: Optional[int] = None
    verifiedBy: Optional[list[str]] = None


# ─── Subscriptions ────────────────────────────────────────────────────────────

class CreateSubscriptionPayload(BaseModel):
    """Shape accepted by POST /api/subscriptions."""
    # E.164 format, e.g., +12065551234
    phoneNumber: Annotated[str, Field(pattern=r"^\+[1-9]\d{7,14}$")]
    alertChannels: list[AlertChannel] = Field(default_factory=list)
    # GeoJSON polygon OR list of ZIP code strings
    region: Union[GeoPolygon, list[str]]


class Subscription(BaseModel):
    """Full subscription document as stored in MongoDB."""
    id: str = Field(default_factory=new_id)
    # Stored encrypted at rest (AES-256-GCM or equivalent). Decrypt only when
    # sending an outbound message via Twilio.
    phoneNumber: str
    # SHA-256 of the E.164 number — used for lookups without decrypting.
    contactHash: Annotated[str, Field(min_length=64, max_length=64)]
    optIn: bool = True
    alertChannels: list[AlertChannel] = Field(default_factory=list)
    region: Union[GeoPolygon, list[str]]
    createdAt: datetime = Field(default_factory=utcnow)


# ─── Moderators ───────────────────────────────────────────────────────────────

class Moderator(BaseModel):
    """Staff account used for ticket review and resolution."""
    id: str = Field(default_factory=new_id)
    username: Annotated[str, Field(min_length=3, max_length=50)]
    # SHA-256 of the bearer token issued to this moderator.
    # Verify by hashing the incoming X-Moderator-Token header and comparing.
    tokenHash: Annotated[str, Field(min_length=64, max_length=64)]
    active: bool = True
    createdAt: datetime = Field(default_factory=utcnow)


# ─── Audit Log ────────────────────────────────────────────────────────────────

class AuditLog(BaseModel):
    """Immutable record written for every moderator action. Never updated."""
    id: str = Field(default_factory=new_id)
    ticketId: str
    action: AuditAction
    moderatorId: str
    timestamp: datetime = Field(default_factory=utcnow)
    # Optional free-text note (e.g., reason for hiding a ticket)
    notes: Optional[str] = Field(default=None, max_length=500)
    # Snapshot of ticket status before the action (for rollback / review)
    previousStatus: Optional[TicketStatus] = None


# ─── Weather Alerts (NWS cache) ───────────────────────────────────────────────

class WeatherAlert(BaseModel):
    """
    Cached NWS active alert. Populated by the NOAA polling job (Celery /
    APScheduler). Frontend fetches these via GET /api/weather-alerts?area=WA
    instead of hitting NWS directly in production.
    """
    alertId: str  # NWS @id value, e.g. "urn:oid:2.49.0.1.840.0..."
    event: str    # e.g. "Flood Warning"
    severity: AlertSeverity
    headline: str
    areaDesc: str  # human-readable area description
    geometry: Optional[GeoPolygon] = None  # None for county-coded alerts
    effective: datetime
    expires: datetime
    area: str  # FIPS state code, e.g. "WA"
    cachedAt: datetime = Field(default_factory=utcnow)

    @model_validator(mode="after")
    def expires_after_effective(self) -> "WeatherAlert":
        if self.expires <= self.effective:
            raise ValueError("expires must be after effective")
        return self


# ─── Guidance ─────────────────────────────────────────────────────────────────

class GuidanceSection(BaseModel):
    id: str
    phase: GuidancePhase
    title: str
    body: str
    tips: list[str]


class GuidanceContent(BaseModel):
    """
    Flood preparedness content. One document per locale. Seed from
    src/data/guidance.json; update via admin endpoint or direct DB write.
    """
    id: str = Field(default_factory=new_id)
    locale: str = Field(default="en", pattern=r"^[a-z]{2}$")
    lastUpdated: datetime
    sections: list[GuidanceSection]
