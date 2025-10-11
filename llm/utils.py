import imaplib as imp
import email
from bs4 import BeautifulSoup  
import numpy as np
import json
import pandas as pd
import datetime
import faiss
import numpy as np
import json
from sentence_transformers import SentenceTransformer,util
from difflib import get_close_matches
from rapidfuzz import process,fuzz
from typing import TypedDict,Optional,Any,Dict
#Extraction Functions-,extract_date_range(user_text, today=None)
#parse_user_query(user_text, df, today=None)
from langgraph.graph import StateGraph,START,END
import os
from dateutil import relativedelta
from pydantic import BaseModel
os.environ["TOKENIZERS_PARALLELISM"] = "false"

import re

from dateparser import parse
from langchain_groq import ChatGroq
from langchain_core.output_parsers import StrOutputParser,PydanticOutputParser
from langchain_core.prompts import PromptTemplate





def FindCostFromGivenDate(email1,dt):
    password="zkuf ffzp gwan hngs"
    mail = imp.IMAP4_SSL("imap.gmail.com")
    reponse,data=mail.login(email1.strip(),password.strip()) 
    if(reponse!='OK'):
        print("Wrong Credentials ")
    mail.select("inbox")
        
    date = dt
    _, data = mail.search(None, f'(FROM "kblalerts@ktkbank.in" SINCE {date})')
   
    email_ids = data[0].split()

    if not email_ids:
        print("No emails found.")
    else:
        AllCost =[]
        transactions=[]
        DayWiseCost = {}
        TotalCost=0.0
        NC_Cost=0.0
        Nescafe_Cost=0.0
        Amul_cost=0.0
        Gupta_cost=0.0
        _, mail_data = (mail.fetch(b",".join(email_ids),  "(RFC822)"))
        transac_ids=set()
       
        for i in mail_data:
                
            if isinstance(i, tuple):  
                raw_email = i[1]
                msg = email.message_from_bytes(raw_email)
                
                arr=(msg.__getitem__('Date').split(',')[1].split('+')[0].split(" "))
               
                dateP=arr[1]+'-'+arr[2]+'-'+arr[3]
               
            body = ""
            if msg.is_multipart(): 
                for part in msg.walk():
                    content_type = part.get_content_type()
                   
                    
                    if(content_type=='text/html'):
                        try:
                                html = part.get_payload(decode=True).decode()
                                soup = BeautifulSoup(html, "html.parser")
                                body = soup.get_text(separator="\n", strip=True)  
                        except:
                                continue

            if body:
                
                for i in body.split('\n'):
                    if("DEBITED for Rs" in i):
                        
                       #  cost = (i.split("DEBITED for Rs.")[1].split()[0].replace(",",""))
                        details = (i.split("DEBITED for Rs.")[1].split())
                        cost = float(details[0].replace(",",""))
                        Upi_id=details[1].upper()
                        if(Upi_id[0]!='U'):
                            continue
                        
                      
                        Upi_id=Upi_id.split(':')[2].split("(")[0].split('-')[0]
                       
                    
                        transac_id = details[1].split(':')[1]

                        Shop_name = ''

                        if(transac_id in transac_ids):
                            continue
                        transac_ids.add(transac_id)
                        #print(Upi_id)
                        # if(Upi_id=='Q793458026@YBL'):
                        #     NC_Cost+=cost
                        #     Shop_name = "Night_Canteen"
                        # elif(Upi_id=='PAYTMQR65NEBI@PTYS' or Upi_id=='PAYTMQR281005050101OHZ7AF0MP5V0@'):
                        #     Nescafe_Cost+=cost
                        #     Shop_name = "Nescafe"
                        # elif(Upi_id=='PAYTMQR65MYTO@PTYS' or Upi_id=='PAYTMQR5ZIYAE@PTYS'):
                        #     Gupta_cost+=cost
                        #     Shop_name = "Gupta_Ji"
                            
                        # elif(Upi_id=='8858420752'):
                        #     Amul_cost+=cost
                        #     Shop_name = "Amul"
                        transactions.append({"COST":cost,"UPI_ID":Upi_id,"DEBITED":True})
                        AllCost.append(cost)
                        TotalCost+=cost
                        if dateP in DayWiseCost:
                            DayWiseCost[dateP] += cost
                        else:
                            DayWiseCost[dateP] = cost
                      
                        break
                    elif("CREDITED for Rs" in i):
                        details = (i.split("CREDITED for Rs.")[1].split())
                        cost = float(details[0].replace(",",""))
                        Upi_id=details[1].upper()
                        if(Upi_id[0]!='U'):
                            continue
                        
                      
                        Upi_id=Upi_id.split(':')[2].split("(")[0].split('-')[0]
                       
                    
                        transac_id = details[1].split(':')[1]

                      

                        if(transac_id in transac_ids):
                            continue
                        transac_ids.add(transac_id)
                        
                        transactions.append({"COST":cost,"UPI_ID":Upi_id,"DEBITED":False})
                        
                      
                        break
                        


            else:
                 print("No plain text body found.")
        #print("The number of transactions are ",len(AllCost),"\n","The totat spent was ",TotalCost)
        AllCost=np.array(AllCost,dtype=np.float64)
        Juice_cost = 0
        ans={
             "Transactions":len(AllCost),
             "Total":TotalCost,
             "DayWiseCost":DayWiseCost,
             "Transactions":transactions
        }
        print(json.dumps(ans))
        return ans
    mail.logout()

# dt1 = "2-Oct-2025"
# dt1=(dt1.strip().strip("'").strip('"'))
# FindCostFromGivenDate("adithreganti@gmail.com",dt1)



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


def extract_action(query):
    model= SentenceTransformer("action_classifier")
    actions = {
    "expenses": [
        "total spent",
        "show expenses",
        "how much did I spend",
        "my spending",
        "show my debits",
        "overall expenses",
        "track my expenses",
        "money spent",
        "spending history",
        "spending report",
        "How much did I spend last month on ?"
    ],
    "category_spending": [
        "category wise spending",
        "breakdown by category",
        "spending by category",
        "how much on food",
        "expenses on groceries",
        "spending by type",
        "show category breakdown",
        "expenses by group",
        "spending by section",
        "how much for coffee"
    ],
    "top_merchants": [
        "top merchants",
        "where do I spend the most",
        "biggest vendors",
        "top shops",
        "highest spending store",
        "who do I pay the most",
        "major merchants",
        "frequent merchants",
        "spending by shop",
        "most expensive merchant"
    ],
    "large_expenses": [
        "large expenses",
        "biggest transactions",
        "major spends",
        "high value purchases",
        "large debits",
        "heavy transactions",
        "big payments",
        "unusual spend",
        "big money spent",
        "expensive transactions"
    ],
    # "compare_periods": [
    #     "compare months",
    #     "difference between months",
    #     "compare periods",
    #     "compare spending",
    #     "month to month difference",
    #     "compare last week and this week",
    #     "spending trend difference",
    #     "how much more did I spend",
    #     "expenses change",
    #     "compare time periods"
    # ],
    "budget": [
        "budget plan",
        "create saving plan",
        "help me save money",
        "give me a budget",
        "create financial plan",
        "spending budget",
        "make a savings plan",
        "budget schedule",
        "recommend a budget",
        "saving strategy"
    ],
    "general": [
        "hello",
        "hi",
        "how are you",
        "thank you",
        "what can you do",
        "who are you",
        "tell me something",
        "help me",
        "good morning",
        "good evening"
    ]
    }


    action_embeddings={}

    for action,list_of_phrases in actions.items():
        action_embeddings[action]=model.encode(list_of_phrases,convert_to_tensor=True)


    query_embedding = model.encode(query,convert_to_tensor=True)
    best_score=0
    ans=None
    for action,emb in action_embeddings.items():
        score = util.cos_sim(query_embedding,emb).max().item()
        if(score>best_score):
            ans=action
            best_score=score

    if(best_score<=0.2): ans="general"

    return ans,best_score


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


#Budgetting Functions





#RAG for LookUP

def create_chunks(obj_arr,file_name):
    chunks=[]
    
    for chunk in obj_arr:
        Status = chunk.get("Status","DEBITED")
        Id=chunk.get("Id","None")
        UPI_id=chunk.get("UPI_id","None")
        Name=chunk.get("Name","None")
        Balance=chunk.get("Balance","None")
        Transaction_Amount=chunk.get("Transaction_Amount","None")
        Date = chunk.get("Date","None")
    
        text = f'{Status} Rs {Transaction_Amount} from {Name} via {UPI_id} on {Date}. Balance is {Balance}'
        metadata = {"Status":Status,"Id":Id,"UPI_id":UPI_id,"Name":Name,"Balance":Balance,"Transaction_Amount":Transaction_Amount,"Date":Date}
        
        chunk_data = {"Id":Id,"text":text,"metadata":metadata}
        chunks.append(chunk_data)
    
    with open(file_name,"w") as f:
        f.write(json.dumps(chunks))


#Loades into vectorDB , a function is required to extract top k transactions
def load_into_faiss(model,file_name):
    with open(file_name,"r") as f:
        chunks=json.load(f)
    
    texts = [chunk["text"] for chunk in chunks]

    embeddings = model.encode(texts,batch_size=32,show_progress_bar=True)
    embeddings=np.array(embeddings).astype("float32")


    
    dim = embeddings.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(embeddings)
    
    meta_data_store = [chunk["metadata"] for chunk in chunks]

    return index,meta_data_store

    
def get_top_transaction(query,model):
    index,meta_data_store=load_into_faiss("chunks.json")
    q_emb = model.encode([query]).astype("float32")

    D, I = index.search(q_emb, k=5)
    data=[]
    for idx in I[0]:
        data.append(meta_data_store[idx])
        
    return data



MODEL = "llama-3.1-8b-instant"

class Agent:
    def __init__(self,name):
        self.name=name

    def extract_data(self,query):
        #Will be overriden
        return {}



llm=ChatGroq(
    model=MODEL,
    api_key="REMOVED_GROQ_KEY",
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







class ExpenseAgent(Agent):
    def __init__(self):
        super().__init__("expenses")
    
    def extract_data(self, query,df,start,end,merchant):
        
        merchant_exp=0
        filtered=df.copy()
        total_expenses=0

        if start is not None and end is not None:
         filtered = filter_date(filtered, start, end)
        elif start is not None:  # if only start provided
            filtered = filtered[filtered["Date"] >= pd.to_datetime(start)]
        elif end is not None:  # if only end provided
            filtered = filtered[filtered["Date"] <= pd.to_datetime(end)]

        total_expenses=get_total_spent(filtered)

        if merchant!="all merchants":
            print(merchant)
            filtered = filtered[filtered['Name'].str.contains(merchant, case=False, na=False)]
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




class ChatState(TypedDict):
    query:str
    action:Optional[str]
    response:Optional[str]
    merchant:Optional[str]
    start_date:Optional[str]
    end_date:Optional[str]
    data:Optional[Dict[str,Any]]
    score:Optional[float]

#LangGraph Nodes
def classify_action_node(state: ChatState, chatbot) -> ChatState:
    query = state['query']
    action, score = extract_action(query)

    # Context fallback: if score is low (<0.3), reuse last action
    if score < 0.3 and chatbot.history:
        last_action = chatbot.history[-1]["agent_data"].get("action")
        print(f"Low confidence ({score:.2f}), reusing last action: {last_action}")
        action = last_action or action

    state["action"] = action
    state["score"] = score
    print(score, action)
    return state


def extract_data_node(chatbot,state:ChatState,df)->ChatState:
        query = state["query"]
        action = state.get("action")
        if not action or action not in chatbot.agents:
            state["response"]="Sorry,can't help you with that :("
            return state
        
        merchant,start_date,end_date = chatbot.merchant_date(query)
        if not merchant:
            if state["merchant"]:
                merchant = state["merchant"]
            else:
                merchant="all merchants"
        
        state["merchant"]=merchant
        if not start_date:
            if state["start_date"]:
                start_date=state["start_date"]
            else:
                start_date = (datetime.datetime.today() - relativedelta(months=1)).strftime("%-d-%b-%Y")
        state["start_date"]=start_date
        if not end_date:
            if state["end_date"]:
                end_date=state["end_date"]
            else:
                end_date=datetime.datetime.today().strftime("%-d-%b-%Y")
        state["end_date"]=end_date

        agent = chatbot.agents.get(action)
        state["data"]=agent.extract_data(query,df,start_date,end_date,merchant)
        
        print(state["data"])
        return state





def generate_node(chatbot,state:ChatState)->ChatState:
        action=state['action']
        data=state["data"]
        query=state["query"]
        merchant=state["merchant"]
        start_date=state["start_date"]
        end_date=state["end_date"]
        chain = chatbot.response_chains[action]
        history = chatbot.get_history_text()
        resp = chain.invoke({"history":history,"query":query,"start_date":start_date,"end_date":end_date,"merchant":merchant,**data})
        state['response']=resp
        chatbot.add_to_history(query,resp,data)
        return state





class ChatBot():
    def __init__(self):
        self.llm=None
        self.query_classifier=extract_action
        self.response_chains={}
        self.agents={"expenses":ExpenseAgent()}
        self.parser=None
        self.history=[]

        self.state = {
            "query": None,
            "action": None,
            "response": None,
            "merchant": None,
            "start_date": None,
            "end_date": None,
            "data": {},
            "score": None
        }
    
    def initialize(self):
        #Initialize Model,parser
        #Prompts for different actions

        self.llm=ChatGroq(model=MODEL,api_key="REMOVED_GROQ_KEY",temperature=0.1)

        self.parser=StrOutputParser()
       
        self.response_chains["expenses"] = PromptTemplate(
    input_variables=[
        "history","query","total","merchant","merchant_expense",
        "start_date","end_date",
        "day_wise_spending","max_spent_day","min_spent_day"
    ],
    template=(
        "You are a financial assistant.\n\n"
       
        "History: {history}\n\n"
        "User query: {query}\n\n"
        "Facts:\n"
        "- Total expenses in the date range: {total}\n"
        "- Merchant: {merchant}\n"
        "- Expenses on this merchant: {merchant_expense}\n"
       
        "- Date range: {start_date} to {end_date}\n"
        "- Day-wise spending: {day_wise_spending}\n"
        "- Highest spending day: {max_spent_day}\n"
        "- Lowest spending day: {min_spent_day}\n\n"
        "Instructions:\n"
        "1. Always distinguish between total expenses and merchant expenses.\n"
        "2. Clearly report both values with units (e.g., $).\n"
        "3. Mention merchant share % of total.\n"
        "4. Summarize spending trends (high/low days, spikes) if multiple days exist.\n"
        "5. If only one merchant transaction, phrase it as 'one transaction of X on Y'.\n"
        "6. Do not claim missing data if numbers are provided.\n"
        "7. Keep response factual and under 7 sentences."
    )
) | self.llm | self.parser

    def merchant_date(self,query):
        response = extraction_chain.invoke({"query": query, "today": datetime.datetime.today().strftime("%-d-%b-%Y")})
        print("LLM response:", response)
        # response=json.loads(response)
        # response = parser.parse(response)
        merchant=match_merchant_name(response.merchant) 
        # print("Merchant", merchant)
        start=response.start_date
        end=response.end_date
        return merchant,start,end

    def add_to_history(self,query,resp,data):
        self.history.append({
            "User_Query":query,
            "agent_data":data,
            "Response":resp
        })
        if(len(self.history)>3):
            self.history=self.history[-3:]
    
    def get_history_text(self):
        return "\n".join(
            [f"User: {h['User_Query']}\nAssistant: {h['Response']}" for h in self.history]
        )

    
    #LangGraph Nodes
   

    def build_graph(self,df):
        graph = StateGraph(ChatState)

        graph.add_node("classify", lambda s:classify_action_node(s,self))
        graph.add_node("extract", lambda s: extract_data_node(self,s, df))
        # graph.add_node("resolve", lambda s: resolve_context_node(self,s, df))
        graph.add_node("generate", lambda s: generate_node(self,s))


        graph.add_edge(START,"classify")
        graph.add_edge("classify","extract")
        graph.add_edge("extract","generate")
        # graph.add_edge("resolve","generate")
        graph.add_edge("generate",END)

        return graph.compile()
    
    def respond_using_graph(self,df,query):
        self.state["query"]=query
        graph = self.build_graph(df)
        result=graph.invoke(self.state)
        self.state.update(result)
        
        return result["response"]



if __name__ == "__main__":
    import pandas as pd

    df = pd.read_json("data_array.json")

    chatbot = ChatBot()
    chatbot.initialize()

    print(" LangGraph Financial Assistant ready!")

    while True:
        query = input("You: ")
        if query.lower() in ["exit", "quit"]:
            print("Assistant: Goodbye 👋")
            break

        response = chatbot.respond_using_graph(df, query)
        print(f"Assistant: {response}\n")

    #print(extract_merchant("How much have i spent on zepto last month"))
    # resp=extraction_chain.invoke({"query":"How much did I spend last month on Zepto","today":datetime.datetime.today().strftime("%-d-%b-%Y")})
    
    
    # print(resp.merchant)



