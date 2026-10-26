import json
import os
from pathlib import Path

import httpx
from dotenv import load_dotenv

from rayway_ai.cards.repository import get_card, search_cards

load_dotenv()

OLLAMA_URL = os.environ["OLLAMA_URL"]
MODEL = "qwen3.5:9b"
MAX_STEPS = 5

RULES = Path(__file__).with_name("rules.md").read_text(encoding="utf-8")

BEHAVIOR = """You are a coach for the One Piece Card Game.

Language:
- Answer in the language of the user's last message.
- If the user writes in French and a card has name_fr, use name_fr; otherwise use name_en.

Facts:
- Only state facts about a card that come from the tools. Look cards up with the tools before talking about them.
- If a card or a piece of information is not found, say so clearly. Do not guess.
- A null field means the card's category has no such value (see the rules below). Do not mention it and never replace it with a made-up value.
- Use only the rules below. If the rules do not cover a question, say you are not sure instead of inventing a rule.
"""

SYSTEM_PROMPT = f"{BEHAVIOR}\n{RULES}"

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
      "description": "Search cards by name (french or english). Returns only a short summary (code, names, category, cost, colors), up to 10 results. Then use get_card with the code to get power, life, counter, attributes and effect text.",
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
            "options": {"num_ctx": 8192},
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