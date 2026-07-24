import datetime

from dateutil.relativedelta import relativedelta

from .extraction import extract_merchant_date
from assistant.expense import handle_add_expense
from .state import ChatState

from assistant.classifier import extract_action


DEFAULT_RESPONSE = "Sorry, can't help you with that."


def resolve_date_range(
    state: ChatState,
    start_date: str | None,
    end_date: str | None,
) -> tuple[str, str]:
    if not start_date:
        start_date = (
            state["start_date"]
            or (datetime.datetime.today() - relativedelta(months=1)).strftime("%-d-%b-%Y")
        )

    if not end_date:
        end_date = (
            state["end_date"]
            or datetime.datetime.today().strftime("%-d-%b-%Y")
        )

    state["start_date"] = start_date
    state["end_date"] = end_date

    return start_date, end_date


def classify_action_node(chatbot, state: ChatState) -> ChatState:
    query = state["query"]

    action = extract_action(query)
    score = 1.0

    if action == "general":
        score = 0.25

    if score < 0.3 and chatbot.history:
        last_action = chatbot.history[-1]["agent_data"].get("action")
        if last_action:
            action = last_action

    state["action"] = action
    state["score"] = score

    return state


def extract_data_node(
    chatbot,
    state: ChatState,
    expense_df,
    budget_df=None,
) -> ChatState:
    query = state["query"]
    action = state["action"]

    if action not in chatbot.agents:
        state["response"] = DEFAULT_RESPONSE
        return state

    merchant = None
    start_date = None
    end_date = None

    if action in ("expenses", "budget"):
        merchant, start_date, end_date = extract_merchant_date(query)

    start_date, end_date = resolve_date_range(
        state,
        start_date,
        end_date,
    )

    agent = chatbot.agents[action]

    if action == "expenses":
        merchant = merchant or state["merchant"] or "all merchants"
        state["merchant"] = merchant

        state["data"] = agent.extract_data(
            query,
            expense_df,
            start_date,
            end_date,
            merchant,
        )

        return state

    if action == "budget":
        budget_name = merchant

        if not merchant:
            merchant = state["merchant"]

        state["merchant"] = merchant

        state["data"] = agent.extract_data(
            query,
            budget_df,
            expense_df,
            start_date,
            end_date,
            merchant,
            name=budget_name,
        )

        return state

    return state


def generate_node(chatbot, state: ChatState) -> ChatState:
    action = state["action"]
    query = state["query"]

    data = state["data"]

    merchant = state["merchant"]
    start_date = state["start_date"]
    end_date = state["end_date"]

    history = chatbot.get_history_text()

    if action == "expenses":
        result = handle_add_expense(query)

        if result:
            amount = result.amount
            date = result.date
            merchant = result.merchant


            response = (
                f"Noted an expense of {amount} on {merchant} at {date}."
            )

            state["response"] = response

            chatbot.add_to_history(
                query,
                response,
                {
                    "action": "add_expense",
                    "amount": amount,
                    "merchant": merchant,
                    "date": date,
                },
            )

            return state

        response = chatbot.response_chains[action].invoke(
            {
                "history": history,
                "query": query,
                "start_date": start_date,
                "end_date": end_date,
                "merchant": merchant,
                **data,
            }
        )

        state["response"] = response
        chatbot.add_to_history(query, response, data)

        return state

    if action == "budget":
        response = chatbot.response_chains[action].invoke(
            {
                "history": history,
                "query": query,
                "start_date": start_date,
                "end_date": end_date,
                "merchant": merchant,
                **data,
                "budget_transactions": data.get(
                    "budget_transactions",
                    data.get("transactions", []),
                ),
                "budget_transactions_md": data.get(
                    "transactions_markdown",
                    "No relevant transactions found.",
                ),
                "message": data.get(
                    "message",
                    "",
                ),
            }
        )

        state["response"] = response
        chatbot.add_to_history(query, response, data)

        return state

    state["response"] = state["response"] or DEFAULT_RESPONSE

    return state