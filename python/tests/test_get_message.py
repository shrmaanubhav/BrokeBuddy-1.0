from mail.client import GmailClient


USER_ID = "cms01v9d300004w5tljgny9bc"


def main():
    client = GmailClient()

    response = client.list_messages(
        USER_ID,
        max_results=1,
    )

    message_id = response["messages"][0]["id"]

    message = client.get_message(USER_ID, message_id)

    print(message)


if __name__ == "__main__":
    main()