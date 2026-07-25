from datetime import datetime, timedelta
import email

from .client import GmailClient
from .parser import parse_email
from .aggregator import TransactionAggregator
from config.settings import GMAIL_EMAIL, GMAIL_APP_PASSWORD


def get_transactions(
    recipient: str,
    start_date: str,
    end_date: str | None = None,
):
    if end_date is None:
        end_date = (
            datetime.today() + timedelta(days=1)
        ).strftime("%-d-%b-%Y")

    client = GmailClient(
        GMAIL_EMAIL,
        GMAIL_APP_PASSWORD,
    )

    client.connect()

    try:
        email_ids = client.fetch_email_ids(
            recipient,
            start_date,
            end_date,
        )

        mail_data = client.fetch_messages(email_ids)

        aggregator = TransactionAggregator()
        seen = set()

        for item in mail_data:

            if not isinstance(item, tuple):
                continue

            msg = email.message_from_bytes(item[1])

            transaction = parse_email(msg)

            if not transaction:
                continue

            txn_id = transaction["transaction_id"]

            if txn_id in seen:
                continue

            seen.add(txn_id)

            aggregator.add(transaction)

        return aggregator.summary()

    finally:
        client.close()