import os

from dotenv import load_dotenv

load_dotenv()

TRANSACTION_SENDER_EMAIL = os.getenv(
    "TRANSACTION_SENDER_EMAIL",
    "kblalerts@kbl.bank.in",
)
