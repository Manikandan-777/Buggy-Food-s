from fastapi import APIRouter
from pydantic import BaseModel
import re, os, sys
from datetime import datetime, timedelta

router = APIRouter(prefix="/chat", tags=["Chatbot"])

# spaCy + dateparser (optional — falls back to regex if not installed)
try:
    import spacy, dateparser
    _nlp = spacy.load("en_core_web_sm")
    _HAS_SPACY = True
except Exception:
    _nlp = None
    _HAS_SPACY = False


class ChatRequest(BaseModel):
    message: str
    session: dict = {}


REQUIRED = ["date", "time", "guests", "name", "email"]

PROMPTS = {
    "guests": "🍽️ How many guests will be joining?",
    "date":   "📅 What date would you like? (e.g. 'this Saturday', 'tomorrow', '2026-03-15')",
    "time":   "🕐 What time works best? (e.g. '7:30 pm', '8 pm')",
    "name":   "👤 May I have your name for the reservation?",
    "email":  "📧 And your email address to send the confirmation?",
}


def extract_with_spacy(text: str, session: dict) -> dict:
    """Use spacy + dateparser for richer extraction"""
    slots = {}
    doc   = _nlp(text)

    # Guests via regex (even in spacy path)
    m = re.search(r'\b(?:for\s+)?(\d+)\s*(?:guests?|people|persons?|pax)?\b', text, re.I)
    if m and not session.get("guests"):
        slots["guests"] = int(m.group(1))

    # Date / time via dateparser
    parsed = dateparser.parse(text, settings={"PREFER_FUTURE_DATES": True, "RETURN_AS_TIMEZONE_AWARE": False})
    if parsed and not session.get("date"):
        slots["date"] = parsed.strftime("%Y-%m-%d")
        if parsed.hour != 0 and not session.get("time"):
            slots["time"] = parsed.strftime("%H:%M")

    # Name via entity recognition
    for ent in doc.ents:
        if ent.label_ == "PERSON" and not session.get("name"):
            slots["name"] = ent.text

    # Fallback name regex
    if not slots.get("name") and not session.get("name"):
        m = re.search(r"(?:my name is|i'?m|name[:\s]+)\s*([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)", text, re.I)
        if m:
            slots["name"] = m.group(1).strip()

    # Email
    m = re.search(r"[\w.+\-]+@[\w\-]+\.\w+", text)
    if m and not session.get("email"):
        slots["email"] = m.group()

    return slots


def extract_with_regex(text: str, session: dict) -> dict:
    """Pure regex fallback — no external NLP libs needed"""
    slots = {}
    now   = datetime.now()

    # Guests
    m = re.search(r'\b(?:for\s+)?(\d+)\s*(?:guests?|people|persons?|pax)?\b', text, re.I)
    if m and not session.get("guests"):
        slots["guests"] = int(m.group(1))

    # Date keywords
    if not session.get("date"):
        if re.search(r'\btoday\b', text, re.I):
            slots["date"] = now.strftime("%Y-%m-%d")
        elif re.search(r'\btomorrow\b', text, re.I):
            slots["date"] = (now + timedelta(days=1)).strftime("%Y-%m-%d")
        else:
            for day, offset_base in [("monday",0),("tuesday",1),("wednesday",2),("thursday",3),("friday",4),("saturday",5),("sunday",6)]:
                if re.search(rf'\b{day}\b', text, re.I):
                    diff = (offset_base - now.weekday() + 7) % 7 or 7
                    slots["date"] = (now + timedelta(days=diff)).strftime("%Y-%m-%d")
                    break
            if not slots.get("date"):
                m = re.search(r'(\d{4}-\d{2}-\d{2})', text)
                if m:
                    slots["date"] = m.group(1)

    # Time
    if not session.get("time"):
        m = re.search(r'(\d{1,2})[:\.]?(\d{0,2})\s*(am|pm)', text, re.I)
        if m:
            h = int(m.group(1))
            mn = m.group(2).zfill(2) if m.group(2) else "00"
            if 'pm' in m.group(3).lower() and h < 12:
                h += 12
            slots["time"] = f"{h:02d}:{mn}"

    # Name
    if not session.get("name"):
        m = re.search(r"(?:my name is|i'?m|name[:\s]+)\s*([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)", text, re.I)
        if m:
            slots["name"] = m.group(1).strip()

    # Email
    if not session.get("email"):
        m = re.search(r"[\w.+\-]+@[\w\-]+\.\w+", text)
        if m:
            slots["email"] = m.group()

    # Phone
    if not session.get("phone"):
        m = re.search(r'\b[6-9]\d{9}\b', text)
        if m:
            slots["phone"] = m.group()

    return slots


@router.post("/message")
def chat_message(req: ChatRequest):
    session = dict(req.session)
    text    = req.message.strip()

    # Reset if user says start over
    if re.search(r'\b(reset|start over|cancel|restart)\b', text, re.I):
        return {"reply": "No problem! Let's start fresh. 😊 How many guests will be joining?", "session": {}, "done": False}

    # Extract slots
    new_slots = extract_with_spacy(text, session) if _HAS_SPACY else extract_with_regex(text, session)
    session.update(new_slots)

    # Check what's still missing
    missing = [k for k in REQUIRED if not session.get(k)]

    if missing:
        return {"reply": PROMPTS[missing[0]], "session": session, "done": False}

    # All slots filled — complete the booking
    reply = (
        f"✅ Perfect! I've noted a table for **{session['guests']} guest(s)** "
        f"on **{session['date']}** at **{session['time']}** "
        f"under **{session['name']}**. "
        f"Confirming your reservation now and sending details to {session['email']}..."
    )
    return {"reply": reply, "session": session, "done": True, "booking": session}
