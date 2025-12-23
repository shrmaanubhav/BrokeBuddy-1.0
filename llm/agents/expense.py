
import pandas as pd
from  utils import *
from utils import filter_date, get_total_spent, day_wise_spending
from agents.base import Agent




class ExpenseAgent(Agent):
    def __init__(self):
        super().__init__("expenses")
    
    def extract_data(self, query, df, start, end, merchant=None, category=None):
        print("Extracting DATA")

        filtered = df.copy()

        # Date filtering
        if start is not None and end is not None:
            filtered = filter_date(filtered, start, end)
        elif start is not None:
            filtered = filtered[filtered["Date"] >= pd.to_datetime(start)]
        elif end is not None:
            filtered = filtered[filtered["Date"] <= pd.to_datetime(end)]

        # Split debit / credit
        debited = filtered[filtered["Status"] == "DEBITED"]
        credited = filtered[filtered["Status"] == "CREDITED"]

        # Totals
        total_expenses = get_total_spent(debited)
        total_received = get_total_spent(credited)

        # Merchant analysis
        merchant_data = compute_merchant_expenses(debited, credited, merchant)

        # Category analysis
        category_data = compute_category_expenses(debited, credited, category)

        # Day-wise analysis
        day_wise_spending_dict = day_wise_spending(debited, start, end)

        max_spent_day = {}
        min_spent_day = {}

        if day_wise_spending_dict:
            max_date = max(day_wise_spending_dict, key=day_wise_spending_dict.get)
            min_date = min(day_wise_spending_dict, key=day_wise_spending_dict.get)

            max_spent_day = {max_date: day_wise_spending_dict[max_date]}
            min_spent_day = {min_date: day_wise_spending_dict[min_date]}

        return {
            "action": "expenses",
            "total_expenses": total_expenses,
            "total_received": total_received,

            **merchant_data,
            **category_data,

            "day_wise_spending": day_wise_spending_dict,
            "max_spent_day": max_spent_day,
            "min_spent_day": min_spent_day
        }



# df = pd.read_json("data_array.json")
# filtered=df.copy()
# filtered = filtered[filtered['Name'].str.contains("Gupta1", case=False, na=False)]
# print(filtered)