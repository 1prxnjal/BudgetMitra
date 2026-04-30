import requests
import json

url = "http://127.0.0.1:5000/chat"
payload = {
    "message": "hello",
    "language": "English",
    "history": [],
    "budget_context": {}
}
headers = {'Content-Type': 'application/json'}

try:
    response = requests.post(url, data=json.dumps(payload), headers=headers, stream=True)
    print(f"Status Code: {response.status_code}")
    for chunk in response.iter_content(chunk_size=1024):
        if chunk:
            print(chunk.decode(), end='', flush=True)
except Exception as e:
    print(f"Error: {e}")
