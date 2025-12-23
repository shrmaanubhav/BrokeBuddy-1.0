from langgraph.graph import StateGraph,START,END
from dateparser import parse

from langchain_core.output_parsers import StrOutputParser,PydanticOutputParser
from langchain_core.prompts import PromptTemplate
from utils import *
from utils2 import *
from pydantic import BaseModel
from typing import TypedDict,Optional,Any,Dict
import datetime
from dateutil.relativedelta import relativedelta
from agents.expense import ExpenseAgent
from agents.budget import Budget



class ChatState(TypedDict):
    query:str
    action:Optional[str]
    response:Optional[str]
    merchant:Optional[str]
    start_date:Optional[str]
    end_date:Optional[str]
    amount:Optional[float]
    data:Optional[Dict[str,Any]]
    score:Optional[float]

#LangGraph Nodes
def classify_action_node(state: ChatState, chatbot) -> ChatState:
    query = state['query']
    action = extract_action(query)
    score=1
    if(action=='general'):
        score=0.25
    # Context fallback: if score is low (<0.3), reuse last action
    if score < 0.3 and chatbot.history:
        last_action = chatbot.history[-1]["agent_data"].get("action")
        print(f"Low confidence ({score:.2f}), reusing last action: {last_action}")
        action = last_action or action

    state["action"] = action
    state["score"] = score
    print(score, action)
    return state


def extract_data_node(chatbot, state: ChatState, expense_df, budget_df=None) -> ChatState:
        query = state["query"]
        action = state.get("action")
        if not action or action not in chatbot.agents:
            state["response"] = "Sorry,can't help you with that :("
            return state

        merchant = None
        start_date = None
        end_date = None

        if action in ("expenses", "budget"):
            merchant, start_date, end_date = chatbot.merchant_date(query)

        def resolve_dates(start_value, end_value):
            if not start_value:
                start_value = state["start_date"] or (datetime.datetime.today() - relativedelta(months=1)).strftime("%-d-%b-%Y")
            if not end_value:
                end_value = state["end_date"] or datetime.datetime.today().strftime("%-d-%b-%Y")
            state["start_date"] = start_value
            state["end_date"] = end_value
            return start_value, end_value

        if action == "expenses":
            if not merchant:
                merchant = state["merchant"] or "all merchants"
            state["merchant"] = merchant
            start_date, end_date = resolve_dates(start_date, end_date)

            agent = chatbot.agents.get(action)
            state["data"] = agent.extract_data(query, expense_df, start_date, end_date, merchant)
            return state

        if action == "budget":
            budget_name = merchant
            if merchant:
                merchant = match_merchant_name(merchant)
            if not merchant:
                merchant = state["merchant"]

            state["merchant"] = merchant
            start_date, end_date = resolve_dates(start_date, end_date)

            agent = chatbot.agents.get(action)
            state["data"] = agent.extract_data(
                query,
                budget_df,
                expense_df,
                start_date,
                end_date,
                merchant,
                name=budget_name
            )
            # print("\n\nCHECK2:",state['data'])
            return state

        return state





def generate_node(chatbot,state:ChatState)->ChatState:
        action = state['action']
        data = state.get("data") or {}
        query = state["query"]
        merchant = state["merchant"]
        start_date = state["start_date"]
        end_date = state["end_date"]

        if action == "expenses":
            res = handle_add_expense(query)
            print("Handling add expense:", res)
            if res != False:
                amount = res.amount
                date = res.date
                merchant = res.merchant
                add_expense_in_database(merchant, date, amount)
                state['response'] = f"Noted an expense of {amount} on {merchant} at {date}."
                chatbot.add_to_history(query, state['response'], {"action": "add_expense", "amount": amount, "merchant": merchant, "date": date})
                return state
            else:
                chain = chatbot.response_chains[action]
                history = chatbot.get_history_text()
                resp = chain.invoke({"history": history, "query": query, "start_date": start_date, "end_date": end_date, "merchant": merchant, **data})
                state['response'] = resp
                chatbot.add_to_history(query, resp, data)
                return state

        if action == "budget":
            chain = chatbot.response_chains[action]
            history = chatbot.get_history_text()
            print("MARKDOWN: ",data.get("transactions_markdown", "No relevant transactions found."))
            resp = chain.invoke({
                "history": history,
                "query": query,
                "start_date": start_date,
                "end_date": end_date,
                "merchant": merchant,
                **data,
                "budget_transactions": data.get("budget_transactions", data.get("transactions", [])),
                "budget_transactions_md": data.get("transactions_markdown", "No relevant transactions found."),
                "message": data.get("message", "")
            })
            state['response'] = resp
            chatbot.add_to_history(query, resp, data)
            return state

        state["response"] = state.get("response") or "Sorry,can't help you with that :("
        return state





class ChatBot():
    def __init__(self):
        self.llm=None
        self.query_classifier=extract_action
        self.response_chains={}
        self.agents={
            "expenses":ExpenseAgent(),
            "budget":Budget()
        }
        self.parser=None
        self.history=[]

        self.state = {
            "query": None,
            "action": None,
            "response": None,
            "merchant": None,
            "start_date": None,
            "end_date": None,
            "data": {},
            "score": None
        }
    
    def initialize(self):
        #Initialize Model,parser
        #Prompts for different actions

        self.llm=llm

        self.parser=StrOutputParser()
       
        self.response_chains["expenses"] = PromptTemplate(
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
                "history"
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
            )
        ) | self.llm | self.parser

        self.response_chains["budget"] = PromptTemplate(
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
                "history"
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
                "Guidelines :\n"
                "- For each relevant budget: state amount set, amount spent, remaining, and whether exceeded.\n"
                "- Ground every number using the provided transactions or amounts; do not invent values.\n"
                "- If no matching budgets or transactions, say that briefly.\n"
                "- Explain Each Transaction Explicitly"
            )
        ) | self.llm | self.parser

    def merchant_date(self,query):
        response = extraction_chain.invoke({"query": query, "today": datetime.datetime.today().strftime("%-d-%b-%Y")})
        print("Merchant value:", response.merchant)
        print("Start date:", response.start_date)
        print("End date:", response.end_date)


        merchant=match_merchant_name(response.merchant) 
        print(merchant)
        start=response.start_date
        end=response.end_date
        return merchant,start,end

    def add_to_history(self,query,resp,data):
        # self.history.append({
        #     "User_Query":query,
        #     "agent_data":data,
        #     "Response":resp
        # })
        if(len(self.history)>3):
            self.history=self.history[-3:]
    
    def get_history_text(self):
        return "\n".join(
            [f"User: {h['User_Query']}\nAssistant: {h['Response']}" for h in self.history]
        )

    
    #LangGraph Nodes
   

    def build_graph(self,expense_df,budget_df=None):
        graph = StateGraph(ChatState)

        graph.add_node("classify", lambda s:classify_action_node(s,self))
        graph.add_node("extract", lambda s: extract_data_node(self,s, expense_df, budget_df))
      
        graph.add_node("generate", lambda s: generate_node(self,s))


        graph.add_edge(START,"classify")
        graph.add_edge("classify","extract")
        graph.add_edge("extract","generate")
        
        graph.add_edge("generate",END)

        return graph.compile()
    
    def respond_using_graph(self,expense_df,query,budget_df=None):
        self.state["query"]=query
        graph = self.build_graph(expense_df,budget_df)
        result=graph.invoke(self.state)
        self.state.update(result)
        
        return result["response"]



if __name__ == "__main__":
    import pandas as pd

    df = pd.read_json("data_array.json")
    try:
        budgets_df = pd.read_json("budgets.json")
    except (ValueError, FileNotFoundError):
        budgets_df = pd.DataFrame()

    chatbot = ChatBot()
    chatbot.initialize()

    print(" LangGraph Financial Assistant ready!")

    while True:
        query = input("You: ")
        if query.lower() in ["exit", "quit"]:
            print("Assistant: Goodbye 👋")
            break

        response = chatbot.respond_using_graph(df, query, budgets_df)
        print(f"Assistant: {response}\n")
    print(ext("How much did i spend on Suraj last week?"))

    print(extract_merchant("How much have i spent on zepto last month"))
    resp=extraction_chain.invoke({"query":"How much did I spend last month on Zepto","today":datetime.datetime.today().strftime("%-d-%b-%Y")})
    
    
    print(resp.merchant)
