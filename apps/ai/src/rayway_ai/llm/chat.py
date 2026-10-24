import json
import os

import httpx
from dotenv import load_dotenv

from rayway_ai.cards.repository import get_card, search_cards

load_dotenv()

OLLAMA_URL = os.environ["OLLAMA_URL"]
MODEL = "qwen3.5:9b"
MAX_STEPS = 5

SYSTEM_PROMPT = """
You must answer in the user's language.
Only talk about a card you previously searched via the tools.
Say clearly when you do not find informations about a card or the card itself, do not make up things.
Never make up new rules that do not exist.
If the user speaks french, answer in french.
"""

TOOLS = [{
    "type": "function",
    "function": {
      "name": "get_card",
      "description": "Get one card (stats and effect text, in English) from its code, e.g. OP01-001.",
      "parameters": {
        "type": "object",
        "properties": {
          "code": {"type": "string", "description": "Card code such as OP01-028"}
        },
        "required": ["code"]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "search_cards",
      "description": "Search for a card via the name in french or english",
      "parameters": {
        "type": "object",
        "properties": {
          "text": {"type": "string", "description": "card name such as Luffy"}
        },
        "required": ["text"]
      }
    }
  }
]

AVAILABLE = {"get_card": get_card, "search_cards": search_cards}

def chat(messages: list[dict]) -> dict:
    """Send the conversation to Ollama and return the assistant message"""
    response = httpx.post(
        f"{OLLAMA_URL}/api/chat",
        json={
            "model": MODEL,
            "stream": False,
            "think": False,
            "messages": messages,
            "tools": TOOLS
        },
        timeout=120
    )
    response.raise_for_status()
    return response.json()["message"]

def ask(question: str) -> str:
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": question}
    ]
    for _ in range (MAX_STEPS):
        reply = chat(messages)
        messages.append(reply)

        tool_calls = reply.get("tool_calls")
        if not tool_calls:
            return reply["content"]

        for call in tool_calls:
            name = call["function"]["name"]
            args = call["function"]["arguments"]
            if name not in AVAILABLE:
                messages.append({"role": "tool", "tool_name": name, "content": json.dumps({"error": "unknown tool"})})
            else:
                result = AVAILABLE[name](**args)
                messages.append(
                    {"role": "tool", "tool_name": name, "content": json.dumps(result, ensure_ascii=False)}
                )
    return "Too many tool calls, giving up."