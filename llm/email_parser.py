import imaplib as imp
import email
from bs4 import BeautifulSoup  
import numpy as np
import json

def FindCostFromGivenDate(email1,dt):
    password="zkuf ffzp gwan hngs"
    mail = imp.IMAP4_SSL("imap.gmail.com")
    reponse,data=mail.login(email1.strip(),password.strip()) 
    if(reponse!='OK'):
        print("Wrong Credentials ")
    mail.select("inbox")
        
    date = dt
    _, data = mail.search(None, f'(FROM "kblalerts@ktkbank.in" SINCE {date})')
   
    email_ids = data[0].split()

    if not email_ids:
        print("No emails found.")
    else:
        AllCost =[]
        transactions=[]
        DayWiseCost = {}
        TotalCost=0.0
        NC_Cost=0.0
        Nescafe_Cost=0.0
        Amul_cost=0.0
        Gupta_cost=0.0
        _, mail_data = (mail.fetch(b",".join(email_ids),  "(RFC822)"))
        transac_ids=set()
       
        for i in mail_data:
                
            if isinstance(i, tuple):  
                raw_email = i[1]
                msg = email.message_from_bytes(raw_email)
                
                arr=(msg.__getitem__('Date').split(',')[1].split('+')[0].split(" "))
               
                dateP=arr[1]+'-'+arr[2]+'-'+arr[3]
               
            body = ""
            if msg.is_multipart(): 
                for part in msg.walk():
                    content_type = part.get_content_type()
                   
                    
                    if(content_type=='text/html'):
                        try:
                                html = part.get_payload(decode=True).decode()
                                soup = BeautifulSoup(html, "html.parser")
                                body = soup.get_text(separator="\n", strip=True)  
                        except:
                                continue

            if body:
                
                for i in body.split('\n'):
                    if("DEBITED for Rs" in i):
                        
                       #  cost = (i.split("DEBITED for Rs.")[1].split()[0].replace(",",""))
                        details = (i.split("DEBITED for Rs.")[1].split())
                        cost = float(details[0].replace(",",""))
                        Upi_id=details[1].upper()
                        if(Upi_id[0]!='U'):
                            continue
                        
                      
                        Upi_id=Upi_id.split(':')[2].split("(")[0].split('-')[0]
                       
                    
                        transac_id = details[1].split(':')[1]

                        Shop_name = ''

                        if(transac_id in transac_ids):
                            continue
                        transac_ids.add(transac_id)
                        transactions.append({"COST":cost,"UPI_ID":Upi_id,"DEBITED":True})
                        AllCost.append(cost)
                        TotalCost+=cost
                        if dateP in DayWiseCost:
                            DayWiseCost[dateP] += cost
                        else:
                            DayWiseCost[dateP] = cost
                      
                        break
                    elif("CREDITED for Rs" in i):
                        details = (i.split("CREDITED for Rs.")[1].split())
                        cost = float(details[0].replace(",",""))
                        Upi_id=details[1].upper()
                        if(Upi_id[0]!='U'):
                            continue
                        
                      
                        Upi_id=Upi_id.split(':')[2].split("(")[0].split('-')[0]
                       
                    
                        transac_id = details[1].split(':')[1]

                      

                        if(transac_id in transac_ids):
                            continue
                        transac_ids.add(transac_id)
                        
                        transactions.append({"COST":cost,"UPI_ID":Upi_id,"DEBITED":False})
                        
                      
                        break
                        


            else:
                 print("No plain text body found.")
        
        AllCost=np.array(AllCost,dtype=np.float64)
        Juice_cost = 0
        ans={
             "Transactions":len(AllCost),
             "Total":TotalCost,
             "DayWiseCost":DayWiseCost,
             "Transactions":transactions
        }
        print(json.dumps(ans))
        return ans
    mail.logout()

print(FindCostFromGivenDate(email1="adithreganti@gmail.com",dt="7-Oct-2025"))