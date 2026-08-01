from datetime import datetime, timedelta

from .client import GmailClient
from .parser import parse_email
from .aggregator import TransactionAggregator


def _gmail_date(value: str) -> str:
    parsed = datetime.strptime(value, "%d-%b-%Y")
    return parsed.strftime("%Y/%m/%d")


def get_transactions(
    user_id: str,
    recipient: str,
    start_date: str,
    sender: str,
    end_date: str | None = None,
):
    if end_date is None:
        default_end = datetime.today() + timedelta(days=1)
        end_date = f"{default_end.day}-{default_end.strftime('%b-%Y')}"

    client = GmailClient()
    aggregator = TransactionAggregator()
    seen = set()
    page_token = None

    query = (
        f"from:{sender} "
        f"to:{recipient} "
        f"after:{_gmail_date(start_date)} "
        f"before:{_gmail_date(end_date)}"
    )

    while True:
        response = client.list_messages(
            user_id=user_id,
            query=query,
            max_results=100,
            page_token=page_token,
        )

        for item in response.get("messages", []):
            message = client.get_message(
                user_id=user_id,
                message_id=item["id"],
                fmt="full",
            )

            transaction = parse_email(message)

            if not transaction:
                continue

            txn_id = transaction.transaction_id

            if txn_id in seen:
                continue

            seen.add(txn_id)
            aggregator.add(transaction)

        page_token = response.get("nextPageToken")

        if not page_token:
            break

    return aggregator.summary()
