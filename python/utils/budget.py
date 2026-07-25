import pandas as pd


def filter_budgets(df, start_date, end_date, merchant=None, category=None, name=None):
    """
    Returns active/inactive budgets that overlap with the requested date range.
    """
    if df is None or df.empty:
        return {"active_budgets": [], "inactive_budgets": []}

    filtered = df.copy()

    if name:
        filtered = filtered[
            filtered["name"].str.contains(name, case=False, na=False)
        ]

    if merchant:
        filtered = filtered[filtered["merchant"] == merchant]

    if category:
        filtered = filtered[filtered["category"] == category]

    if filtered.empty:
        return {"active_budgets": [], "inactive_budgets": []}

    required_cols = {"start_date", "end_date"}

    if not required_cols.issubset(filtered.columns):
        return {"active_budgets": [], "inactive_budgets": []}

    filtered["start_date"] = pd.to_datetime(filtered["start_date"])
    filtered["end_date"] = pd.to_datetime(filtered["end_date"])

    start_dt = pd.to_datetime(start_date) if start_date else None
    end_dt = pd.to_datetime(end_date) if end_date else None

    active_mask = pd.Series(True, index=filtered.index)

    if start_dt is not None:
        active_mask &= filtered["end_date"] >= start_dt

    if end_dt is not None:
        active_mask &= filtered["start_date"] <= end_dt

    active_budgets = filtered[active_mask]
    inactive_budgets = filtered[~active_mask]

    return {
        "active_budgets": active_budgets.to_dict(orient="records"),
        "inactive_budgets": inactive_budgets.to_dict(orient="records"),
    }