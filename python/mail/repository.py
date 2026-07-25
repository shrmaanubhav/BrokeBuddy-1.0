from .db import get_connection


class MailRepository:

    @staticmethod
    def get_refresh_token(user_id: str):
        query = """
            SELECT "googleRefreshToken"
            FROM "User"
            WHERE id = %s
        """

        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (user_id,))
                row = cur.fetchone()

        if row is None:
            return None

        return row[0]