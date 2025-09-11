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
#Extraction Functions-,extract_date_range(user_text, today=None)
#parse_user_query(user_text, df, today=None)
mail = imp.IMAP4_SSL("imap.gmail.com")


password="zkuf ffzp gwan hngs"


def FindCostFromGivenDate(email1,dt):
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
                        if(Upi_id=='Q793458026@YBL'):
                            NC_Cost+=cost
                            Shop_name = "Night_Canteen"
                        elif(Upi_id=='PAYTMQR65NEBI@PTYS' or Upi_id=='PAYTMQR281005050101OHZ7AF0MP5V0@'):
                            Nescafe_Cost+=cost
                            Shop_name = "Nescafe"
                        elif(Upi_id=='PAYTMQR65MYTO@PTYS' or Upi_id=='PAYTMQR5ZIYAE@PTYS'):
                            Gupta_cost+=cost
                            Shop_name = "Gupta_Ji"
                            
                        elif(Upi_id=='8858420752'):
                            Amul_cost+=cost
                            Shop_name = "Amul"
                        
                        AllCost.append(cost)
                        TotalCost+=cost
                        if dateP in DayWiseCost:
                            DayWiseCost[dateP] += cost
                        else:
                            DayWiseCost[dateP] = cost
                      
                        break

            else:
                 print("No plain text body found.")
        #print("The number of transactions are ",len(AllCost),"\n","The totat spent was ",TotalCost)
        AllCost=np.array(AllCost,dtype=np.float64)
        Juice_cost = 0
        ans={
             "Transactions":len(AllCost),
             "Total":TotalCost,
             "NC": NC_Cost,
             "Amul":Amul_cost,
             "Nescafe":Nescafe_Cost,
             "Gupta":Gupta_cost,
             "Juice": Juice_cost,
             "DayWiseCost":DayWiseCost
        }
        print(json.dumps(ans))
        return ans
    mail.logout()

dt1 = "20-Aug-2025"
dt1=(dt1.strip().strip("'").strip('"'))
FindCostFromGivenDate("adithreganti@gmail.com",dt1)



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

print(extract_merchant("money sent to google"))
        


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
        "spending report"
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
    "compare_periods": [
        "compare months",
        "difference between months",
        "compare periods",
        "compare spending",
        "month to month difference",
        "compare last week and this week",
        "spending trend difference",
        "how much more did I spend",
        "expenses change",
        "compare time periods"
    ],
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