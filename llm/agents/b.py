
class Agent:
    def __init__(self,name):
        self.name=name

    def extract_data(self,query):
        #Will be overriden
        return {}
