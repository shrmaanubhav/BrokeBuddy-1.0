
import pandas as pd
from  utils import *


class Agent:
    def __init__(self,name):
        self.name=name

    def extract_data(self,query):
        #Will be overriden
        return {}


class ExpenseAgent(Agent):
    def __init__(self):
        super().__init__("expenses")
    
    def extract_data(self, query,df,start,end,merchant):
        df = pd.read_json("data_array.json")
        merchant_exp=0
        filtered=df.copy()
        total_expenses=0
        print("Extracting DATA")
        filtered=filtered[filtered["Status"]=="DEBITED"]
        if start is not None and end is not None:
         filtered = filter_date(filtered, start, end)
        elif start is not None:  # if only start provided
            filtered = filtered[filtered["Date"] >= pd.to_datetime(start)]
            
        elif end is not None:  # if only end provided
            filtered = filtered[filtered["Date"] <= pd.to_datetime(end)]

        total_expenses=get_total_spent(filtered)

        if merchant!="all merchants":
            print(merchant)
            print("TRY")
            filtered = filtered[filtered['Name'].str.contains(merchant, case=False, na=False)]
            print(filtered)
            merchant_exp=get_total_spent(filtered)
            print(filtered)
           
        day_wise_spending_dict=day_wise_spending(filtered,start,end)
        max_spent_day={}
        min_spent_day={}
        
        if day_wise_spending_dict:
            max_date=max(day_wise_spending_dict,key=day_wise_spending_dict.get)
            max_value = day_wise_spending_dict[max_date]
            max_spent_day[max_date]=max_value

            min_date=min(day_wise_spending_dict,key=day_wise_spending_dict.get)
            min_value = day_wise_spending_dict[min_date]
            min_spent_day[min_date]=min_value


        return {"action": "expenses",
                "merchant_expense": merchant_exp,
                "total":total_expenses,
                "max_spent_day":max_spent_day,
                "min_spent_day":min_spent_day,
                "day_wise_spending": day_wise_spending(filtered, start, end)
            }



# df = pd.read_json("data_array.json")
# filtered=df.copy()
# filtered = filtered[filtered['Name'].str.contains("Gupta1", case=False, na=False)]
# print(filtered)