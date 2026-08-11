# Tests manuels — `decks/`

Jeu de payloads sur de **vraies données** de la base (leader **EB02-010** Monkey D. Luffy, couleurs **Green + Purple**).

Deux fichiers `.http` :
- **`decks.http`** — validation du **POST** (8 cas de règles métier, tableau ci-dessous).
- **`decks-crud.http`** — **cycle de vie complet** POST → GET → PUT → DELETE + ownership. Requêtes *nommées* : l'`id` du deck créé est réinjecté tout seul dans les PUT/DELETE.

Bodies isolés pour Postman : **`decks/*.json`**.

## Utilisation

1. Lance l'API : `npm run dev:api`.
2. **Connecte-toi d'abord** (auth par cookie de session) : `POST /api/auth/sign-in/email` avec `{ email, password }`. Le cookie posé sert ensuite automatiquement (cookie jar Postman / REST Client).
3. Envoie chaque body.

> ⚠️ **Piège `Origin`.** Better Auth rejette les requêtes d'auth sans header `Origin` de confiance → **403 `MISSING_OR_NULL_ORIGIN`**. REST Client / curl n'en envoient **pas** par défaut. Les `.http` posent donc `Origin: http://localhost:5173` sur les requêtes `sign-up`/`sign-in`. En curl : `-H "Origin: http://localhost:5173"`.

## Scénarios `POST` (`decks.http`) — résultats attendus

| # | Fichier | Attendu | Règle testée |
|---|---------|---------|--------------|
| 1 | `01-valid.json` | **201** + `DeckDetailDto` | happy path (28 cartes, ≤4, en couleur) |
| 2 | `02-leader-not-leader.json` | **400** *Leader card must be a leader* | leader = catégorie Leader |
| 3 | `03-off-color.json` | **400** *(couleur)* | intersection couleur leader ↔ cartes |
| 4 | `04-over-4-same-card.json` | **400** *(≤4)* | ≤4 par `Card.code` (2 variantes, même carte) |
| 5 | `05-over-50.json` | **400** *(taille)* | ≤50 cartes (52 ici, chaque carte ≤4 pour isoler la règle) |
| 6 | `06-duplicate-line.json` | **400** *(ligne dupliquée)* | unicité de ligne — check `Set` amont, filet P2002 |
| 7 | `07-unknown-language.json` | **400** *(langue)* | FK langue → **P2003** (dépend du `try/catch`) |
| 8 | `08-unknown-variant.json` | **400** *Unknown variant(s)* | check `missing` avant les règles |

## Scénarios `PUT`/`DELETE` (`decks-crud.http`) — résultats attendus

Full-replace exposé en **`PUT`** (le body remplace intégralement le deck). Joue les requêtes **dans l'ordre**.

| Étape | Action | Attendu | Ce qu'on vérifie |
|-------|--------|---------|------------------|
| 1 | `POST` (3 lignes / 12) | **201** + `DeckDetailDto` | deck de départ |
| 2 | `GET /:id` | **200** | état initial confirmé |
| 3 | `PUT` valide (`put-valid.json`, 2 lignes / 6) | **200** | **id inchangé** + anciennes lignes remplacées (**pas d'accumulation**) + `name`/`isPublic` à jour |
| 4 | `PUT` hors-couleur (`put-off-color.json`) | **400** *(couleur)* | validation avant écriture |
| 5 | `GET /:id` | **200**, toujours 2 lignes / 6 | **atomicité** : le PUT #4 raté n'a rien muté |
| 6 | `PUT` id inexistant | **404** | not-found |
| 7 | `DELETE /:id` | **204** corps vide | suppression |
| 8 | `GET /:id` | **404** | le deck n'existe plus |
| 9 | `DELETE /:id` (2ᵉ fois) | **404** | `assertOwnership` attrape avant le `.delete` (pas de P2025 brut) |
| I2 | `PUT` le deck d'un **autre** user | **404** | isolation — ne révèle pas l'existence |
| I3 | `DELETE` le deck d'un **autre** user | **404** | idem, deck victime intact |

> Les cas **I2/I3** exigent un 2ᵉ compte : le fichier crée un user *intruder*, lui fait créer un deck, puis tu **te reconnectes en tester** (rejoue le sign-in) avant de tenter le PUT/DELETE sur l'id de l'intruder.

## ⚠️ Dépendances d'implémentation

- **#6** suppose ton **check `Set`** en amont (sinon c'est la contrainte DB `@@unique` → P2002 qui rattrape, à condition d'avoir le `try/catch`). Sans l'un ni l'autre → tu verras une **500** brute : c'est le signal qu'il te reste à brancher ce garde-fou.
- **#7** ne devient une **400** propre que si ton `try/catch` mappe `P2003`. Sans lui → **500** Prisma.

Donc #6 et #7 sont aussi un **test de ta gestion d'erreurs**, pas seulement des règles métier.

## Ordre de vérification des règles (utile pour lire les erreurs)

`missing` (variant inexistant) → `assertDeckRules` (leader → couleur → ≤4 → ≤50) → écriture DB (`Set`/P2002, P2003).
Le **premier** échec rencontré gagne : si un payload viole deux règles, tu ne verras que la première dans cet ordre.
