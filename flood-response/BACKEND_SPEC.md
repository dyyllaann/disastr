# Backend Specification — Flood Response Platform

> This document is intended for a second agent or developer building the Python/FastAPI service.
> The frontend (`flood-response/`) is already scaffolded and mocks every endpoint listed here via MSW.

---

## Service overview

| Property | Value |
|---|---|
| Runtime | Python 3.12+ |
| Framework | FastAPI |
| Database | MongoDB (Motor async driver) |
| SMS / Voice | Twilio Programmable Messaging + Voice |
| Weather data | NOAA Weather API + NOAA Flood Inundation Mapping |
| Geocoding | Google Maps Geocoding API |
| Task queue | Celery + Redis (or APScheduler for the NOAA polling job) |

---

## Environment variables (backend)

```ini
# MongoDB
MONGO_URI=mongodb://localhost:27017
MONGO_DB=flood_response

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15550001234
TWILIO_WEBHOOK_BASE_URL=https://your-domain.com

# Google
GOOGLE_MAPS_API_KEY=AIzaSy...

# NOAA
NOAA_API_BASE=https://api.weather.gov
NOAA_FLOOD_API_BASE=https://waterservices.usgs.gov/nwis

# Security
SECRET_KEY=change_me_to_a_long_random_string
ALLOWED_ORIGINS=http://localhost:5173,https://your-frontend.com

# Rate limiting
RATE_LIMIT_WINDOW_SECONDS=600
RATE_LIMIT_MAX_TICKETS=5
FLAG_THRESHOLD=5
```

---

## MongoDB schema

### Collection: `tickets`

```js
{
  _id: ObjectId,                        // internal
  id: string,                           // exposed to frontend (UUID v4)
  createdAt: ISODate,
  status: "active" | "pending" | "resolved",
  classification: "medical" | "hazard" | "food_water" | "transportation" | "other",
  location: {
    lat: double,
    lng: double,
    source: "gps" | "sms_geocoded" | "landline_lookup"
  },
  reporter: {
    channel: "smartphone" | "dumbphone" | "landline",
    contactHash: string                 // SHA-256 of E.164 phone number — never store raw PII
  },
  message: string,
  verifiedBy: [string],                 // moderator user IDs
  flaggedCount: int,
  hidden: bool,                         // set true when flaggedCount >= FLAG_THRESHOLD
  twilioMessageSid: string | null       // for deduplication
}
```

Indexes:
- `{ status: 1 }`
- `{ "location.lat": 1, "location.lng": 1 }` (2d sphere index for geo queries)
- `{ createdAt: -1 }`
- `{ "reporter.contactHash": 1, createdAt: -1 }` (rate-limit lookups)

### Collection: `subscriptions`

```js
{
  _id: ObjectId,
  id: string,                           // UUID v4
  phoneNumber: string,                  // E.164, encrypted at rest
  contactHash: string,                  // SHA-256 for lookups without decrypting
  optIn: bool,
  alertChannels: ["sms" | "voice" | "push"],
  region: {                             // GeoJSON polygon OR zip code array
    type: "Polygon",
    coordinates: [[[lng, lat]]]
  } | string[],
  createdAt: ISODate
}
```

---

## REST API

Base path: `/api`

All responses are `application/json`. Errors follow `{ "detail": "..." }`.

### Tickets

#### `GET /api/tickets`

Query params:
- `status` — filter by status value
- `bbox` — `minLng,minLat,maxLng,maxLat`

Returns `Ticket[]`. Excludes hidden tickets for non-moderator requests.

#### `GET /api/tickets/:id`

Returns single `Ticket` or 404.

#### `POST /api/tickets`

Body: `CreateTicketPayload` (see frontend types).

Rate-limit check: count tickets by `reporter.contactHash` in the last `RATE_LIMIT_WINDOW_SECONDS`.
Return 429 if count >= `RATE_LIMIT_MAX_TICKETS`.

Sets `status = "pending"` by default (requires moderator approval to go `"active"`).

Returns created `Ticket` with 201.

#### `POST /api/tickets/:id/flag`

Increments `flaggedCount`.
If `flaggedCount >= FLAG_THRESHOLD`: sets `hidden = true`, `status = "pending"`, and enqueues a moderator-review notification.
Returns updated `Ticket`.

#### `POST /api/tickets/:id/resolve`

Sets `status = "resolved"`.
Requires `X-Moderator-Token` header (stub: accept any non-empty value for the prototype).
Returns updated `Ticket`.

### Subscriptions

#### `POST /api/subscriptions`

Validates E.164 phone format.
Stores `phoneNumber` encrypted at rest; stores `contactHash` (SHA-256) for lookups.
Returns created `Subscription` with 201.

#### `DELETE /api/subscriptions/:id`

Soft-deletes (sets `optIn = false`) or hard-deletes. Returns 204.

---

## Twilio webhook handlers

### `POST /webhooks/twilio/sms/inbound`

Triggered by Twilio when a subscriber replies to an alert SMS.

1. Validate Twilio signature (`X-Twilio-Signature` header + `TWILIO_AUTH_TOKEN`).
2. Parse `From`, `Body`, `FromCity`, `FromState` from the Twilio POST body.
3. Classify the message body with a keyword matcher (stub: regex; upgrade to NLP later).
   - Keywords → classification map:
     - medical, hurt, injured, doctor, hospital → `"medical"`
     - gas, wire, hazard, danger → `"hazard"`
     - food, water, hungry, thirsty → `"food_water"`
     - stuck, stranded, car, bus → `"transportation"`
     - default → `"other"`
4. Geocode the subscriber's location:
   - If the `From` number is a mobile number, use Google Geocoding on city/state from Twilio.
   - If it is a landline, use LATA-based lookup (stub: use city centroid).
5. Create a `Ticket` document (status = `"pending"`).
6. Respond with TwiML `<Response><Message>Your report was received. Reply STOP to unsubscribe.</Message></Response>`.

**Security**: Always verify Twilio signature before processing. Reject requests without a valid signature with 403.

### `POST /webhooks/twilio/voice/inbound`

Triggered when a subscriber calls the Twilio number.

1. Verify Twilio signature.
2. Respond with TwiML to gather a spoken or keypad report:
   ```xml
   <Response>
     <Gather input="dtmf speech" action="/webhooks/twilio/voice/gather" method="POST">
       <Say>You have reached the flood response hotline.
            Press 1 for medical, 2 for hazard, 3 for food and water,
            4 for transportation, or say your situation after the tone.</Say>
     </Gather>
   </Response>
   ```

### `POST /webhooks/twilio/voice/gather`

Receives the keypad/speech input, creates a Ticket, responds with confirmation.

### `POST /webhooks/twilio/status`

Twilio delivery status callback. Update `twilioMessageSid` and log delivery failures.

---

## NOAA polling job

Runs every 15 minutes (Celery beat or APScheduler).

### Steps

1. Fetch active NWS flood watches/warnings for the monitored regions:
   ```
   GET https://api.weather.gov/alerts/active?area={STATE}
   ```
2. For each `FloodWatch` or `FloodWarning` alert:
   - Extract affected zone geometry from `geometry` field.
   - Compare against subscriptions whose `region` overlaps.
3. For each matching subscriber:
   - Send SMS via Twilio if `"sms"` is in `alertChannels`.
   - Initiate a voice call via Twilio if `"voice"` is in `alertChannels`.
4. Log sent messages to avoid duplicate alerts within the same event window.

### USGS stream gauge integration (stub)

```
GET https://waterservices.usgs.gov/nwis/iv/?format=json&sites={GAUGE_IDs}&parameterCd=00065
```

Poll gauge readings every 10 minutes. If `value > flood_stage`, create a system-generated `Ticket` with `classification = "hazard"` and `reporter.channel = "smartphone"` (source = automated).

---

## Moderator review queue

Endpoint: `GET /api/admin/queue` (moderator-auth required)

Returns tickets with `status = "pending"`, sorted by `flaggedCount DESC, createdAt ASC`.

Moderator actions:
- `POST /api/tickets/:id/approve` — sets `status = "active"`, adds mod ID to `verifiedBy`.
- `POST /api/tickets/:id/resolve` — sets `status = "resolved"`.
- `POST /api/tickets/:id/flag` — adds flag; sets `hidden = true` if threshold exceeded.

---

## Abuse mitigation

| Mechanism | Description |
|---|---|
| Rate limiting | Per `contactHash`: max 5 new tickets per 10 min. Return 429 with Retry-After header. |
| Signature validation | All Twilio webhooks must pass `RequestValidator` check. |
| Duplicate clustering | On ticket creation, check for existing active tickets within 150 m. If found, link rather than create. |
| Flag threshold | `flaggedCount >= FLAG_THRESHOLD` → hidden from public map, moved to mod queue. |
| Moderator review | Default status is `"pending"`; frontend map shows `"active"` only by default. |
| Phone number hashing | Raw phone numbers never stored in the tickets collection; only SHA-256 hash. |

---

## FastAPI project layout (suggested)

```
backend/
  app/
    main.py               FastAPI app factory, CORS, lifespan
    routers/
      tickets.py
      subscriptions.py
      admin.py
    webhooks/
      twilio_sms.py
      twilio_voice.py
    services/
      classifier.py       Keyword-to-classification mapper
      geocoder.py         Google Maps wrapper
      notifier.py         Twilio send helpers
      noaa.py             NOAA + USGS polling
    models/
      ticket.py           Pydantic models
      subscription.py
    db/
      mongo.py            Motor client singleton
    core/
      config.py           Pydantic Settings from env vars
      security.py         Twilio signature validation, phone hashing
  tests/
  .env                    Never commit — see .env.example above
  requirements.txt
  Dockerfile
```

---

## Integration points for the frontend

The frontend reads `VITE_API_BASE_URL`. In production, set this to the FastAPI service URL (e.g., `https://api.floodresponse.example.com`). CORS must allow the frontend origin.

MSW mocks in `src/api/handlers.ts` mirror this spec exactly — no frontend changes needed when the real backend is ready.
