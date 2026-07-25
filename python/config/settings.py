import os
from dotenv import load_dotenv

load_dotenv()

GMAIL_EMAIL = os.getenv("GMAIL_EMAIL")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")

if not GMAIL_EMAIL:
    raise ValueError("GMAIL_EMAIL is not set")

if not GMAIL_APP_PASSWORD:
    raise ValueError("GMAIL_APP_PASSWORD is not set")