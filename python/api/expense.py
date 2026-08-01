from fastapi import APIRouter
from pydantic import BaseModel

from mail.service import get_transactions

router = APIRouter()


class ExpenseRequest(BaseModel):
    userId: str
    email: str
    date: str
    bankSenderEmail: str


@router.post("/expense")
async def parse_email(req: ExpenseRequest):
    return get_transactions(
        user_id=req.userId,
        recipient=req.email,
        start_date=req.date,
        sender=req.bankSenderEmail,
    )