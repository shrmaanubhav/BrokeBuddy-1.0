import pandas as pd
from fastapi import APIRouter
from pydantic import BaseModel

from services.chatbot_service import chatbot

router = APIRouter()


class QueryReq(BaseModel):
    query: str
    transactions: list = []
    budgets: list = []


@router.post("/chat")
async def bot(req: QueryReq):
    df = pd.DataFrame(req.transactions)

    if not df.empty:
        df = pd.DataFrame(
            {
                "Status": df["debited"].map(
                    lambda x: "DEBITED" if x else "CREDITED"
                ),
                "Id": df["id"],
                "UPI_id": df["upiId"].fillna(""),
                "Name": df["merchant"].fillna(""),
                "Balance": 0,  # Prisma doesn't store balance
                "Transaction_Amount": df["amount"],
                "Date": (
                    pd.to_datetime(df["transactionDate"], utc=True)
                    .dt.tz_localize(None)
                    .dt.strftime("%d-%b-%Y")
                ),
                "Category": (
                    df["category"]
                    .fillna("OTHER")
                    .str.title()
                    .replace(
                        {
                            "Dining": "Food",
                            "Other": "Uncategorized",
                        }
                    )
                ),
            }
        )

    budgets_df = pd.DataFrame(req.budgets)

    resp = chatbot.respond_using_graph(
        df,
        req.query,
        budgets_df,
    )

    return {"response": resp}