from mail.client import GmailClient
from mail.parser import GmailParser

USER_ID = "cms01v9d300004w5tljgny9bc"


def main():
    client = GmailClient()

    response = client.list_messages(
        USER_ID,
        max_results=1,
    )

    message = client.get_message(
        USER_ID,
        response["messages"][0]["id"],
    )

    parsed = GmailParser.parse(message)

    print(parsed)


if __name__ == "__main__":
    main()