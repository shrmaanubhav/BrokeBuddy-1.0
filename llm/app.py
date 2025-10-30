from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Request
# from langchain_groq import ChatGroq
from pydantic.v1 import BaseModel
from email_parser import FindCostFromGivenDate
import pandas as pd
from chat import *
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or set specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

df = pd.read_json("data_array.json")
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
    resp = chatbot.respond_using_graph(df,req.query)
    return {"response": resp}

