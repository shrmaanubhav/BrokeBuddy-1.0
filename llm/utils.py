import pandas as pd
from rapidfuzz import process,fuzz
import os
os.environ["TOKENIZERS_PARALLELISM"] = "false"


merchant_list=['Google Manda',
 'PRATIBHA JAIS',
 'Manoj Canteen BH',
 'Suraj Singh',
 'ASHOK KUMAR G',
 'SHIVKARANSEN Pay',
 'Zepto Market',
 'LAL SAHAB SHUKLA']

category_list=['Misc', 'Grocery', 'Coffee', 'Food']
def make_merchant_list():
    df=pd.read_json("data_array.json")
    merchant_list=df["Name"].unique().tolist() or []
    return merchant_list

#Budgetting functions-Let the LLM do it just give the data for it to reason

def extract_category(query):
    query = query.lower()
    best_match,score,idx=process.extractOne(query,[m for m in merchant_list],fuzz.partial_ratio)
    if score > 50: 
        return merchant_list[idx] 
    return None


def extract_merchant(query):
    query = query.lower()
    
    merchant_list=make_merchant_list()
    best_match,score,idx=process.extractOne(query,[m for m in merchant_list],fuzz.partial_ratio)
    if score > 40: 
        return merchant_list[idx] 
    return None

# print(extract_merchant("money sent to google"))
        
def match_merchant_name(extracted_name: str):
   
    if not extracted_name:
        return None

    # Normalize input
    
    merchant_list=make_merchant_list()
    extracted_name = extracted_name.strip().lower()
    candidates = [m.lower() for m in merchant_list]

    # Find closest match
    best_match, score, idx = process.extractOne(
        extracted_name,
        candidates,
        scorer=fuzz.partial_ratio
    )

    if score >= 60:
        return merchant_list[idx]  
    return None



# def extract_action(query):
#     model= SentenceTransformer("action_classifier")
#     actions = {
#     "expenses": [
#         "total spent",
#         "show expenses",
#         "how much did I spend",
#         "my spending",
#         "show my debits",
#         "overall expenses",
#         "track my expenses",
#         "money spent",
#         "spending history",
#         "spending report",
#         "How much did I spend last month on ?"
#     ],
#     "category_spending": [
#         "category wise spending",
#         "breakdown by category",
#         "spending by category",
#         "how much on food",
#         "expenses on groceries",
#         "spending by type",
#         "show category breakdown",
#         "expenses by group",
#         "spending by section",
#         "how much for coffee"
#     ],
#     "top_merchants": [
#         "top merchants",
#         "where do I spend the most",
#         "biggest vendors",
#         "top shops",
#         "highest spending store",
#         "who do I pay the most",
#         "major merchants",
#         "frequent merchants",
#         "spending by shop",
#         "most expensive merchant"
#     ],
#     "large_expenses": [
#         "large expenses",
#         "biggest transactions",
#         "major spends",
#         "high value purchases",
#         "large debits",
#         "heavy transactions",
#         "big payments",
#         "unusual spend",
#         "big money spent",
#         "expensive transactions"
#     ],
#     # "compare_periods": [
#     #     "compare months",
#     #     "difference between months",
#     #     "compare periods",
#     #     "compare spending",
#     #     "month to month difference",
#     #     "compare last week and this week",
#     #     "spending trend difference",
#     #     "how much more did I spend",
#     #     "expenses change",
#     #     "compare time periods"
#     # ],
#     "budget": [
#         "budget plan",
#         "create saving plan",
#         "help me save money",
#         "give me a budget",
#         "create financial plan",
#         "spending budget",
#         "make a savings plan",
#         "budget schedule",
#         "recommend a budget",
#         "saving strategy"
#     ],
#     "general": [
#         "hello",
#         "hi",
#         "how are you",
#         "thank you",
#         "what can you do",
#         "who are you",
#         "tell me something",
#         "help me",
#         "good morning",
#         "good evening"
#     ]
#     }


#     action_embeddings={}

#     for action,list_of_phrases in actions.items():
#         action_embeddings[action]=model.encode(list_of_phrases,convert_to_tensor=True)


#     query_embedding = model.encode(query,convert_to_tensor=True)
#     best_score=0
#     ans=None
#     for action,emb in action_embeddings.items():
#         score = util.cos_sim(query_embedding,emb).max().item()
#         if(score>best_score):
#             ans=action
#             best_score=score

#     if(best_score<=0.2): ans="general"

#     return ans,best_score


#Analytics Functions
def filter_date(df,fromDate,toDate):
    fromDate = pd.to_datetime(fromDate)   
    toDate = pd.to_datetime(toDate) 
    df['Date']=pd.to_datetime(df['Date'])
    filtered = df[(df['Date'] >= fromDate) & (df['Date'] <= toDate)]
    return filtered


def get_total_spent(df):
    sum=0
    sum=df['Transaction_Amount'].sum()
    return sum 

def category_wise_spending(df):
    return df.groupby('Category')['Transaction_Amount'].agg('sum').to_dict()
    

def get_top_merchants(df,n=5):
    return df.groupby('Name')['Transaction_Amount'].agg('sum').sort_values(ascending=False).to_dict()



def day_wise_spending(df,start,end):
    df = filter_date(df,start,end)
    df['Date'] = pd.to_datetime(df['Date']).dt.date  
    daily_spending=(df.groupby('Date')['Transaction_Amount'].sum().to_dict())
    return {d.strftime("%Y-%m-%d"): amt for d, amt in daily_spending.items()}


def detect_large_expenses(df,threshold):
    filtered = df[df['Transaction_Amount'] >= threshold]
    return filtered[['Name','Transaction_Amount']].to_dict()


def compare_periods(df,start1,end1,start2,end2):
    period1 = filter_date(df,start1,end1)
    period2 = filter_date(df,start2,end2)
    sum1 = get_total_spent(period1)
    sum2 = get_total_spent(period2)

    return {f'{start1} - {end1}':sum1,f'{start2} - {end2}':sum2}

def compute_merchant_expenses(debited, credited, merchant):
    """
    Computes total spent and received for a given merchant.
    """
    if merchant is None or merchant == "all merchants":
        return {
            "merchant_expense": 0,
            "merchant_received": 0
        }

    mer_debited = debited[debited["Name"].str.contains(merchant, case=False, na=False)]
    mer_credited = credited[credited["Name"].str.contains(merchant, case=False, na=False)]

    return {
        "merchant_debited_df":mer_debited,
        "merchant_credited_df":mer_credited,
        "merchant_expense": get_total_spent(mer_debited),
        "merchant_received": get_total_spent(mer_credited)
    }

def compute_category_expenses(debited, credited, category):
    """
    Computes total spent and received for a given category.
    """
    if category is None or category == "all categories":
        return {
            "category_expense": 0,
            "category_received": 0
        }

    cat_debited = debited[debited["Category"] == category]
    cat_credited = credited[credited["Category"] == category]

    return {
        "category_debited_df":cat_debited,
        "category_credited_df":cat_credited,
        "category_expense": get_total_spent(cat_debited),
        "category_received": get_total_spent(cat_credited)
    }



def add_expense_in_database(merchant,date,amount):
    """ Append a new expense via express call. """
    print("Adding expense:", merchant, date, amount)


def filter_budgets(df, start_date, end_date, merchant=None, category=None, name=None):
    """
    Returns active/inactive budgets that overlap with the requested date range.
    """
    if df is None or df.empty:
        return {"active_budgets": [], "inactive_budgets": []}

    filtered = df.copy()

    if name:
        filtered = filtered[filtered["name"].str.contains(name, case=False, na=False)]
    if merchant:
        filtered = filtered[filtered["merchant"] == merchant]
    if category:
        filtered = filtered[filtered["category"] == category]

    if filtered.empty:
        return {"active_budgets": [], "inactive_budgets": []}

    required_cols = {"start_date", "end_date"}
    if not required_cols.issubset(filtered.columns):
        return {"active_budgets": [], "inactive_budgets": []}

    filtered["start_date"] = pd.to_datetime(filtered["start_date"])
    filtered["end_date"] = pd.to_datetime(filtered["end_date"])

    start_dt = pd.to_datetime(start_date) if start_date else None
    end_dt = pd.to_datetime(end_date) if end_date else None

    active_mask = pd.Series([True] * len(filtered), index=filtered.index)
    if start_dt is not None:
        active_mask &= filtered["end_date"] >= start_dt
    if end_dt is not None:
        active_mask &= filtered["start_date"] <= end_dt

    active_budgets = filtered[active_mask]
    inactive_budgets = filtered[~active_mask]

    return {
        "active_budgets": active_budgets.to_dict(orient="records"),
        "inactive_budgets": inactive_budgets.to_dict(orient="records")
    }
