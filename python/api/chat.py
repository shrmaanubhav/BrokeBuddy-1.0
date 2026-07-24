import json
import os

import pandas as pd
from fastapi import APIRouter, Request
from pydantic.v1 import BaseModel

from chat import ChatBot

router = APIRouter()

JSON_FILE_PATH = "assets/data_array.json"
BUDGET_JSON_PATH = "assets/budgets.json"

chatbot = ChatBot()
chatbot.initialize()


class QueryReq(BaseModel):
    query: str


@router.post("/chat")
async def bot(req: QueryReq):
    df = pd.read_json(JSON_FILE_PATH)

    budgets_df = pd.DataFrame()
    try:
        if os.path.exists(BUDGET_JSON_PATH):
            budgets_df = pd.read_json(BUDGET_JSON_PATH)
    except ValueError:
        budgets_df = pd.DataFrame()

    resp = chatbot.respond_using_graph(df, req.query, budgets_df)
    return {"response": resp}


@router.post("/updateData")
async def update_data(req: Request):
    data = await req.json()

    txns = data.get("transactions", [])

    with open(JSON_FILE_PATH, "w", encoding="utf-8") as f:
        json.dump(txns, f, indent=2, ensure_ascii=False)

    return {"message": f"Saved {len(txns)} transactions successfully"}