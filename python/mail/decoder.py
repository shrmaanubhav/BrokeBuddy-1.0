import base64


class GmailDecoder:
    @staticmethod
    def decode_base64(data: str) -> str:
        """
        Decode Gmail's URL-safe Base64 encoded content.
        """
        if not data:
            return ""

        padding = "=" * (-len(data) % 4)

        return base64.urlsafe_b64decode(
            data + padding
        ).decode("utf-8", errors="ignore")

    @staticmethod
    def get_headers(payload: dict) -> dict:
        """
        Convert Gmail headers list into a dictionary.
        """
        headers = {}

        for header in payload.get("headers", []):
            headers[header["name"]] = header["value"]

        return headers

    @staticmethod
    def extract_body(payload: dict) -> str:
        """
        Extract the email body from a Gmail payload.
        Supports both simple and multipart messages.
        """

        # Simple message
        if payload.get("body", {}).get("data"):
            return GmailDecoder.decode_base64(
                payload["body"]["data"]
            )

        # Multipart message
        for part in payload.get("parts", []):
            if part.get("mimeType") in ("text/plain", "text/html"):
                data = part.get("body", {}).get("data")

                if data:
                    return GmailDecoder.decode_base64(data)

        return ""