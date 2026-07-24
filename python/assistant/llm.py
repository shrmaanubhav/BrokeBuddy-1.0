from dotenv import load_dotenv
from langchain_groq import ChatGroq
import os

load_dotenv()

MODEL = "llama-3.3-70b-versatile"

llm = ChatGroq(
    model=MODEL,
    api_key=os.getenv("API_KEY"),
    temperature=0.1,
)

llm2 = ChatGroq(
    model="openai/gpt-oss-20b",
    api_key=os.getenv("API_KEY"),
    temperature=0.1,
)