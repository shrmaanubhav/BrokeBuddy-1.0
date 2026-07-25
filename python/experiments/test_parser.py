import email

from mail.client import GmailClient
from mail.parser import parse_email
from config.settings import GMAIL_EMAIL, GMAIL_APP_PASSWORD

client = GmailClient(GMAIL_EMAIL, GMAIL_APP_PASSWORD)
client.connect()

try:
    email_ids = client.fetch_email_ids(
        recipient="shrmaanubhav@gmail.com",
        start_date="1-Jul-2026",
        end_date="26-Jul-2026",
    )

    mail_data = client.fetch_messages(email_ids)

    for item in mail_data:
        if not isinstance(item, tuple):
            continue

        msg = email.message_from_bytes(item[1])

        transaction = parse_email(msg)

        if transaction:
            print(transaction)
finally:
    client.close()