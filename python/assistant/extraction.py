from datetime import datetime
from typing import Optional

from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import PromptTemplate
from pydantic import BaseModel

from assistant.llm import llm
from utils.merchant import match_merchant_name


class ExtractionResult(BaseModel):
    merchant: Optional[str]
    start_date: Optional[str]
    end_date: Optional[str]


extraction_parser = PydanticOutputParser(
    pydantic_object=ExtractionResult
)

extraction_prompt = PromptTemplate(
    input_variables=["query", "today"],
    partial_variables={
        "format_instructions": extraction_parser.get_format_instructions()
    },
    template="""
You are a precise extractor that identifies the merchant name and date range from the given user query.

Use {today} as the reference for resolving relative dates (like "last week", "yesterday", "next month").

{format_instructions}

Rules:
1. Dates must be in the format "D-Mon-YYYY" (e.g. 1-Aug-2025, 10-Oct-2024, 5-Sep-2024).
2. If the year is not specified, assume the current year.
3. Handle both exact and relative date phrases.
4. Convert relative time phrases into concrete date ranges based on {today}.
5. If only one date is present, use it for both start_date and end_date.
6. If no date is present, return null for both start_date and end_date.
7. Output only the JSON object.

User query:
{query}
""",
)

extraction_chain = extraction_prompt | llm | extraction_parser


def extract_merchant_date(query: str):
    today = datetime.today()
    today_str = f"{today.day}-{today.strftime('%b-%Y')}"

    response = extraction_chain.invoke(
        {
            "query": query,
            "today": today_str,
        }
    )

    merchant = (
        match_merchant_name(response.merchant)
        if response.merchant
        else None
    )

    return (
        merchant,
        response.start_date,
        response.end_date,
    )