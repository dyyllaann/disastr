import os
from google import genai
from app.models import ParsedNWSReport
from typing import Optional

async def parse_nws_report(description: str, instruction: str) -> Optional[ParsedNWSReport]:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key or api_key == "your_gemini_api_key_here":
        return None
        
    client = genai.Client()
        
    prompt = f"""
    You are an emergency response AI. Extract actionable insights from the following NWS Flood Alert.
    
    DESCRIPTION:
    {description}
    
    INSTRUCTIONS:
    {instruction}
    """
    
    try:
        response = await client.aio.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config={
                'response_mime_type': 'application/json',
                'response_schema': ParsedNWSReport,
            },
        )
        return response.parsed
    except Exception as e:
        import traceback
        print(f"Error parsing AI report: {e}")
        traceback.print_exc()
        return None
