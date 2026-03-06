from fastapi import APIRouter
import pickle, os, sys
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

router = APIRouter(prefix="/predictions", tags=["Predictions"])

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "demand_model.pkl")

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

_demand_model = None

def get_demand_model():
    global _demand_model
    if _demand_model is None and os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, "rb") as f:
            _demand_model = pickle.load(f)
    return _demand_model


@router.get("/demand/week")
def predict_week():
    """Predict booking demand for every hour of every day in the next week"""
    model = get_demand_model()
    if model is None:
        # Return mock predictions for demo
        results = {}
        for i, day in enumerate(DAYS):
            results[day] = {}
            for hour in range(12, 22):
                base = 3.5 if i >= 5 else 1.8   # weekends busier
                results[day][f"{hour}:00"] = round(base + np.random.uniform(-0.5, 1.5), 1)
        return {"predictions": results, "source": "mock"}

    results = {}
    for day_idx, day_name in enumerate(DAYS):
        results[day_name] = {}
        for hour in range(12, 22):
            pred = model.predict([[day_idx, hour]])[0]
            results[day_name][f"{hour}:00"] = round(float(pred), 1)
    return {"predictions": results, "source": "ml-model"}


@router.get("/demand/busy-hours")
def busy_hours(day: int = 5):
    """Top-3 busiest hours for a given day (0=Mon, 5=Sat)"""
    model = get_demand_model()

    if model is None:
        return {
            "day": DAYS[day],
            "busiest": [
                {"hour": "20:00", "expected": 4.5},
                {"hour": "19:00", "expected": 3.8},
                {"hour": "21:00", "expected": 3.2},
            ],
            "source": "mock"
        }

    slots = [(h, float(model.predict([[day, h]])[0])) for h in range(12, 22)]
    slots.sort(key=lambda x: x[1], reverse=True)
    return {
        "day": DAYS[day],
        "busiest": [{"hour": f"{h}:00", "expected": round(v, 1)} for h, v in slots[:3]],
        "source": "ml-model"
    }


@router.get("/demand/summary")
def demand_summary():
    """Weekly demand totals per day — useful for bar chart"""
    result = predict_week()
    summary = {}
    for day, hours in result["predictions"].items():
        summary[day] = round(sum(hours.values()), 1)
    return {"summary": summary, "source": result.get("source", "ml-model")}
