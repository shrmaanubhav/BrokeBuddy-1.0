from collections import defaultdict
from .models import Transaction


class TransactionAggregator:
    def __init__(self):
        self._transactions: list[Transaction] = []
        self._total = 0.0
        self._day_wise_cost = defaultdict(float)

    def add(self, transaction: Transaction):
        self._transactions.append(transaction)

        if transaction.debited:
            self._total += transaction.amount
            self._day_wise_cost[transaction.date] += transaction.amount

    def summary(self):
        return {
            "Transactions": [
                {
                    "COST": t.amount,
                    "UPI_ID": t.upi_id,
                    "UPI_REFERENCE": t.upi_reference,
                    "DEBITED": t.debited,
                    "date": t.date,
                }
                for t in self._transactions
            ],
            "Total": self._total,
            "DayWiseCost": dict(self._day_wise_cost),
        }