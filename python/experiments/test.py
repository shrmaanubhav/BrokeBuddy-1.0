from graphviz import Digraph

def generate_langgraph_architecture():
    g = Digraph('LangGraph_Agent', format='png')
    g.attr(rankdir='LR', splines='ortho', bgcolor='white')

    # Cluster: ChatBot Core
    with g.subgraph(name='cluster_chatbot') as cb:
        cb.attr(label='ChatBot Orchestrator', style='filled', color='lightgrey')
        cb.node('llm', 'LLM (Language Model)', shape='box')
        cb.node('parser', 'Output Parser', shape='box')
        cb.node('response_chains', 'Response Chains', shape='box')
        cb.node('agents', 'Agents (e.g. ExpenseAgent)', shape='box')
        cb.node('history', 'History Buffer', shape='box')
        cb.node('state', 'Current State', shape='box')
        cb.edges([
            ('llm', 'parser'),
            ('parser', 'response_chains'),
            ('response_chains', 'agents'),
            ('agents', 'state'),
            ('state', 'history')
        ])

    # Cluster: LangGraph Pipeline
    with g.subgraph(name='cluster_graph') as lg:
        lg.attr(label='LangGraph Flow', style='filled', color='lightblue')
        lg.node('classify', 'classify_action_node\n→ extract_action()', shape='box')
        lg.node('extract', 'extract_data_node\n→ merchant_date(), ExpenseAgent.extract_data()', shape='box')
        lg.node('generate', 'generate_node\n→ LLM Response / Add Expense', shape='box')
        lg.edge('classify', 'extract')
        lg.edge('extract', 'generate')

    # External components
    g.node('user', 'User Query', shape='ellipse', style='filled', color='lightyellow')
    g.node('df', 'DataFrame (Transaction Data)', shape='cylinder', color='grey')
    g.node('utils', 'utils / utils2\n(extract_action, extraction_chain, match_merchant_name)', shape='note', color='lightgreen')

    # Connect flow
    g.edge('user', 'classify')
    g.edge('generate', 'llm')
    g.edge('extract', 'df')
    g.edge('classify', 'utils', label='action detection')
    g.edge('extract', 'utils', label='merchant/date parsing')
    g.edge('generate', 'history', label='append response')

    # Final output
    g.node('response', 'Final Response to User', shape='ellipse', style='filled', color='lightyellow')
    g.edge('generate', 'response')

    g.render('langgraph_agent_architecture', cleanup=True)
    print("✅ Architecture diagram generated: langgraph_agent_architecture.png")

generate_langgraph_architecture()
