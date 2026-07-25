from langgraph.graph import END, START, StateGraph

from assistant.nodes import (
    classify_action_node,
    extract_data_node,
    generate_node,
)
from assistant.state import ChatState


def build_graph(chatbot, expense_df, budget_df=None):
    graph = StateGraph(ChatState)

    graph.add_node(
        "classify",
        lambda state: classify_action_node(chatbot, state),
    )

    graph.add_node(
        "extract",
        lambda state: extract_data_node(
            chatbot,
            state,
            expense_df,
            budget_df,
        ),
    )

    graph.add_node(
        "generate",
        lambda state: generate_node(chatbot, state),
    )

    graph.add_edge(START, "classify")
    graph.add_edge("classify", "extract")
    graph.add_edge("extract", "generate")
    graph.add_edge("generate", END)

    return graph.compile()