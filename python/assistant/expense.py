from typing import Literal, Optional

from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import PromptTemplate
from pydantic import BaseModel

from assistant.llm import llm2


class Check(BaseModel):
    decision: Literal["yes", "no"]


check_parser = PydanticOutputParser(pydantic_object=Check)

add_expense_check = PromptTemplate(
    input_variables=["query"],
    partial_variables={
        "format_instructions": check_parser.get_format_instructions()
    },
    template="""
Decide if the user wants to add an expense transaction based on the query.

Only respond with "yes" or "no".

{format_instructions}

Query:
{query}
""",
)

add_expense_check_chain = add_expense_check | llm2 | check_parser


class AddExpense(BaseModel):
    amount: Optional[float]
    merchant: Optional[str]
    date: Optional[str]


parser = PydanticOutputParser(pydantic_object=AddExpense)

add_expense_prompt = PromptTemplate(
    input_variables=["query"],
    partial_variables={
        "format_instructions": parser.get_format_instructions()
    },
    template="""
Extract the amount (Rs), merchant name, and date from the user query for adding an expense.

{format_instructions}

Rules:
- Amount should be numeric.
- Merchant should be the payee/store/person.
- Date should be in "D-Mon-YYYY" format.
- If any field is missing, leave it empty (null).

Query:
{query}
""",
)

add_expense_chain = add_expense_prompt | llm2 | parser


def handle_add_expense(query: str):
    decision = (
        add_expense_check_chain.invoke({"query": query})
        .decision.strip()
        .lower()
    )

    if decision != "yes":
        return False

    result = add_expense_chain.invoke({"query": query})

    if (
        result.amount is not None
        and result.merchant is not None
        and result.date is not None
    ):
        return result

    return False