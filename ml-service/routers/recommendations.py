from fastapi import APIRouter
import pickle, os, sys
from typing import List

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.db import get_db

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "recommender.pkl")

# Load model lazily (won't crash if model not trained yet)
_model = None

def get_model():
    global _model
    if _model is None and os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, "rb") as f:
            _model = pickle.load(f)
    return _model


@router.get("/similar/{dish_id}")
def similar_dishes(dish_id: str, top_k: int = 5):
    """Content-based filtering: dishes similar to the given one"""
    model = get_model()
    if model is None:
        return {"error": "Model not trained yet. Run: python training/train_recommender.py"}

    df  = model["df"]
    sim = model["sim"]

    matches = df[df["id"] == dish_id]
    if matches.empty:
        return {"dish_id": dish_id, "similar": [], "error": "Dish not found in model"}

    idx    = matches.index[0]
    scores = list(enumerate(sim[idx]))
    scores = sorted(scores, key=lambda x: x[1], reverse=True)[1: top_k + 1]
    ids    = [df.iloc[i]["id"] for i, _ in scores]
    return {"dish_id": dish_id, "similar": ids, "scores": [round(float(s), 4) for _, s in scores]}


@router.get("/popular")
def popular_dishes(top_k: int = 6):
    """Popularity-based: highest order count"""
    db = get_db()
    items = list(db.menuitems.find(
        {}, {"_id": 1, "name": 1, "orderCount": 1, "category": 1}
    ).sort("orderCount", -1).limit(top_k))
    return [{"id": str(i["_id"]), "name": i["name"], "category": i.get("category",""), "orderCount": i.get("orderCount", 0)} for i in items]


@router.get("/category/{category}")
def by_category(category: str, top_k: int = 4):
    """Top items in a category by orderCount"""
    db = get_db()
    items = list(db.menuitems.find(
        {"category": category}, {"_id": 1, "name": 1, "orderCount": 1}
    ).sort("orderCount", -1).limit(top_k))
    return [{"id": str(i["_id"]), "name": i["name"], "orderCount": i.get("orderCount", 0)} for i in items]
