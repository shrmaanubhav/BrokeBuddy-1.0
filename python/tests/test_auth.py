from mail.client import GmailClient


USER_ID = "cms01v9d300004w5tljgny9bc"


def main():
    client = GmailClient()

    profile = client.get_profile(USER_ID)

    print(profile)


if __name__ == "__main__":
    main()