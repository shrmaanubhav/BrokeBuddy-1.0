from langgraph.graph import StateGraph,START,END
from dateparser import parse
from langchain_groq import ChatGroq
from langchain_core.output_parsers import StrOutputParser,PydanticOutputParser
from langchain_core.prompts import PromptTemplate
from utils import *
from utils2 import *
from pydantic import BaseModel
from typing import TypedDict,Optional,Any,Dict
import datetime
from dateutil.relativedelta import relativedelta

MODEL = "llama-3.1-8b-instant"

class Agent:
    def __init__(self,name):
        self.name=name

    def extract_data(self,query):
        #Will be overriden
        return {}



llm=ChatGroq(
    model=MODEL,
    api_key="REMOVED_GROQ_KEY",
    temperature=0.1
)

class ExtractionResult(BaseModel):
    merchant:Optional[str]
    start_date:Optional[str]
    end_date:Optional[str]

parser = PydanticOutputParser(pydantic_object=ExtractionResult)

extraction_prompt = PromptTemplate(
    input_variables=["query", "today"],
    partial_variables={"format_instructions":parser.get_format_instructions()},
    template=(
        """
You are a precise extractor that identifies the merchant name and date range from the given user query.

Use {today} as the reference for resolving relative dates (like "last week", "yesterday", "next month").

{format_instructions}

### Rules:
1. Dates must be in the format **"D-Mon-YYYY"** (e.g., 1-Aug-2025,10-Oct-2024,5-Sep-2024).
If year is not specified, assume current year.
2. Handle both exact and relative date phrases.
3. Convert relative time phrases into concrete date ranges based on {today}.
4. If only one date is present, use the same date for both `start_date` and `end_date`.
5. If only one date is present, use it for both start_date and end_date
6.If no date, return null for both
7.Output only the JSON object, nothing else.

User query:
{query}
"""
    )
)


extraction_chain = extraction_prompt|llm|parser





class ExpenseAgent(Agent):
    def __init__(self):
        super().__init__("expenses")
    
    def extract_data(self, query,df,start,end,merchant):
        
        merchant_exp=0
        filtered=df.copy()
        total_expenses=0

        if start is not None and end is not None:
         filtered = filter_date(filtered, start, end)
        elif start is not None:  # if only start provided
            filtered = filtered[filtered["Date"] >= pd.to_datetime(start)]
        elif end is not None:  # if only end provided
            filtered = filtered[filtered["Date"] <= pd.to_datetime(end)]

        total_expenses=get_total_spent(filtered)

        if merchant!="all merchants":
            print(merchant)
            filtered = filtered[filtered['Name'].str.contains(merchant, case=False, na=False)]
            merchant_exp=get_total_spent(filtered)
            print(filtered)
           
        day_wise_spending_dict=day_wise_spending(filtered,start,end)
        max_spent_day={}
        min_spent_day={}
        
        if day_wise_spending_dict:
            max_date=max(day_wise_spending_dict,key=day_wise_spending_dict.get)
            max_value = day_wise_spending_dict[max_date]
            max_spent_day[max_date]=max_value

            min_date=min(day_wise_spending_dict,key=day_wise_spending_dict.get)
            min_value = day_wise_spending_dict[min_date]
            min_spent_day[min_date]=min_value


        return {"action": "expenses",
                "merchant_expense": merchant_exp,
                "total":total_expenses,
                "max_spent_day":max_spent_day,
                "min_spent_day":min_spent_day,
                "day_wise_spending": day_wise_spending(filtered, start, end)
            }




class ChatState(TypedDict):
    query:str
    action:Optional[str]
    response:Optional[str]
    merchant:Optional[str]
    start_date:Optional[str]
    end_date:Optional[str]
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


def extract_data_node(chatbot,state:ChatState,df)->ChatState:
        query = state["query"]
        action = state.get("action")
        if not action or action not in chatbot.agents:
            state["response"]="Sorry,can't help you with that :("
            return state
        
        merchant,start_date,end_date = chatbot.merchant_date(query)
        if not merchant:
            if state["merchant"]:
                merchant = state["merchant"]
            else:
                merchant="all merchants"
        
        state["merchant"]=merchant
        if not start_date:
            if state["start_date"]:
                start_date=state["start_date"]
            else:
                start_date = (datetime.datetime.today() - relativedelta(months=1)).strftime("%-d-%b-%Y")
        state["start_date"]=start_date
        if not end_date:
            if state["end_date"]:
                end_date=state["end_date"]
            else:
                end_date=datetime.datetime.today().strftime("%-d-%b-%Y")
        state["end_date"]=end_date

        agent = chatbot.agents.get(action)
        state["data"]=agent.extract_data(query,df,start_date,end_date,merchant)
        
        print(state["data"])
        return state





def generate_node(chatbot,state:ChatState)->ChatState:
        action=state['action']
        data=state["data"]
        query=state["query"]
        merchant=state["merchant"]
        start_date=state["start_date"]
        end_date=state["end_date"]
        chain = chatbot.response_chains[action]
        history = chatbot.get_history_text()
        resp = chain.invoke({"history":history,"query":query,"start_date":start_date,"end_date":end_date,"merchant":merchant,**data})
        state['response']=resp
        chatbot.add_to_history(query,resp,data)
        return state





class ChatBot():
    def __init__(self):
        self.llm=None
        self.query_classifier=extract_action
        self.response_chains={}
        self.agents={"expenses":ExpenseAgent()}
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

        self.llm=ChatGroq(model=MODEL,api_key="REMOVED_GROQ_KEY",temperature=0.1)

        self.parser=StrOutputParser()
       
        self.response_chains["expenses"] = PromptTemplate(
    input_variables=[
        "history","query","total","merchant","merchant_expense",
        "start_date","end_date",
        "day_wise_spending","max_spent_day","min_spent_day"
    ],
    template=(
        "You are a financial assistant.\n\n"
       
        "History: {history}\n\n"
        "User query: {query}\n\n"
        "Facts:\n"
        "- Total expenses in the date range: {total}\n"
        "- Merchant: {merchant}\n"
        "- Expenses on this merchant: {merchant_expense}\n"
       
        "- Date range: {start_date} to {end_date}\n"
        "- Day-wise spending: {day_wise_spending}\n"
        "- Highest spending day: {max_spent_day}\n"
        "- Lowest spending day: {min_spent_day}\n\n"
        "Instructions:\n"
        "1. Always distinguish between total expenses and merchant expenses.\n"
        "2. Clearly report both values with units (e.g., $).\n"
        "3. Mention merchant share % of total.\n"
        "4. Summarize spending trends (high/low days, spikes) if multiple days exist.\n"
        "5. If only one merchant transaction, phrase it as 'one transaction of X on Y'.\n"
        "6. Do not claim missing data if numbers are provided.\n"
        "7. Keep response factual and under 7 sentences."
    )
) | self.llm | self.parser

    def merchant_date(self,query):
        response = extraction_chain.invoke({"query": query, "today": datetime.datetime.today().strftime("%-d-%b-%Y")})
        print("LLM response:", response)
        # response=json.loads(response)
        # response = parser.parse(response)
        merchant=match_merchant_name(response.merchant) 
        # print("Merchant", merchant)
        start=response.start_date
        end=response.end_date
        return merchant,start,end

    def add_to_history(self,query,resp,data):
        self.history.append({
            "User_Query":query,
            "agent_data":data,
            "Response":resp
        })
        if(len(self.history)>3):
            self.history=self.history[-3:]
    
    def get_history_text(self):
        return "\n".join(
            [f"User: {h['User_Query']}\nAssistant: {h['Response']}" for h in self.history]
        )

    
    #LangGraph Nodes
   

    def build_graph(self,df):
        graph = StateGraph(ChatState)

        graph.add_node("classify", lambda s:classify_action_node(s,self))
        graph.add_node("extract", lambda s: extract_data_node(self,s, df))
        # graph.add_node("resolve", lambda s: resolve_context_node(self,s, df))
        graph.add_node("generate", lambda s: generate_node(self,s))


        graph.add_edge(START,"classify")
        graph.add_edge("classify","extract")
        graph.add_edge("extract","generate")
        # graph.add_edge("resolve","generate")
        graph.add_edge("generate",END)

        return graph.compile()
    
    def respond_using_graph(self,df,query):
        self.state["query"]=query
        graph = self.build_graph(df)
        result=graph.invoke(self.state)
        self.state.update(result)
        
        return result["response"]



if __name__ == "__main__":
    import pandas as pd

    df = pd.read_json("data_array.json")

    chatbot = ChatBot()
    chatbot.initialize()

    print(" LangGraph Financial Assistant ready!")

    while True:
        query = input("You: ")
        if query.lower() in ["exit", "quit"]:
            print("Assistant: Goodbye 👋")
            break

        response = chatbot.respond_using_graph(df, query)
        print(f"Assistant: {response}\n")
    #print(ext("How much did i spend on Suraj last week?"))

    #print(extract_merchant("How much have i spent on zepto last month"))
    # resp=extraction_chain.invoke({"query":"How much did I spend last month on Zepto","today":datetime.datetime.today().strftime("%-d-%b-%Y")})
    
    
    # print(resp.merchant)



