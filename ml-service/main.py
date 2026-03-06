from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import recommendations, predictions, chatbot
import os

app = FastAPI(
    title="Buggy Foods ML Service",
    description="AI-powered recommendations, demand prediction, and chatbot for Buggy Foods",
    version="1.0.0"
)

# Allow requests from Express backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("CLIENT_URL", "http://localhost:5000"),
        "http://localhost:5173",   # Vite dev server
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(recommendations.router)
app.include_router(predictions.router)
app.include_router(chatbot.router)

@app.get("/")
def root():
    return {"service": "Buggy Foods ML Service", "status": "running", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "ok"}
