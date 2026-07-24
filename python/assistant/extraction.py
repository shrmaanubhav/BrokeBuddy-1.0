import datetime

from utils import match_merchant_name
from utils2 import extraction_chain


def extract_merchant_date(query: str):
    response = extraction_chain.invoke(
        {
            "query": query,
            "today": datetime.datetime.today().strftime("%-d-%b-%Y"),
        }
    )

    merchant = match_merchant_name(response.merchant)

    return (
        merchant,
        response.start_date,
        response.end_date,
    )