import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

_client = None

def get_db():
    global _client
    if _client is None:
        uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/restaurant_db")
        _client = MongoClient(uri)
    db_name = os.getenv("MONGO_URI", "restaurant_db").split("/")[-1].split("?")[0]
    return _client[db_name]
