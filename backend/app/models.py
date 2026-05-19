from pydantic import BaseModel, Field
from typing import List, Optional, Any

class ParsedNWSReport(BaseModel):
    summary: str = Field(description="A 2-sentence human readable summary of the emergency.")
    action_items: List[str] = Field(description="Bullet points of what residents should do right now.")
    evacuation_routes: List[str] = Field(description="Any roads mentioned as safe or unsafe. Empty if none.")
    expected_peak_time: Optional[str] = Field(description="When the water is expected to crest, if mentioned.")

class EnrichedAlert(BaseModel):
    id: str
    event: str
    severity: str
    urgency: str
    headline: str
    description: str
    instruction: str
    areaDesc: str
    geometry: Optional[Any] = None
    ai_analysis: Optional[ParsedNWSReport] = None
