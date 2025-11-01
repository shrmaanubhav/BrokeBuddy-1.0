
from transformers import AutoModelForSequenceClassification,AutoTokenizer
from pydantic import BaseModel
from typing import Optional,Literal
from langchain_core.output_parsers import PydanticOutputParser,StrOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq
from langchain.schema.runnable import RunnableBranch
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from email_parser import FindCostFromGivenDate
load_dotenv()
model= AutoModelForSequenceClassification.from_pretrained("adith-regan/intent-classifier")
tokenizer = AutoTokenizer.from_pretrained("adith-regan/intent-classifier")
model.eval()

def extract_action(query):
    
    encodings = tokenizer(query,padding="max_length",truncation=True,return_tensors="pt")

    out=model(**encodings)
    pred=out.logits.argmax(dim=-1).item()
    map={0:"budget",1:"expenses",2:"general",3:"insight",4:"merchant"}
    return map[pred]


#print(extract_action("How much did i spend on Suraj last week?"))



MODEL = "llama-3.1-8b-instant"


llm=ChatGroq(
    model=MODEL,
    api_key=os.getenv("API_KEY"),
    temperature=0.1
)


llm2 =ChatGroq(
    model="openai/gpt-oss-20b",
    api_key=os.getenv("API_KEY"),
    temperature=0.1
)

class ExtractionResult(BaseModel):
    merchant:Optional[str]
    start_date:Optional[str]
    end_date:Optional[str]
   

parser = PydanticOutputParser(pydantic_object=ExtractionResult)

extraction_prompt = PromptTemplate(
    input_variables=["query", "today"],
    partial_variables={"format_instructions":parser.get_format_instructions()},
    template=(
        """
You are a precise extractor that identifies the merchant name and date range from the given user query.

Use {today} as the reference for resolving relative dates (like "last week", "yesterday", "next month").

{format_instructions}

### Rules:
1. Dates must be in the format **"D-Mon-YYYY"** (e.g., 1-Aug-2025,10-Oct-2024,5-Sep-2024).
If year is not specified, assume current year.
2. Handle both exact and relative date phrases.
3. Convert relative time phrases into concrete date ranges based on {today}.
4. If only one date is present, use the same date for both `start_date` and `end_date`.
5. If only one date is present, use it for both start_date and end_date
6.If no date, return null for both
7.Output only the JSON object, nothing else.

User query:
{query}
"""
    )
)


extraction_chain = extraction_prompt|llm|parser

class Check(BaseModel):
    decision:Literal["yes","no"]

check_parser = PydanticOutputParser(pydantic_object=Check)

add_expense_check=PromptTemplate(
    input_variables=["query"],
    partial_variables={"format_instructions":check_parser.get_format_instructions()},
    template=(
        """ 
        Decide if the user wants to add an expense transaction based on the query.
        Only respond with "yes" or "no":

        {format_instructions}

        Query: {query}
        """
    )
)

class AddExpense(BaseModel):
    amount:Optional[float]
    merchant:Optional[str]
    date:Optional[str]



parser2 = PydanticOutputParser(pydantic_object=AddExpense)

add_expense_prompt = PromptTemplate(
    input_variables=["query"],
    partial_variables={"format_instructions":parser2.get_format_instructions()},
    template=(
        """ 
        Extract the amount(Rs), merchant name, and date from the user query for adding an expense.
        Provide the output in the format:
        {format_instructions}
       
        If any information is missing, use leave it empty for that field.
        Query: {query}
        """
    )
)

add_expense_check_chain = add_expense_check|llm2|check_parser

add_expense_chain=add_expense_prompt|llm2|parser2

def handle_add_expense(query):
    decision=add_expense_check_chain.invoke({"query":query}).decision.strip().lower()
    print("Intent Decision:", decision)
    if(decision=="yes"):
        result=add_expense_chain.invoke({"query":query})
        if(result.amount is not None and result.merchant is not None and result.date is not None):
            return result
    return False



def updateData(email):
    date_2months=datetime.today()-timedelta(days=60)
    data = FindCostFromGivenDate(email)
    transactions = data.transactions
    data_arr=[]
    for txn in transactions:
        txn_date=datetime.strptime(txn['date'],'%d-%b-%Y')
        data_arr
        

#print(handle_add_expense("Add an expense of 500 on Amazon for groceries on 5th Aug 2024"))