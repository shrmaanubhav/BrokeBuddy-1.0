AMOUNT_PATTERNS = [
    r"(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)",
]

REFERENCE_PATTERNS = [
    r"UPI:(\d+)",
    r"UPI Ref(?: No)?[: ]+(\d+)",
    r"UTR[: ]+([A-Za-z0-9]+)",
    r"Reference(?: No)?[: ]+([A-Za-z0-9]+)",
]

UPI_ID_PATTERNS = [
    r"([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+)",
]

MERCHANT_PATTERNS = [
    r"\(([^()]+?)-clear",
    r"\(([^()]+?)\)",
]

BALANCE_PATTERNS = [
    r"Balance(?: is)?\s*Rs\.?\s*([\d,]+(?:\.\d{1,2})?)",
]

BANK_PATTERNS = {
    "Karnataka Bank": [
        "kbl.bank.in",
        "karnataka bank",
    ],
    "SBI": [
        "state bank",
        "sbi",
    ],
    "HDFC": [
        "hdfc",
    ],
    "ICICI": [
        "icici",
    ],
    "Axis": [
        "axis",
    ],
}