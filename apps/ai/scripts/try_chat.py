from rayway_ai.llm.chat import ask

questions = [
    "Que fait la carte OP01-028 ? Est ce qu'elle peut se jouer dans un deck buggy OP09 ?",
    "Cherche-moi une carte qui s'appelle Enel et explique moi son effet ainsi que son cout",
    "Est ce que je peux jouer une carte personnage de ma main avec l'effet leader de Lim alors que j'ai joué Shanks à 10DON!! vert qui dit que on ne peut plus jouer de cartes de la main ?",
]

for question in questions:
    print(f"\n>>> {question}")
    print(ask(question))