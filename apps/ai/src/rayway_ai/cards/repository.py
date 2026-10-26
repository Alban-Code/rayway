import os

import psycopg
from dotenv import load_dotenv
from psycopg.rows import dict_row

load_dotenv()

GET_CARD_BY_CODE = """
SELECT c."code", c."category", c."colors"::text[], c."cost", c."power", c."life", c."counterAmount", c."attributes"::text[], en."name" AS name_en, fr."name" AS name_fr, en."effect", en."triggerEffect"
FROM "Card" c
JOIN "CardTranslation" en ON en."cardId" = c."id" AND en."languageCode" = 'en'
LEFT JOIN "CardTranslation" fr ON fr."cardId" = c."id" AND fr."languageCode" = 'fr'
WHERE c."code" = %s
"""

SEARCH_CARD_BY_TEXT = """
SELECT c."code", c."category", c."colors"::text[], c."cost", en."name" AS name_en, fr."name" AS name_fr
FROM "Card" c
JOIN "CardTranslation" en ON en."cardId" = c."id" AND en."languageCode" = 'en'
LEFT JOIN "CardTranslation" fr ON fr."cardId" = c."id" AND fr."languageCode" = 'fr'
WHERE en."name" ILIKE %s OR fr."name" ILIKE %s
ORDER BY en."name"
LIMIT 10
"""

def get_card(code: str) -> dict | None:
    with psycopg.connect(os.environ["DATABASE_URL"]) as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(GET_CARD_BY_CODE, (code,))
            return cur.fetchone()

def search_cards(text: str) -> list[dict]:
    with psycopg.connect(os.environ["DATABASE_URL"]) as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            escaped = text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
            pattern = f"%{escaped}%"
            cur.execute(SEARCH_CARD_BY_TEXT, (pattern,pattern))
            return cur.fetchall()