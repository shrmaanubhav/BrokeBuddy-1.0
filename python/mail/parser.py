import re
from datetime import datetime
from email.utils import parsedate_to_datetime

from .decoder import GmailDecoder
from .models import Transaction


TRANSACTION_PATTERN = re.compile(
    r"\b(DEBITED|CREDITED)\s+for\s+Rs\.?\s*"
    r"([\d,]+(?:\.\d{1,2})?)\s+"
    r"(UPI:[^\s]+)",
    re.IGNORECASE,
)


class GmailParser:
    @staticmethod
    def parse(message: dict) -> dict:
        """
        Converts a Gmail API message into a normalized email object.
        """

        payload = message["payload"]

        headers = GmailDecoder.get_headers(payload)

        body = GmailDecoder.extract_body(payload)

        return {
            "message_id": message.get("id", ""),
            "thread_id": message.get("threadId", ""),
            "subject": headers.get("Subject", ""),
            "from": headers.get("From", ""),
            "to": headers.get("To", ""),
            "date": headers.get("Date", ""),
            "snippet": message.get("snippet", ""),
            "body": body,
            "mime_type": payload.get("mimeType", ""),
            "internal_date": message.get("internalDate"),
        }


def parse_email(message: dict) -> Transaction | None:
    email_data = GmailParser.parse(message)
    body = email_data.get("body", "")

    for line in body.splitlines():
        match = TRANSACTION_PATTERN.search(line)

        if not match:
            continue

        transaction_type, amount, upi_token = match.groups()
        parsed_upi = parse_upi_token(upi_token)

        if parsed_upi is None:
            continue

        reference, upi_id = parsed_upi

        return Transaction(
            transaction_type=(
                "debit"
                if transaction_type.upper() == "DEBITED"
                else "credit"
            ),
            amount=float(amount.replace(",", "")),
            transaction_date=format_email_date(email_data),
            upi_reference=reference,
            upi_id=upi_id,
            subject=email_data.get("subject"),
            sender=email_data.get("from"),
        )

    return None


def parse_upi_token(token: str) -> tuple[str, str] | None:
    parts = token.upper().split(":", 2)

    if len(parts) < 3 or parts[0] != "UPI":
        return None

    reference = parts[1]
    upi_id = (
        parts[2]
        .split("(", 1)[0]
        .split("-", 1)[0]
        .strip()
    )

    if not reference or not upi_id:
        return None

    return reference, upi_id


def format_email_date(email_data: dict) -> str:
    date_header = email_data.get("date")

    if date_header:
        try:
            parsed = parsedate_to_datetime(date_header)
            return f"{parsed.day}-{parsed.strftime('%b-%Y')}"
        except (TypeError, ValueError, IndexError):
            pass

    internal_date = email_data.get("internal_date")

    if internal_date:
        try:
            parsed = datetime.fromtimestamp(int(internal_date) / 1000)
            return f"{parsed.day}-{parsed.strftime('%b-%Y')}"
        except (TypeError, ValueError):
            pass

    return ""
