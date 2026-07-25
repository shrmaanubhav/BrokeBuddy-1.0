from .decoder import GmailDecoder


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
            "message_id": message["id"],
            "thread_id": message["threadId"],
            "subject": headers.get("Subject", ""),
            "from": headers.get("From", ""),
            "to": headers.get("To", ""),
            "date": headers.get("Date", ""),
            "snippet": message.get("snippet", ""),
            "body": body,
            "mime_type": payload.get("mimeType", ""),
            "internal_date": message.get("internalDate"),
        }