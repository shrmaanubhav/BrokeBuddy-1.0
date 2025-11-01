from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Request
import json
from fastapi.responses import JSONResponse
# from langchain_groq import ChatGroq
from pydantic.v1 import BaseModel
from email_parser import FindCostFromGivenDate
import pandas as pd
from chat import *

JSON_FILE_PATH="data_array.json"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or set specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


chatbot=ChatBot()
chatbot.initialize()
class QueryReq(BaseModel):
    query:str

@app.post("/expense")
async def parseEmail(req:Request):
    data = await req.json()
    print("Raw JSON received:", data['email'])
    return FindCostFromGivenDate(data['email'],data['date'])
    

@app.post("/chat")
async def Bot(req:QueryReq):
    df = pd.read_json("data_array.json")
    resp = chatbot.respond_using_graph(df,req.query)
    return {"response": resp}

@app.post("/updateData")
async def UpdateData(req:Request):

        data = await req.json()
        txns=data.get("transactions",[])
        with open(JSON_FILE_PATH, "w", encoding="utf-8") as f:
            json.dump(txns, f, indent=2, ensure_ascii=False)

        return {"message": f"Saved {len(txns)} transactions successfully"}
    
