from fastapi import APIRouter, Request

from email_parser import FindCostFromGivenDate

router = APIRouter()


@router.post("/expense")
async def parse_email(req: Request):
    data = await req.json()

    print("Raw JSON received:", data["email"])

    return FindCostFromGivenDate(
        data["email"],
        data["date"],
    )