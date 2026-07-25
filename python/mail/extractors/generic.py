import re

from mail.models import Transaction
from mail.extractors.patterns import (
    AMOUNT_PATTERNS,
    REFERENCE_PATTERNS,
    UPI_ID_PATTERNS,
    MERCHANT_PATTERNS,
    BALANCE_PATTERNS,
    BANK_PATTERNS,
)


class GenericTransactionExtractor:

    def extract(self, email: dict) -> Transaction:
        body = email.get("body", "")

        return Transaction(
            transaction_type=self.extract_transaction_type(body),
            amount=self.extract_amount(body),
            transaction_date=email.get("date"),
            upi_reference=self.extract_reference(body),
            upi_id=self.extract_upi_id(body),
            merchant=self.extract_merchant(body),
            balance=self.extract_balance(body),
            bank=self.extract_bank(email),
            subject=email.get("subject"),
            sender=email.get("from"),
        )

    def _search(self, patterns, text, group=1):
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(group)

        return None

    def extract_amount(self, body):
        value = self._search(AMOUNT_PATTERNS, body)

        if value is None:
            return None

        return float(value.replace(",", ""))

    def extract_transaction_type(self, body):
        body = body.lower()

        if "debited" in body or "debit" in body:
            return "debit"

        if "credited" in body or "credit" in body:
            return "credit"

        return None

    def extract_reference(self, body):
        return self._search(REFERENCE_PATTERNS, body)

    def extract_upi_id(self, body):
        return self._search(UPI_ID_PATTERNS, body)

    def extract_merchant(self, body):
        merchant = self._search(MERCHANT_PATTERNS, body)

        if merchant:
            return merchant.strip()

        return None

    def extract_balance(self, body):
        value = self._search(BALANCE_PATTERNS, body)

        if value is None:
            return None

        return float(value.replace(",", ""))

    def extract_bank(self, email):
        sender = email.get("from", "").lower()
        subject = email.get("subject", "").lower()

        for bank, keywords in BANK_PATTERNS.items():
            for keyword in keywords:
                if keyword in sender or keyword in subject:
                    return bank

        return None