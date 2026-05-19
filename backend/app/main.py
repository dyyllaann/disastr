from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import alerts
from dotenv import load_dotenv

load_dotenv(".env")
load_dotenv(".env.local")
load_dotenv("../flood-response/.env.local")

app = FastAPI(title="Flood Response API")

# Allow the frontend to call the backend locally
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(alerts.router, prefix="/api")

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Flood Response Backend is running."}
