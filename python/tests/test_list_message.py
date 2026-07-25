from mail.client import GmailClient

USER_ID = "cms01v9d300004w5tljgny9bc"


def main():
    client = GmailClient()

    response = client.list_messages(
        USER_ID,
        max_results=5,
    )

    print(response)


if __name__ == "__main__":
    main()