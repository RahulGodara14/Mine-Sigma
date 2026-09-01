from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import uvicorn

# Load environment variables
load_dotenv()

# Import our application factory
from app.main import create_app

# Create the FastAPI application
app = create_app()

# 1. CORS (Allow Frontend & Cloud Deployments)
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://10.53.9.227:3000",
    "http://10.150.57.227:3000",
    "http://localhost:19006",
    "http://127.0.0.1:19006",
    "http://10.53.9.227:19006",
    "http://10.150.57.227:19006",
]

cors_env = os.getenv("CORS_ORIGINS", "")
if cors_env:
    for o in cors_env.split(","):
        if o.strip():
            origins.append(o.strip())

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|10\..*|.*\.vercel\.app|.*\.onrender\.com|.*\.railway\.app)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
public_path = os.path.join(os.path.dirname(__file__), "public")
os.makedirs(public_path, exist_ok=True)
app.mount("/static", StaticFiles(directory=public_path), name="static")

# Import router
# NOTE: Do not include routers.router here.
# app.main.create_app() already mounts all required routers (AOI, auth, officer, imagery, analysis, and legacy endpoints).

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Satellite Audit Backend Online"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)