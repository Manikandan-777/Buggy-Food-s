"""
Train the content-based dish recommender using TF-IDF + cosine similarity.
Run: python training/train_recommender.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import pickle
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from utils.db import get_db
from utils.features import build_content_features

SAVE_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "recommender.pkl")


def train():
    db    = get_db()
    items = list(db.menuitems.find({}, {
        "_id": 1, "name": 1, "category": 1,
        "description": 1, "tags": 1, "isVeg": 1
    }))

    if len(items) < 3:
        print("⚠️  Need at least 3 menu items to train. Add dishes first.")
        return

    df = pd.DataFrame(items)
    df["id"]       = df["_id"].astype(str)
    df["features"] = df.apply(build_content_features, axis=1)

    tfidf  = TfidfVectorizer(stop_words="english", ngram_range=(1, 2), max_features=500)
    matrix = tfidf.fit_transform(df["features"])
    sim    = cosine_similarity(matrix)

    os.makedirs(os.path.dirname(SAVE_PATH), exist_ok=True)
    with open(SAVE_PATH, "wb") as f:
        pickle.dump({"df": df[["id", "name", "category"]], "sim": sim, "tfidf": tfidf}, f)

    print(f"✅ Recommender trained on {len(df)} dishes → {SAVE_PATH}")
    print(f"   Matrix shape: {sim.shape}")


if __name__ == "__main__":
    train()
