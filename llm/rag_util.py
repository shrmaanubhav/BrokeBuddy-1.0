
import numpy as np
import faiss
import json


def create_chunks(obj_arr,file_name):
    chunks=[]
    
    for chunk in obj_arr:
        Status = chunk.get("Status","DEBITED")
        Id=chunk.get("Id","None")
        UPI_id=chunk.get("UPI_id","None")
        Name=chunk.get("Name","None")
        Balance=chunk.get("Balance","None")
        Transaction_Amount=chunk.get("Transaction_Amount","None")
        Date = chunk.get("Date","None")
    
        text = f'{Status} Rs {Transaction_Amount} from {Name} via {UPI_id} on {Date}. Balance is {Balance}'
        metadata = {"Status":Status,"Id":Id,"UPI_id":UPI_id,"Name":Name,"Balance":Balance,"Transaction_Amount":Transaction_Amount,"Date":Date}
        
        chunk_data = {"Id":Id,"text":text,"metadata":metadata}
        chunks.append(chunk_data)
    
    with open(file_name,"w") as f:
        f.write(json.dumps(chunks))


#Loades into vectorDB , a function is required to extract top k transactions
def load_into_faiss(model,file_name):
    with open(file_name,"r") as f:
        chunks=json.load(f)
    
    texts = [chunk["text"] for chunk in chunks]

    embeddings = model.encode(texts,batch_size=32,show_progress_bar=True)
    embeddings=np.array(embeddings).astype("float32")


    
    dim = embeddings.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(embeddings)
    
    meta_data_store = [chunk["metadata"] for chunk in chunks]

    return index,meta_data_store

    
def get_top_transaction(query,model):
    index,meta_data_store=load_into_faiss("chunks.json")
    q_emb = model.encode([query]).astype("float32")

    D, I = index.search(q_emb, k=5)
    data=[]
    for idx in I[0]:
        data.append(meta_data_store[idx])
        
    return data



