from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone

from api.chat import router as chat_router
from api.expense import router as expense_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", tags=["Health"])
def health():
    return {
        "status": "ok",
        "service": "brokebuddy-python",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

app.include_router(chat_router)
app.include_router(expense_router)