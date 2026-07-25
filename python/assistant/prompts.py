from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate


def build_response_chains(llm):
    parser = StrOutputParser()

    response_chains = {}

    response_chains["expenses"] = (
        PromptTemplate(
            input_variables=[
                "query",
                "start_date",
                "end_date",
                "merchant",
                "total_expenses",
                "total_received",
                "merchant_expense",
                "merchant_debited_df",
                "merchant_credited_df",
                "merchant_received",
                "day_wise_spending",
                "max_spent_day",
                "min_spent_day",
                "history",
            ],
            template=(
                "You are a helpful financial assistant. Always use Indian Rupees (Rs).\n\n"

                "User query: {query}\n"
                "Conversation history (optional): {history}\n\n"

                "Relevant data (use only what is filled or meaningful):\n"
                "- Total spending(ALL MERCHANTS): {total_expenses}\n"
                "- Merchant: {merchant}\n"
                "- Spending on this merchant: {merchant_expense}\n"
                "- Date range: {start_date} to {end_date}\n"
                "- Day-wise spending: {day_wise_spending}\n"
                "- Highest spending day: {max_spent_day}\n"
                "- Lowest spending day: {min_spent_day}\n"
                "- Total received: {total_received}\n"
                "- Merchant received amount: {merchant_received}\n\n"

                "Guidelines:\n"
                "- Answer directly based on the user's query.\n"
                "- Only use the data provided; ignore empty or 'None' fields.\n"
                "- Do not describe irrelevant numbers.\n"
                "- Keep the answer concise and conversational.\n"
                "- If the user asks for a summary, provide one.\n"
                "- If the user asks a specific question, answer only that.\n"
            ),
        )
        | llm
        | parser
    )

    response_chains["budget"] = (
        PromptTemplate(
            input_variables=[
                "query",
                "start_date",
                "end_date",
                "merchant",
                "active_budget_status",
                "inactive_budgets",
                "exceeded_budgets",
                "budget_transactions",
                "budget_transactions_md",
                "message",
                "history",
            ],
            template=(
                "You are a helpful budget assistant. Always use Indian Rupees (Rs).\n\n"
                "User query: {query}\n"
                "Conversation history (optional): {history}\n\n"
                "Budget window considered: {start_date} to {end_date}\n"
                "Focus merchant (if any): {merchant}\n"
                "Active budgets with current spend: {active_budget_status}\n"
                "Exceeded budgets: {exceeded_budgets}\n"
                "Inactive budgets: {inactive_budgets}\n"
                "Relevant transactions (top by amount):\n{budget_transactions_md}\n"
                "System note: {message}\n\n"
                "Guidelines:\n"
                "- For each relevant budget: state amount set, amount spent, remaining, and whether exceeded.\n"
                "- Ground every number using the provided transactions or amounts; do not invent values.\n"
                "- If no matching budgets or transactions, say that briefly.\n"
                "- Explain each transaction explicitly.\n"
            ),
        )
        | llm
        | parser
    )

    return response_chains