from typing import Any, Dict, TypedDict


class ChatState(TypedDict):
    query: str
    context: dict | None
    action: str | None
    response: str | None
    merchant: str | None
    start_date: str | None
    end_date: str | None
    amount: float | None
    data: Dict[str, Any]
    score: float | None


def default_state() -> ChatState:
    return {
        "query": "",
        "context": None,
        "action": None,
        "response": None,
        "merchant": None,
        "start_date": None,
        "end_date": None,
        "amount": None,
        "data": {},
        "score": None,
    }