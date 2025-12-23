import pandas as pd
from utils import compute_category_expenses, compute_merchant_expenses, filter_budgets, filter_date, get_total_spent
from agents.base import Agent


class Budget(Agent):
    def __init__(self):
        super().__init__("budget")

    def extract_data(self, query, budget_df, expense_df, start, end, merchant=None, category=None, name=None):
        """
        Prepare budget data relevant to the query.
        """
        if budget_df is not None and not isinstance(budget_df, pd.DataFrame):
            budget_df = pd.DataFrame(budget_df)

        if budget_df is None or budget_df.empty:
            return {
                "action": "budget",
                "active_budget_status": [],
                "inactive_budgets": [],
                "active_count": 0,
                "inactive_count": 0,
                "exceeded_budgets": [],
                "message": "No budgets found."
            }
        budget_list = filter_budgets(budget_df, start, end, merchant, category, name)
        budget_status = self.check_budgets_status(budget_list, expense_df)

        budget_status.update({
            "action": "budget",
            "active_count": len(budget_status["active_budget_status"]),
            "inactive_count": len(budget_status["inactive_budgets"]),
            "exceeded_budgets": [b for b in budget_status["active_budget_status"] if b["is_exceeded"]],
            "budget_transactions": budget_status.get("transactions", [])
        })


        return budget_status

    def check_budgets_status(self, budget_list, expense_df):
        active_budgets = budget_list.get("active_budgets", [])
        inactive_budgets = budget_list.get("inactive_budgets", [])

        if expense_df is not None and not isinstance(expense_df, pd.DataFrame):
            expense_df = pd.DataFrame(expense_df)
        expense_df = expense_df.copy() if expense_df is not None else pd.DataFrame()
        budget_status_list = []

        for budget in active_budgets:
            filtered = expense_df.copy()
            merchant = budget.get("merchant")
            category = budget.get("category")
            amount = budget.get("amount", 0)
            start = budget.get("start_date")
            end = budget.get("end_date")

            if "Date" in filtered.columns:
                if start is not None and end is not None:
                    filtered = filter_date(filtered, start, end)
                elif start is not None:
                    filtered = filtered[filtered["Date"] >= pd.to_datetime(start)]
                elif end is not None:
                    filtered = filtered[filtered["Date"] <= pd.to_datetime(end)]

            if not filtered.empty and "Status" in filtered.columns:
                debited = filtered[filtered["Status"] == "DEBITED"]
                credited = filtered[filtered["Status"] == "CREDITED"]
            else:
                debited = pd.DataFrame(columns=filtered.columns)
                credited = pd.DataFrame(columns=filtered.columns)

            amount_spent = 0
            transactions = pd.DataFrame()

            if merchant:
                merchant_data = compute_merchant_expenses(debited, credited, merchant)
                amount_spent = merchant_data.get("merchant_expense", 0)
                transactions = merchant_data.get("merchant_debited_df", pd.DataFrame())
            elif category:
                category_data = compute_category_expenses(debited, credited, category)
                amount_spent = category_data.get("category_expense", 0)
                transactions = category_data.get("category_debited_df", pd.DataFrame())
            else:
                amount_spent = get_total_spent(debited)
                transactions = debited

            budget_status_list.append({
                "budget_name": budget.get("name"),
                "scope": "merchant" if merchant else "category" if category else "global",
                "amount_set": amount,
                "amount_spent": amount_spent,
                "remaining": amount - amount_spent,
                "is_exceeded": amount_spent > amount,
                "start_date": start,
                "end_date": end,
                "transactions": transactions.to_dict(orient="records")
            })

        flattened_txns = []
        for entry in budget_status_list:
            budget_name = entry.get("budget_name")
            for txn in entry.get("transactions", []):
                flattened_txns.append({
                    "budget_name": budget_name,
                    **txn
                })

        def txn_amount(txn):
            return abs(txn.get("Transaction_Amount", 0)) if isinstance(txn, dict) else 0
        flattened_txns = sorted(flattened_txns, key=txn_amount, reverse=True)[:10]

        # Provide a markdown-friendly view to help the LLM ground its reasoning.
        if flattened_txns:
            rows = [
                "| Budget | Date | Merchant | Amount | Status | Category |",
                "| --- | --- | --- | ---: | --- | --- |",
            ]
            for txn in flattened_txns:
                rows.append(
                    f"| {txn.get('budget_name','')} | "
                    f"{txn.get('Date','')} | "
                    f"{txn.get('Name','')} | "
                    f"{txn.get('Transaction_Amount','')} | "
                    f"{txn.get('Status','')} | "
                    f"{txn.get('Category','')} |"
                )
            flattened_txns_md = "\n".join(rows)
        else:
            flattened_txns_md = "No relevant transactions found."

        return {
            "active_budget_status": budget_status_list,
            "inactive_budgets": inactive_budgets,
            "transactions": flattened_txns,
            "transactions_markdown": flattened_txns_md
        }
