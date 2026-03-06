from datetime import datetime


def extract_booking_features(booking: dict) -> dict:
    """Convert a booking document into ML feature vector"""
    try:
        dt = datetime.strptime(booking["date"], "%Y-%m-%d")
    except Exception:
        dt = datetime.now()
    time_str = booking.get("time", "12:00")
    try:
        hour = int(time_str.split(":")[0])
    except Exception:
        hour = 12

    return {
        "day_of_week":  dt.weekday(),           # 0=Mon, 6=Sun
        "month":        dt.month,
        "day_of_month": dt.day,
        "is_weekend":   int(dt.weekday() >= 5),
        "hour":         hour,
        "guests":       booking.get("guests", 2),
    }


def build_content_features(item: dict) -> str:
    """Combine menu item fields into a TF-IDF-friendly string"""
    tags    = " ".join(item.get("tags", []))
    veg     = "vegetarian" if item.get("isVeg", True) else "non-vegetarian"
    cat     = item.get("category", "")
    desc    = item.get("description", "")
    return f"{cat} {desc} {tags} {veg}"
