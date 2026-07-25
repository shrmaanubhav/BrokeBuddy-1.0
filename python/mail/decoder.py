import base64
import re

try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None


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
    def html_to_text(html: str) -> str:
        if not html:
            return ""

        if BeautifulSoup:
            return BeautifulSoup(
                html,
                "html.parser",
            ).get_text(separator="\n", strip=True)

        text = re.sub(r"(?i)<br\s*/?>|</p>|</div>|</tr>", "\n", html)
        text = re.sub(r"<[^>]+>", "", text)
        return re.sub(r"\n+", "\n", text).strip()

    @staticmethod
    def _extract_parts(payload: dict) -> list[tuple[str, str]]:
        """
        Return decoded body parts from the complete Gmail payload tree.
        """
        parts = []
        mime_type = payload.get("mimeType", "")
        data = payload.get("body", {}).get("data")

        if data:
            parts.append((
                mime_type,
                GmailDecoder.decode_base64(data),
            ))

        for part in payload.get("parts", []):
            parts.extend(GmailDecoder._extract_parts(part))

        return parts

    @staticmethod
    def extract_body(payload: dict) -> str:
        """
        Extract readable text from a Gmail payload.
        """
        parts = GmailDecoder._extract_parts(payload)

        for mime_type, body in parts:
            if mime_type == "text/html":
                return GmailDecoder.html_to_text(body)

        for mime_type, body in parts:
            if mime_type == "text/plain":
                return body.strip()

        return ""
