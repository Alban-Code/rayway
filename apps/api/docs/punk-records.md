# punk-records data source

Reference for the [buhbbl/punk-records](https://github.com/buhbbl/punk-records) JSON dataset — Rayway's canonical source for the card catalog. Use this doc when working on `apps/api/src/ingestion/punk-records/`.

---

## 1. What it is

- A public GitHub repository ([buhbbl/punk-records](https://github.com/buhbbl/punk-records)) containing the full One Piece TCG catalog as JSON.
- Auto-generated weekly by a Rust scraper ([Coko7/vegapull](https://github.com/Coko7/vegapull)) that pulls from Bandai's official multi-language sites.
- License: AGPL on the tooling; the data itself is Bandai copyright (do not redistribute as a competing dataset, but using it to power a client product is fine).
- No prices, no banlist — pure catalog only.

Languages currently published: `english`, `french`, `japanese`, `chinese-hongkong`, `chinese-taiwan`, `thai`, `english-asia`.

---

## 2. Repository layout

```
punk-records/
├── english/
│   ├── cards/
│   │   ├── 569001/                    ← pack_id (numeric, Bandai product ID)
│   │   │   ├── ST01-001.json          ← one card file per variant
│   │   │   ├── ST01-002.json
│   │   │   └── …
│   │   ├── 569102/
│   │   │   ├── OP02-001.json
│   │   │   ├── OP02-001_p1.json       ← parallel variants are separate files
│   │   │   └── …
│   │   └── …
│   ├── data/                          ← unused by us
│   ├── index/                         ← unused by us
│   ├── manifest.json
│   └── packs.json                     ← `[{ pack_id, name, … }]` — useful for isStarter refinement
├── french/
│   ├── cards/
│   │   ├── 622015/                    ← ⚠️ pack_id differs from EN even for the same product
│   │   └── …
│   └── …
└── …
```

**Critical gotcha:** `pack_id` is **per-language**. The same OP02 booster has different `pack_id`s in EN (`569102`) and FR (`622015`). **Never** use `pack_id` to match the same card across languages — use the card's `id` field (the variant code, stable across languages).

---

## 3. Card JSON schema

Every card file is a flat object with this shape:

```json
{
  "id": "OP02-001_p1",
  "pack_id": "569102",
  "name": "Edward.Newgate",
  "rarity": "Leader",
  "category": "Leader",
  "img_url": "../images/cardlist/card/OP02-001_p1.png?251017",
  "img_full_url": "https://en.onepiece-cardgame.com/images/cardlist/card/OP02-001_p1.png?251017",
  "colors": ["Red"],
  "cost": 6,
  "attributes": ["Special"],
  "power": 6000,
  "counter": null,
  "types": ["The Four Emperors", "Whitebeard Pirates"],
  "effect": "[End of Your Turn] Add 1 card from the top of your Life cards to your hand.",
  "trigger": null
}
```

### Fields we map to the schema

| JSON field | Type | Maps to | Notes |
|---|---|---|---|
| `id` | string | `CardVariant.variantCode` | The actual variant code, with `_pN`/`_rN` suffix if any. Stable across languages. |
| `id` (stripped) | string | `Card.code` | `id.replace(/_[pr]\d+$/, '')` gives the canonical card code. |
| `pack_id` | string | (not stored) | Bandai product ID. Different per language — do not use for cross-language matching. |
| `name` | string | `CardTranslation.name` | Localized. |
| `rarity` | string | `Card.rarity` (via `RARITY_MAP`) | See mapping below. Drives `CardVariant.isPromo` too. |
| `category` | string | `Card.category` (via `CARD_CATEGORY_MAP`) | `"Leader"`/`"Character"`/`"Event"`/`"Stage"`/`"Don"`. |
| `img_full_url` | string | `CardVariantImage.sourceUrl` + triggers a **download into our own storage** (see §7 below) | Absolute URL on Bandai's CDN. Localized (different domain per language). **Never served directly to clients** — see "Image self-hosting" decision. |
| `img_url` | string | (ignored) | Relative path, we use `img_full_url`. |
| `colors` | string[] | `Card.colors` (via `COLOR_MAP`) | 1 or 2 colors. |
| `cost` | int \| null | `Card.cost` OR `Card.life` | **For Leaders, `cost` actually contains the life value.** Branch on `category`. |
| `attributes` | string[] | `Card.attributes` (via `ATTRIBUTE_MAP`) | Array — usually 1 element, sometimes 0 (Events/Stages/Don). |
| `power` | int \| null | `Card.power` | |
| `counter` | int \| null | `Card.counterAmount` | |
| `types` | string[] | `Type` rows + `TypeTranslation` + `CardType` join | **Localized** — slug only in EN (Pass 1). Match by position across languages. |
| `effect` | string \| null | `CardTranslation.effect` | Localized main rules text. |
| `trigger` | string \| null | `CardTranslation.triggerEffect` | Localized `[Trigger]` text. |

### Rarity mapping

| Source label | Enum |
|---|---|
| `Common` | `C` |
| `Uncommon` | `UC` |
| `Rare` | `R` |
| `SuperRare` | `SR` |
| `SecretRare` | `SEC` |
| `Leader` | `L` |
| `Special` | `SP` |
| `TreasureRare` | `TR` |
| `Promo` | `P` |

`CardVariant.isPromo` is derived: `rarity === 'Promo'`.

### Quirks to be aware of

1. **Leader life lives in `cost`.** Bandai reuses the same JSON field for both concepts. Branch on `category === 'Leader'` in the parser.
2. **Rarity `"Leader"` is a thing.** For Leader cards, the source rarity is `"Leader"` (not the actual print rarity). We map it to `Rarity.L`.
3. **`name` casing varies between languages.** EN: `"Edward.Newgate"` (with dots). FR: `"Edward Newgate"`. Store as-is per translation — no normalization.
4. **`types[]` order is preserved across languages.** So EN `["The Four Emperors", "Whitebeard Pirates"]` and FR `["Quatre Empereurs", "Équipage de Barbe Blanche"]` line up by index. The EN pass persists this position into `CardType.order`, so non-EN passes can resolve the right `Type` by index — even when re-ingested in a later, separate run.
5. **Newer cards exist in EN but not FR yet.** Typical lag is ~6 months. Pass 2 silently skips cards not yet released in the secondary language.

---

## 4. Pack vs set

punk-records organizes files by **pack** (Bandai product, numeric `pack_id`). Our schema organizes by **set** (TCG canonical, e.g. `OP01`, `ST15`) derived from the card code prefix.

- A pack can contain cards from multiple sets (a starter "Best-Of" pack often reprints OP cards).
- The same set can be sold in multiple packs (regular release + reprint).
- **We don't store packs.** If we ever need pack metadata (e.g. to refine `isStarter`), the file `english/packs.json` exposes `{ pack_id, name, card_ids[] }`.

---

## 5. `isStarter` derivation

Current rule: `setCode.startsWith('ST')`.

This works correctly for the vast majority of cases because Bandai renumbers cards when reissuing them in starter decks (a card from OP01 reprinted in a starter gets a new `ST15-XXX` code). The rule fails only if Bandai redistributes a card with its original OP code inside a starter product — rare but possible for recent "Best-Of" starters.

**Refinement path** (not implemented yet): read `english/packs.json`, find packs whose `name` contains `"Starter"`, and mark all their `card_ids` as `isStarter = true`. This requires a second pass after the catalog is loaded.

---

## 6. Ingestion pipeline (code layout)

All code lives in `apps/api/src/ingestion/punk-records/`. Invoked via `npm run ingest:punk` from `apps/api`.

| File | Role |
|---|---|
| `run.ts` | Entrypoint. Orchestrates the flow (sync repo → diff vs last run → Pass 1 EN → Pass 2 FR → record `IngestionRun`). No business logic. |
| `repo.ts` | Git operations: `clone --depth 50`, `pull`, `diff --name-only` to identify changed files. |
| `parser.ts` | Reads a JSON file and produces a `NormalizedCard`. Isolates **all** knowledge of the punk-records format. |
| `types.ts` | TypeScript types reflecting the punk-records JSON shape. |
| `upsert.ts` | Writes `NormalizedCard` to the DB (Card, CardTranslation, CardVariant, CardVariantImage, Type, TypeTranslation, CardType). The only file that imports `PrismaClient`. |
| `logger.ts` | Structured JSON logs to stdout (one line = one event, machine-parseable for Cloud Logging). |

Incremental state: `IngestionRun.commitSha` of the latest `success` row tells the next run what diff to compute. First run = full catalog. Subsequent runs = only files changed in the source repo since.

---

## 7. Image storage (self-hosting)

**Decision 2026-05-25**: we download every card image during ingestion and serve it from our own origin. We never expose Bandai's URLs to clients.

**Why**: Bandai's image responses include `Cross-Origin-Resource-Policy: same-site`, so browsers refuse to render them when embedded from another domain (200 HTTP but broken `<img>`). Beyond the immediate blocker, depending on a third-party CDN we don't control is fragile (URL changes, rate limits, uptime, hotlink rules).

**Storage abstraction**: an `ImageStorage` interface (in `apps/api/src/ingestion/punk-records/storage/`) with two implementations selected by env var:

- `LocalDiskStorage` — writes to a directory configured by `IMAGE_STORAGE_PATH` (default `apps/api/storage/images/`, gitignored). Used in dev.
- `S3Storage` — writes to an S3-compatible bucket configured by `IMAGE_S3_BUCKET`, `IMAGE_S3_REGION`, `IMAGE_S3_ENDPOINT`. Used in prod. Hosting target (AWS S3 / Cloudflare R2 / GCS / Backblaze B2) deferred until the site itself is deployed.

**Storage key convention**: `<langCode>/<variantCode>.<ext>` — e.g. `en/OP02-001_p1.png`, `fr/OP02-001_p1.png`. The variant code is already stable across languages (per §3 quirk #4), so the same filename works per-language.

**Served URL** = `IMAGE_BASE_URL` + storage key. Example: `IMAGE_BASE_URL=http://localhost:3000/static/images` in dev (with NestJS serving the local dir statically), or `IMAGE_BASE_URL=https://cdn.rayway.app` in prod. The DB stores neither the served URL nor the full local path — only the **storage key**, so swapping storage backends or domains requires no data migration.

**Schema impact** on `CardVariantImage`:

- Rename `imageUrl` → split into:
  - `storageKey: String` — relative key, e.g. `en/OP02-001_p1.png`. Indexed.
  - `sourceUrl: String` — Bandai's URL, kept for re-download detection (cache-buster query like `?251017` changes when Bandai re-uploads).
- Add `downloadedAt: DateTime` for audit / staleness checks.
- The served URL is computed at read time in the API mapper, not stored.

**Download step in the ingestion pipeline**:

- New file `image-downloader.ts` (no Prisma import, no business logic — just HTTP + storage).
- Invoked by `upsert.ts` when persisting a `CardVariantImage`.
- **Idempotent**: skip if `storageKey` already exists in storage AND the `sourceUrl` cache-buster matches what's stored. Re-download if either condition fails.
- **Concurrency**: parallel-bounded (e.g. 5 in flight) to avoid hammering Bandai. Use `p-limit` or equivalent.
- **Failures**: log + continue. The image record is still upserted with the source URL so a later retry can pick it up. **Do not** fail the whole ingestion run on image errors — the catalog data is more important than the images.
- **Languages**: download for every language present in the source. Start with EN + FR (current scope), expand by adding language passes.

**Cleanup**: orphan images (variant deleted upstream) are NOT auto-pruned in v1 to allow rollback. Add a separate `npm run ingest:prune-images` command later if disk usage becomes an issue.

---

## 8. Useful commands while working on the ingester

```bash
# Inspect a single card file from the repo without cloning:
curl -s https://raw.githubusercontent.com/buhbbl/punk-records/main/english/cards/<pack_id>/<CODE>.json | jq

# List all pack_ids in a language:
gh api repos/buhbbl/punk-records/contents/english/cards --jq '.[].name'

# Find every variant of a given card code across packs:
gh api 'repos/buhbbl/punk-records/git/trees/main?recursive=1' \
  --jq '.tree[] | select(.path | test("english/cards/.*/OP02-001(_p[0-9]+)?\\.json$")) | .path'

# Read total count of cards in English (rough order of magnitude):
gh api 'repos/buhbbl/punk-records/git/trees/main?recursive=1' \
  --jq '[.tree[] | select(.path | test("^english/cards/.*\\.json$"))] | length'
```

---

## 9. When the source changes

punk-records' schema has been stable since launch but is not formally versioned. If a future scrape introduces breaking changes (new field, renamed field, new rarity label):

1. **Crash early.** The strict union types in `types.ts` (e.g. `rarity: "Common" | "Uncommon" | …`) will flag unknown values at TypeScript compile time *only after* the type definition is updated. At runtime, an unknown rarity becomes `undefined` after `RARITY_MAP[card.rarity]` — currently silently bad. TODO: add a runtime guard that throws on unknown enum lookup, so the issue surfaces immediately during a seed.
2. **Update only `parser.ts` and `types.ts`.** No other file should need touching — the rest of the codebase consumes `NormalizedCard`, which is our internal contract.
3. **Bump the `IngestionRun.source` string** if the source repo itself changes (e.g. fork or replacement). Old runs with the previous source remain in the audit log; the diff-incremental logic keys on `(source, status)`.
