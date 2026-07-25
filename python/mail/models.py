from dataclasses import dataclass
from typing import Optional


@dataclass
class Transaction:
    transaction_type: Optional[str] = None

    amount: Optional[float] = None

    transaction_date: Optional[str] = None

    upi_reference: Optional[str] = None
    upi_id: Optional[str] = None

    merchant: Optional[str] = None

    balance: Optional[float] = None

    bank: Optional[str] = None

    subject: Optional[str] = None
    sender: Optional[str] = None

    @property
    def debited(self) -> bool:
        return self.transaction_type == "debit"

    @property
    def date(self) -> Optional[str]:
        return self.transaction_date

    @property
    def transaction_id(self) -> Optional[str]:
        return self.upi_reference
