from fastapi import APIRouter, Request
from mail.service import get_transactions

router = APIRouter()


@router.post("/expense")
async def parse_email(req: Request):
    data = await req.json()

    print("Raw JSON received:", data["email"])

    return get_transactions(
        user_id=data.get("userId", data["email"]),
        recipient=data["email"],
        start_date=data["date"],
    )
