import os

import pandas as pd
from rapidfuzz import fuzz, process

os.environ["TOKENIZERS_PARALLELISM"] = "false"

merchant_list=['Google Manda',
 'PRATIBHA JAIS',
 'Manoj Canteen BH',
 'Suraj Singh',
 'ASHOK KUMAR G',
 'SHIVKARANSEN Pay',
 'Zepto Market',
 'Swiggy',
 'LAL SAHAB SHUKLA']

category_list=['Misc', 'Grocery', 'Coffee', 'Food']
def make_merchant_list():
    df = pd.read_json("assets/data_array.json")
    merchant_list = df["Name"].unique().tolist() or []
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

