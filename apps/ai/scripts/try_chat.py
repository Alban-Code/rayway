from rayway_ai.llm.chat import ask

questions = [
    "Que fait la carte OP01-028 ?",
    "Cherche-moi une carte qui s'appelle Enel.",
    "Que fait la carte XX99-999 ?",
]

for question in questions:
    print(f"\n>>> {question}")
    print(ask(question))