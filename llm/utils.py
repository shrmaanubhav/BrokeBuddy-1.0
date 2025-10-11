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
    

#Budgetting functions-Let the LLM do it just give the data for it to reason

def extract_category(query):
    query = query.lower()
    best_match,score,idx=process.extractOne(query,[m for m in merchant_list],fuzz.partial_ratio)
    if score > 50: 
        return merchant_list[idx] 
    return None


def extract_merchant(query):
    query = query.lower()
    best_match,score,idx=process.extractOne(query,[m for m in merchant_list],fuzz.partial_ratio)
    if score > 50: 
        return merchant_list[idx] 
    return None

# print(extract_merchant("money sent to google"))
        
def match_merchant_name(extracted_name: str):
   
    if not extracted_name:
        return None

    # Normalize input
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


