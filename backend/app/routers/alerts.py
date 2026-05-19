import httpx
from fastapi import APIRouter
# pyrefly: ignore [missing-import]
from motor.motor_asyncio import AsyncIOMotorClient
import os
import urllib.parse
import time
from app.models import EnrichedAlert, ParsedNWSReport
from app.services.ai_parser import parse_nws_report

router = APIRouter()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB = os.getenv("MONGO_DB", "flood_response")

client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=2000)
db = client[MONGO_DB]

# We use two collections: 
# 1. system_cache: caches the entire API response array so page loads are instant.
# 2. alerts_cache: caches individual AI summaries so we never re-parse the same alert twice.
system_cache = db.system_cache  
alerts_cache = db.alerts_cache

# Graceful fallback in-memory cache if MongoDB is offline
MEMORY_CACHE = {"wa_alerts": None, "timestamp": 0}
CACHE_TTL = 900  # 15 minutes

@router.get("/weather-alerts")
async def get_weather_alerts(area: str = "WA"):
    current_time = time.time()
    
    # 1. Try to get fully assembled alerts from Cache (Database or Memory)
    cached_payload = None
    try:
        doc = await system_cache.find_one({"_id": f"alerts_{area}_v2"})
        if doc and (current_time - doc.get("timestamp", 0)) < CACHE_TTL:
            cached_payload = doc.get("data")
    except Exception:
        if MEMORY_CACHE.get("wa_alerts_v2") and (current_time - MEMORY_CACHE.get("timestamp_v2", 0)) < CACHE_TTL:
            cached_payload = MEMORY_CACHE["wa_alerts_v2"]
            
    # If we have a valid cache, return it immediately! No NWS fetch, no AI parsing.
    if cached_payload is not None:
        return cached_payload

    # 2. Cache MISS: We must fetch live data from NWS
    async with httpx.AsyncClient() as http_client:
        res = await http_client.get(
            f"https://api.weather.gov/alerts/active?area={urllib.parse.quote(area)}",
            headers={"Accept": "application/geo+json"}
        )
        res.raise_for_status()
        data = res.json()
        
    enriched_alerts = []
    
    # 3. Process each alert
    for feature in data.get("features", []):
        props = feature.get("properties", {})
        alert_id = props.get("id")
        
        description = props.get("description", "")
        instruction = props.get("instruction", "")
        
        ai_analysis = None
        
        # Check if we ALREADY parsed this specific alert ID in the past
        try:
            ai_doc = await alerts_cache.find_one({"_id": alert_id})
            if ai_doc and "ai_analysis" in ai_doc:
                ai_analysis = ParsedNWSReport(**ai_doc["ai_analysis"])
        except Exception:
            pass
            
        # If not parsed yet, run the AI agent now
        if not ai_analysis and (description or instruction):
            ai_analysis = await parse_nws_report(description, instruction)
            if ai_analysis:
                try:
                    await alerts_cache.update_one(
                        {"_id": alert_id},
                        {"$set": {"ai_analysis": ai_analysis.model_dump()}},
                        upsert=True
                    )
                except Exception:
                    pass
                    
        enriched_alerts.append(EnrichedAlert(
            id=alert_id,
            event=props.get("event", ""),
            severity=props.get("severity", ""),
            urgency=props.get("urgency", ""),
            headline=props.get("headline", props.get("event", "")),
            description=description,
            instruction=instruction,
            areaDesc=props.get("areaDesc", ""),
            geometry=feature.get("geometry"),
            ai_analysis=ai_analysis
        ).model_dump())
        
    # 4. Store the entire assembled payload back into the DB (or memory)
    try:
        await system_cache.update_one(
            {"_id": f"alerts_{area}_v2"},
            {"$set": {"data": enriched_alerts, "timestamp": current_time}},
            upsert=True
        )
    except Exception:
        MEMORY_CACHE["wa_alerts_v2"] = enriched_alerts
        MEMORY_CACHE["timestamp_v2"] = current_time
        
    return enriched_alerts
