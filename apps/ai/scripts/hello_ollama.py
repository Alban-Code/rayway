import httpx

response = httpx.post(
    "http://localhost:11434/api/chat",
    json={
        "model": "qwen3.5:9b",
        "stream": False,
        "think": False,
        "messages": [{"role": "user", "content": "Dis bonjour en une phrase"}],
    },
    timeout=60,
)
response.raise_for_status()
data=response.json()
print(data["message"]["content"])