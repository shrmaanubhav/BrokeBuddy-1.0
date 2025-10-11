
from transformers import AutoModelForSequenceClassification,AutoTokenizer

model= AutoModelForSequenceClassification.from_pretrained("intent_classifier_model")
tokenizer = AutoTokenizer.from_pretrained("intent_classifier_model")
model.eval()

def extract_action(query):
    
    encodings = tokenizer(query,padding="max_length",truncation=True,return_tensors="pt")

    out=model(**encodings)
    pred=out.logits.argmax(dim=-1).item()
    map={0:"budget",1:"expenses",2:"general",3:"insight",4:"merchant"}
    return map[pred]


#print(extract_action("How much did i spend on Suraj last week?"))