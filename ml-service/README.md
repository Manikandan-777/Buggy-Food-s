# Buggy Foods ML Microservice

AI-powered recommendation engine, demand forecasting, and NLP chatbot for the Buggy Foods restaurant system.

## Quick Start

```bash
# 1. Navigate to ml-service
cd ml-service

# 2. Create virtual environment
python -m venv venv

# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt
python -m spacy download en_core_web_sm

# 4. Configure environment
cp .env.example .env
# Edit .env and set your MONGO_URI

# 5. Train models (run once, re-run as data grows)
python training/train_recommender.py
python training/train_demand.py

# 6. Start the ML service
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The service will be live at: **http://localhost:8000**

API docs available at: **http://localhost:8000/docs** (Swagger UI)

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/recommendations/similar/{id}` | Similar dishes (content-based) |
| GET | `/recommendations/popular` | Most ordered dishes |
| GET | `/predictions/demand/week` | Weekly demand forecast |
| GET | `/predictions/demand/busy-hours` | Busiest slots for a day |
| POST | `/chat/message` | AI chatbot slot-filling |
| GET | `/health` | Health check |

## Notes

- **Models without training data**: All endpoints return sensible mock/fallback data even without trained models — the Express backend also has its own JS fallback chatbot.
- **Re-train regularly**: Run training scripts after every 50+ new bookings for better accuracy.
- **Environment variable**: Make sure `ML_SERVICE_URL=http://localhost:8000` is set in `server/.env`.
