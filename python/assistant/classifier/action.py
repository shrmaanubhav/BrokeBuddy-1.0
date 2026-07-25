from typing import Literal
from pydantic import BaseModel
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import PromptTemplate

from assistant.llm import llm2

class ExtractAction(BaseModel):
    action:Literal["budget","expenses","general","insight","merchant"]

action_parser = PydanticOutputParser(pydantic_object=ExtractAction)

action_template = PromptTemplate(
    input_variables=["query"],
    partial_variables={"format_instructions":action_parser.get_format_instructions()},
    template=""" Classify the user message into EXACTLY one of the following categories:
    "budget", "expenses", "general", "insight",

    Definitions:
    - budget: budgets, limits, savings goals, thresholds.
    - expenses: spending, totals, breakdowns, dates, transactions.
    - general: greetings, meta-questions, unrelated queries.
    - insight: trends, patterns, predictions, anomalies, summaries.
    
    based on {query}
    Strictly follow this:
    {format_instructions}

"""
)
action_classifer_chain = action_template|llm2|action_parser

def extract_action(query):

    res = action_classifer_chain.invoke({"query":query}).action
    return res

    
    # encodings = tokenizer(query,padding="max_length",truncation=True,return_tensors="pt")

    # out=model(**encodings)
    # pred=out.logits.argmax(dim=-1).item()
    # map={0:"budget",1:"expenses",2:"general",3:"insight",4:"merchant"}
    # return map[pred]

