from googleapiclient.discovery import build

from .auth import GmailAuth


class GmailClient:
    def __init__(self):
        self.auth = GmailAuth()

    def get_service(self, user_id: str):
        """
        Returns an authenticated Gmail API service.
        """
        credentials = self.auth.get_credentials(user_id)

        return build(
            serviceName="gmail",
            version="v1",
            credentials=credentials,
            cache_discovery=False,
        )

    def get_profile(self, user_id: str):
        """
        Returns the Gmail profile of the authenticated user.
        Useful for testing authentication.
        """
        service = self.get_service(user_id)

        return (
            service.users()
            .getProfile(userId="me")
            .execute()
        )

    def list_messages(
        self,
        user_id: str,
        days: int = 7,
        query: str | None = None,
        max_results: int = 100,
        page_token: str | None = None,
    ):
        """
        Lists Gmail messages.

        By default, fetches emails from the last `days` days.
        A custom Gmail search query can also be provided.
        """

        if query is None:
            query = f"newer_than:{days}d"

        service = self.get_service(user_id)

        return (
            service.users()
            .messages()
            .list(
                userId="me",
                q=query,
                maxResults=max_results,
                pageToken=page_token,
            )
            .execute()
        )

    def get_message(
        self,
        user_id: str,
        message_id: str,
        fmt: str = "full",
    ):
        """
        Returns a Gmail message.

        Supported formats:
        - full
        - metadata
        - minimal
        - raw
        """
        service = self.get_service(user_id)

        return (
            service.users()
            .messages()
            .get(
                userId="me",
                id=message_id,
                format=fmt,
            )
            .execute()
        )