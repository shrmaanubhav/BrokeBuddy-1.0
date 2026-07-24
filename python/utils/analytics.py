import pandas as pd


def filter_date(df, fromDate, toDate):
    fromDate = pd.to_datetime(fromDate)
    toDate = pd.to_datetime(toDate)
    df["Date"] = pd.to_datetime(df["Date"])
    filtered = df[(df["Date"] >= fromDate) & (df["Date"] <= toDate)]
    return filtered


def get_total_spent(df):
    return df["Transaction_Amount"].sum()


def category_wise_spending(df):
    return df.groupby("Category")["Transaction_Amount"].agg("sum").to_dict()


def get_top_merchants(df, n=5):
    return (
        df.groupby("Name")["Transaction_Amount"]
        .agg("sum")
        .sort_values(ascending=False)
        .head(n)
        .to_dict()
    )


def day_wise_spending(df, start, end):
    df = filter_date(df, start, end)
    df["Date"] = pd.to_datetime(df["Date"]).dt.date
    daily_spending = df.groupby("Date")["Transaction_Amount"].sum().to_dict()
    return {d.strftime("%Y-%m-%d"): amt for d, amt in daily_spending.items()}


def detect_large_expenses(df, threshold):
    filtered = df[df["Transaction_Amount"] >= threshold]
    return filtered[["Name", "Transaction_Amount"]].to_dict()


def compare_periods(df, start1, end1, start2, end2):
    period1 = filter_date(df, start1, end1)
    period2 = filter_date(df, start2, end2)

    return {
        f"{start1} - {end1}": get_total_spent(period1),
        f"{start2} - {end2}": get_total_spent(period2),
    }


def compute_merchant_expenses(debited, credited, merchant):
    if merchant is None or merchant == "all merchants":
        return {
            "merchant_expense": 0,
            "merchant_received": 0,
        }

    mer_debited = debited[
        debited["Name"].str.contains(merchant, case=False, na=False)
    ]
    mer_credited = credited[
        credited["Name"].str.contains(merchant, case=False, na=False)
    ]

    return {
        "merchant_debited_df": mer_debited,
        "merchant_credited_df": mer_credited,
        "merchant_expense": get_total_spent(mer_debited),
        "merchant_received": get_total_spent(mer_credited),
    }


def compute_category_expenses(debited, credited, category):
    if category is None or category == "all categories":
        return {
            "category_expense": 0,
            "category_received": 0,
        }

    cat_debited = debited[debited["Category"] == category]
    cat_credited = credited[credited["Category"] == category]

    return {
        "category_debited_df": cat_debited,
        "category_credited_df": cat_credited,
        "category_expense": get_total_spent(cat_debited),
        "category_received": get_total_spent(cat_credited),
    }   