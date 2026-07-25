from mail.client import GmailClient
from mail.parser import GmailParser
from mail.settings import TRANSACTION_SENDER_EMAIL

USER_ID = "cms05j0by0000r87z2c39ijvv"


def main():
    client = GmailClient()
    query = f"from:{TRANSACTION_SENDER_EMAIL}"

    response = client.list_messages(
        USER_ID,
        query=query,
        max_results=10,
    )

    messages = response.get("messages", [])

    if not messages:
        print(f"No messages found for Gmail query: {query}")
        print("Raw Gmail response:", response)
        return

    message = client.get_message(
        USER_ID,
        messages[0]["id"],
    )

    parsed = GmailParser.parse(message)

    print(parsed)


if __name__ == "__main__":
    main()
