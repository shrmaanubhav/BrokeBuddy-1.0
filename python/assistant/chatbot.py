from python.assistant.agents.budget_agent import Budget
from python.assistant.agents.expense_agent import ExpenseAgent
from assistant.graph import build_graph
from assistant.prompts import build_response_chains
from assistant.state import default_state

from assistant.llm import llm


class ChatBot:
    MAX_HISTORY = 3

    def __init__(self):
        self.llm = None

        self.response_chains = {}

        self.agents = {
            "expenses": ExpenseAgent(),
            "budget": Budget(),
        }

        self.history = []
        self.state = default_state()

    def initialize(self):
        self.llm = llm
        self.response_chains = build_response_chains(self.llm)

    def add_to_history(self, query, response, data):
        self.history.append(
            {
                "User_Query": query,
                "agent_data": data,
                "Response": response,
            }
        )

        self.history = self.history[-self.MAX_HISTORY :]

    def get_history_text(self):
        return "\n".join(
            f"User: {entry['User_Query']}\nAssistant: {entry['Response']}"
            for entry in self.history
        )

    def reset_state(self):
        self.state = default_state()

    def respond_using_graph(
        self,
        expense_df,
        query,
        budget_df=None,
    ):
        self.reset_state()
        self.state["query"] = query

        graph = build_graph(
            self,
            expense_df,
            budget_df,
        )

        result = graph.invoke(self.state)

        return result["response"]