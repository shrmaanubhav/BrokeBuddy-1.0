from dotenv import load_dotenv
import os

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials

from .crypto import decrypt
from .repository import MailRepository

load_dotenv()


class GmailAuth:

    def __init__(self):
        self.client_id = os.getenv("GOOGLE_CLIENT_ID")
        self.client_secret = os.getenv("GOOGLE_CLIENT_SECRET")

        if not self.client_id:
            raise RuntimeError("GOOGLE_CLIENT_ID missing.")

        if not self.client_secret:
            raise RuntimeError("GOOGLE_CLIENT_SECRET missing.")

    def get_credentials(self, user_id: str) -> Credentials:

        encrypted = MailRepository.get_refresh_token(user_id)

        if encrypted is None:
            raise ValueError("User has no refresh token.")
        
        print("Encrypted token:", encrypted)
        print("Length:", len(encrypted))
        print("Type:", type(encrypted))

        refresh_token = decrypt(encrypted)

        credentials = Credentials(
            token=None,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=self.client_id,
            client_secret=self.client_secret,
            scopes=[
                "https://www.googleapis.com/auth/gmail.readonly"
            ],
        )

        credentials.refresh(Request())

        return credentials