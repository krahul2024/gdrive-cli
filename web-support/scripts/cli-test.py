import json 

random_data = {
    "name" : "This is some name", 
    "age" : 56, 
    "role" : "This is some random role"
}

random_data_json = json.dumps(random_data) 

print(random_data_json) 

