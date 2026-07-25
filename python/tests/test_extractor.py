from mail.client import GmailClient
from mail.parser import GmailParser
from mail.extractors.generic import GenericTransactionExtractor

USER_ID = "cms01v9d300004w5tljgny9bc"


def main():
    client = GmailClient()

    response = client.list_messages(USER_ID, max_results=20)

    extractor = GenericTransactionExtractor()

    for msg in response["messages"]:
        email = client.get_message(USER_ID, msg["id"])
        parsed = GmailParser.parse(email)

        transaction = extractor.extract(parsed)

        if transaction.transaction_type:
            print(transaction)
            print("-" * 80)


if __name__ == "__main__":
    main()