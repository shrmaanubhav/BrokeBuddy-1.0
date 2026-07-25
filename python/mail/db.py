from dotenv import load_dotenv
import os
import psycopg

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not found.")

def get_connection():
    return psycopg.connect(DATABASE_URL)