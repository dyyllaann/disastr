"""
Motor (async MongoDB) connection, index initialization, and JSON Schema
validators for the Flood Response Platform.

Usage in FastAPI:
    from db.database import connect_db, close_db, get_db

    app.add_event_handler("startup", connect_db)
    app.add_event_handler("shutdown", close_db)

    @app.get("/api/tickets")
    async def list_tickets(db=Depends(get_db)):
        ...
"""

from __future__ import annotations

import os
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING, IndexModel
from pymongo import GEOSPHERE

# ─── Connection state ─────────────────────────────────────────────────────────

_client: Optional[AsyncIOMotorClient] = None
_db: Optional[AsyncIOMotorDatabase] = None


async def connect_db() -> None:
    global _client, _db
    mongo_uri = os.environ["MONGO_URI"]
    mongo_db = os.environ.get("MONGO_DB", "flood_response")
    _client = AsyncIOMotorClient(mongo_uri)
    _db = _client[mongo_db]
    await _init_indexes()
    await _apply_validators()


async def close_db() -> None:
    if _client is not None:
        _client.close()


def get_db() -> AsyncIOMotorDatabase:
    if _db is None:
        raise RuntimeError("Database not connected. Call connect_db() first.")
    return _db


# ─── Index definitions ────────────────────────────────────────────────────────

async def _init_indexes() -> None:
    db = get_db()

    # ── tickets ──────────────────────────────────────────────────────────────
    await db.tickets.create_indexes([
        # Filter by status (most common query)
        IndexModel([("status", ASCENDING)]),
        # 2dsphere on the GeoJSON point for radius / bbox geo queries
        IndexModel([("location.point", GEOSPHERE)]),
        # Sort by creation time (map & admin views)
        IndexModel([("createdAt", DESCENDING)]),
        # Rate-limit lookups: count recent tickets per contactHash
        IndexModel(
            [("reporter.contactHash", ASCENDING), ("createdAt", DESCENDING)]
        ),
        # Exclude hidden tickets from public queries efficiently
        IndexModel([("hidden", ASCENDING)]),
        # Deduplication on Twilio SID (sparse — not all tickets have a SID)
        IndexModel(
            [("twilioMessageSid", ASCENDING)],
            sparse=True,
            unique=True,
        ),
    ])

    # ── subscriptions ────────────────────────────────────────────────────────
    await db.subscriptions.create_indexes([
        # Unique lookup by hashed phone (used for dedup & opt-out)
        IndexModel([("contactHash", ASCENDING)], unique=True),
        # Filter active subscribers for broadcast jobs
        IndexModel([("optIn", ASCENDING)]),
    ])

    # ── moderators ───────────────────────────────────────────────────────────
    await db.moderators.create_indexes([
        IndexModel([("tokenHash", ASCENDING)], unique=True),
        IndexModel([("username", ASCENDING)], unique=True),
    ])

    # ── audit_log ────────────────────────────────────────────────────────────
    await db.audit_log.create_indexes([
        IndexModel([("ticketId", ASCENDING)]),
        IndexModel([("moderatorId", ASCENDING)]),
        IndexModel([("timestamp", DESCENDING)]),
    ])

    # ── weather_alerts ───────────────────────────────────────────────────────
    await db.weather_alerts.create_indexes([
        # NWS alert IDs are unique; also used for upsert on cache refresh
        IndexModel([("alertId", ASCENDING)], unique=True),
        # Purge expired alerts (or filter them in queries)
        IndexModel([("expires", ASCENDING)]),
        # Scope queries to a single state
        IndexModel([("area", ASCENDING)]),
    ])

    # ── guidance ─────────────────────────────────────────────────────────────
    await db.guidance.create_indexes([
        IndexModel([("locale", ASCENDING)], unique=True),
    ])


# ─── MongoDB JSON Schema validators ──────────────────────────────────────────
#
# Applied via collMod so MongoDB itself rejects malformed documents.
# "warn" mode logs violations without rejecting writes — useful during
# development. Switch to "error" in production.

_VALIDATION_LEVEL = os.environ.get("MONGO_VALIDATION_LEVEL", "warn")  # "warn" | "error"
_VALIDATION_ACTION = os.environ.get("MONGO_VALIDATION_ACTION", "warn")  # "warn" | "error"


async def _apply_validators() -> None:
    db = get_db()
    for name, schema in _VALIDATORS.items():
        # Create collection if it doesn't exist yet
        existing = await db.list_collection_names()
        if name not in existing:
            await db.create_collection(name)
        await db.command({
            "collMod": name,
            "validator": {"$jsonSchema": schema},
            "validationLevel": _VALIDATION_LEVEL,
            "validationAction": _VALIDATION_ACTION,
        })


_VALIDATORS: dict[str, dict] = {

    # ── tickets ──────────────────────────────────────────────────────────────
    "tickets": {
        "bsonType": "object",
        "required": [
            "id", "createdAt", "status", "classification",
            "location", "reporter", "message", "flaggedCount", "hidden",
        ],
        "additionalProperties": True,
        "properties": {
            "id":             {"bsonType": "string"},
            "createdAt":      {"bsonType": "date"},
            "status":         {"enum": ["active", "pending", "resolved"]},
            "classification": {"enum": ["medical", "hazard", "food_water", "transportation", "other"]},
            "location": {
                "bsonType": "object",
                "required": ["lat", "lng", "source", "point"],
                "properties": {
                    "lat":    {"bsonType": "double", "minimum": -90,  "maximum": 90},
                    "lng":    {"bsonType": "double", "minimum": -180, "maximum": 180},
                    "source": {"enum": ["gps", "sms_geocoded", "landline_lookup"]},
                    "point": {
                        "bsonType": "object",
                        "required": ["type", "coordinates"],
                        "properties": {
                            "type":        {"enum": ["Point"]},
                            "coordinates": {"bsonType": "array", "minItems": 2, "maxItems": 2},
                        },
                    },
                },
            },
            "reporter": {
                "bsonType": "object",
                "required": ["channel", "contactHash"],
                "properties": {
                    "channel":     {"enum": ["smartphone", "dumbphone", "landline"]},
                    "contactHash": {"bsonType": "string", "minLength": 64, "maxLength": 64},
                },
            },
            "message":          {"bsonType": "string", "minLength": 1, "maxLength": 500},
            "verifiedBy":       {"bsonType": "array", "items": {"bsonType": "string"}},
            "flaggedCount":     {"bsonType": "int", "minimum": 0},
            "hidden":           {"bsonType": "bool"},
            "twilioMessageSid": {"bsonType": ["string", "null"]},
        },
    },

    # ── subscriptions ────────────────────────────────────────────────────────
    "subscriptions": {
        "bsonType": "object",
        "required": ["id", "phoneNumber", "contactHash", "optIn", "createdAt"],
        "properties": {
            "id":           {"bsonType": "string"},
            "phoneNumber":  {"bsonType": "string"},   # encrypted blob
            "contactHash":  {"bsonType": "string", "minLength": 64, "maxLength": 64},
            "optIn":        {"bsonType": "bool"},
            "alertChannels": {
                "bsonType": "array",
                "items": {"enum": ["sms", "voice", "push"]},
            },
            "region": {},  # GeoJSON Polygon object or string array; validated at app layer
            "createdAt":    {"bsonType": "date"},
        },
    },

    # ── moderators ───────────────────────────────────────────────────────────
    "moderators": {
        "bsonType": "object",
        "required": ["id", "username", "tokenHash", "active", "createdAt"],
        "properties": {
            "id":        {"bsonType": "string"},
            "username":  {"bsonType": "string", "minLength": 3, "maxLength": 50},
            "tokenHash": {"bsonType": "string", "minLength": 64, "maxLength": 64},
            "active":    {"bsonType": "bool"},
            "createdAt": {"bsonType": "date"},
        },
    },

    # ── audit_log ────────────────────────────────────────────────────────────
    "audit_log": {
        "bsonType": "object",
        "required": ["id", "ticketId", "action", "moderatorId", "timestamp"],
        "properties": {
            "id":             {"bsonType": "string"},
            "ticketId":       {"bsonType": "string"},
            "action":         {"enum": ["verify", "resolve", "flag", "hide", "restore"]},
            "moderatorId":    {"bsonType": "string"},
            "timestamp":      {"bsonType": "date"},
            "notes":          {"bsonType": ["string", "null"], "maxLength": 500},
            "previousStatus": {"enum": ["active", "pending", "resolved", None]},
        },
    },

    # ── weather_alerts ───────────────────────────────────────────────────────
    "weather_alerts": {
        "bsonType": "object",
        "required": ["alertId", "event", "severity", "headline", "areaDesc",
                     "effective", "expires", "area", "cachedAt"],
        "properties": {
            "alertId":   {"bsonType": "string"},
            "event":     {"bsonType": "string"},
            "severity":  {"enum": ["Extreme", "Severe", "Moderate", "Minor", "Unknown"]},
            "headline":  {"bsonType": "string"},
            "areaDesc":  {"bsonType": "string"},
            "geometry":  {},   # GeoJSON Polygon or null
            "effective": {"bsonType": "date"},
            "expires":   {"bsonType": "date"},
            "area":      {"bsonType": "string", "minLength": 2, "maxLength": 2},
            "cachedAt":  {"bsonType": "date"},
        },
    },

    # ── guidance ─────────────────────────────────────────────────────────────
    "guidance": {
        "bsonType": "object",
        "required": ["id", "locale", "lastUpdated", "sections"],
        "properties": {
            "id":          {"bsonType": "string"},
            "locale":      {"bsonType": "string", "minLength": 2, "maxLength": 2},
            "lastUpdated": {"bsonType": "date"},
            "sections": {
                "bsonType": "array",
                "items": {
                    "bsonType": "object",
                    "required": ["id", "phase", "title", "body", "tips"],
                    "properties": {
                        "id":    {"bsonType": "string"},
                        "phase": {"enum": ["before", "during", "after"]},
                        "title": {"bsonType": "string"},
                        "body":  {"bsonType": "string"},
                        "tips":  {"bsonType": "array", "items": {"bsonType": "string"}},
                    },
                },
            },
        },
    },
}
