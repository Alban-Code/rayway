# Rayway database schema

Reference documentation for the PostgreSQL schema used by the Rayway API. The source of truth is [`apps/api/prisma/schema.prisma`](../prisma/schema.prisma); this document explains the **why** and **how**, with examples.

Intended audience: human contributors AND LLM agents working on the codebase.

---

## 1. Purpose

Rayway is a One Piece TCG companion / mentor app. The database stores:

- **Card catalog** — every printed card and every printed *variant* (alt-art, parallel, reprint), in every language Bandai has released.
- **Semantic enrichment** — tags applied to cards (officially printed keywords + custom semantic categories like `searcher`, `drawer`, …) used by the chatbot's RAG retrieval.
- **Types** — the in-game tribal/category tags ("Straw Hat Crew", "Supernova", "Wano Country"), normalized with multi-language labels. Bandai calls them "types"; the join table is named `CardType` (do not confuse with `Card.category` which is the Leader/Character/Event/Stage/Don kind).
- **Formats and banlist** — competitive formats (Standard, World, Limited) and their time-bounded card legality rules.
- **User content** — user accounts, decks they build, and physical collections they own.

The schema is designed around a **canonical core + language-specific translations** pattern so that adding a new language requires only `INSERT`s — no migrations.

---

## 2. Conventions

### 2.1 Identifiers

- All primary keys are `String @id @default(cuid())` **except** `Language.code` which uses ISO 639-1 codes as the natural PK (`"en"`, `"fr"`, `"ja"`).
- cuid is preferred over uuid for URL-friendliness in a multi-tenant SaaS and faster generation.
- Business identifiers (card code, variant code, set code, tag code, subtype code, format code) live in dedicated `code` columns with `@unique` constraints — never used as PKs.

### 2.2 Multi-language pattern (i18n)

The schema separates **language-neutral data** (numeric stats, types, colors) from **language-specific data** (names, effect text, images).

Every translatable entity follows the same pattern:

```
<Entity>             — canonical, language-neutral
<Entity>Translation  — one row per language, joined to Language via languageCode FK
```

This applies to: `Card`, `Type`, `Tag`, `Format`. The `Language` table is keyed by ISO code; adding a new language is `INSERT INTO Language (code, name) VALUES ('ja', '日本語')` — no migration needed.

Image URLs are also per-language (`CardVariantImage`), because Bandai prints localized card text on the card image itself — the EN, FR, JP versions of the same variant are different image files.

### 2.3 Naming

- Models: `PascalCase`, singular (`Card`, not `Cards`).
- Fields: `camelCase`.
- Foreign keys: `<entity>Id` (`cardId`, `variantId`) — except language FKs which use `languageCode` to match the natural PK.
- Join tables: `<A><B>` (`CardType`, `CardTag`).
- Translation tables: `<Entity>Translation` (`CardTranslation`).

### 2.4 Cascade behavior

- Deleting a parent that owns translations / variants / images cascades (`onDelete: Cascade`).
- Deleting a `User` cascades to their `Deck`s and `CollectionItem`s.
- `Deck` deletion cascades to `DeckCard` rows.
- `CardVariant` is *not* cascade-deleted when referenced by user decks/collection — those FKs are restrictive to prevent silent data loss in user content.

---

## 3. Glossary

These five concepts are easy to confuse — read this section once.

| Term | Meaning | Example | DB representation |
|---|---|---|---|
| **Set** | The canonical TCG release, encoded in the card code's prefix. | `OP01`, `OP02`, `ST15`, `EB01` | `CardSet.code` |
| **Card** | A printed card, identified by its set code + number. Language-neutral. | `OP02-001` (Edward Newgate Leader) | `Card.code` |
| **Variant** | A specific printing of a card (regular art, alt-art parallel, reprint). Identified by Bandai's suffix convention. | `OP02-001` (regular), `OP02-001_p1` (parallel art), `EB01-006_r1` (reprint) | `CardVariant.variantCode` |
| **Pack** | A Bandai **product** (booster box, starter deck, event pack). Used by data sources like punk-records to group cards — but a pack typically contains cards from multiple sets. **Not** modeled in our schema; we derive Set from the card code instead. | "ST-15 Edward Newgate Starter Deck" contains cards from sets `ST15`, `OP02`, `OP03` | (not stored) |
| **Type** (in-game) | In-game tribal/category tags shown on the card itself. A card can have multiple. Bandai calls them "types"; not to be confused with `Card.category`. | "Straw Hat Crew", "Supernova", "Wano Country" | `Type.code` (slug) |
| **Category** | The kind of card in the game rules. | Leader, Character, Event, Stage, Don | `Card.category` (enum `Category`) |
| **Tag** | Semantic enrichment for RAG — either an official keyword (Rush, Blocker) or a custom category (searcher, drawer). Not visible to players on the card. | `searcher`, `drawer`, `blocker` | `Tag.code` |

**Why pack is not modeled**: punk-records groups variants by Bandai product (`pack_id`), but the same card can be in multiple products (regular print in a booster, alt-art in a starter), and the same product contains cards from multiple sets. The TCG-canonical organization is by **Set**, derived from the card code prefix.

---

## 4. Architecture overview

```
┌─ Reference ──────────────────────────────────────────────────────┐
│  Language (PK: ISO code)                                          │
└────────────────────────────────────────────────────────────────────┘
        ↑ referenced by every translation/image table

┌─ Users & ownership ──────────────────────────────────────────────┐
│  User ──< Deck ──< DeckCard >── CardVariant                       │
│   │       └─ leader: CardVariant                                  │
│   │       └─ format: Format?                                      │
│   └──< CollectionItem >── CardVariant  (× Language)               │
└────────────────────────────────────────────────────────────────────┘

┌─ Card catalog (core domain) ─────────────────────────────────────┐
│  CardSet ──< Card ──< CardVariant ──< CardVariantImage             │
│              │         (Regular /    (1 image per language)        │
│              │          Parallel /                                 │
│              │          Reprint)                                   │
│              ├──< CardTranslation       (name, effect, trigger)    │
│              ├──< CardType    >── Type    ──< TypeTranslation      │
│              │     (tribal categories: Straw Hat Crew, etc.)       │
│              ├──< CardTag     >── Tag     ──< TagTranslation       │
│              │     (scope: Main/Trigger)                           │
│              │     (source: Llm/Human/Official)                    │
│              └──< FormatLegality >── Format                        │
│                    (time-bounded banlist with effectiveAt/endsAt)  │
└────────────────────────────────────────────────────────────────────┘

┌─ Ingestion audit ───────────────────────────────────────────────┐
│  IngestionRun (source, commitSha, status, counts) — standalone   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 5. Enums

### Color
The six game colors. A card has 1 or 2 colors (array on `Card.colors`).
`Red`, `Blue`, `Green`, `Black`, `Yellow`, `Purple`.

### Category
What kind of card it is in the game (Bandai term: "category"). Stored on `Card.category`.
`Leader`, `Character`, `Event`, `Stage`, `Don`.

- `Don` represents DON!! cards. They are not part of a deck list (every player has 10 DON!!s as a separate resource), but they exist as catalog entries with variants/promos.
- ⚠️ Do not confuse with the model `CardType`, which is the **join table** between `Card` and `Type` (tribal categories like "Straw Hat Crew"). Naming collision is intentional to follow Bandai's vocabulary, but be careful at import sites.

### Attribute
The attack attribute (only relevant for Leaders and Characters with combat). Stored as `Card.attributes: Attribute[]` (array, can be empty).
`Slash`, `Strike`, `Ranged`, `Special`, `Wisdom`.

In practice cards have a single attribute; the array supports rare cases where Bandai prints multiple.

### Rarity
Official rarity grades. The mapping from punk-records labels is:

| Source label | Enum value |
|---|---|
| `Common` | `C` |
| `Uncommon` | `UC` |
| `Rare` | `R` |
| `SuperRare` | `SR` |
| `SecretRare` | `SEC` |
| `Leader` | `L` |
| `Promo` | `P` |
| `TreasureRare` | `TR` |
| `Special` | `SP` |

### VariantType
Classification of a printing, derived from the suffix on `variantCode`:

| Enum value | Suffix | Description |
|---|---|---|
| `Regular` | (none) | Standard print, the "base" variant of a card |
| `Parallel` | `_pN` | Alt-art parallel (the most common alt) |
| `Reprint` | `_rN` | Reprint variant, often manga-style art |

### LegalityStatus
Card status in a given format at a given time.

| Value | Meaning | Max copies in deck |
|---|---|---|
| `Legal` | Allowed | 4 (the game default) |
| `Restricted` | Allowed but capped | 1 (or override via `maxCopies`) |
| `Limited` | Allowed but capped | 2 (or override via `maxCopies`) |
| `Banned` | Not allowed | 0 |

### TagKind
Distinguishes the type of tag:

| Value | Meaning | Examples |
|---|---|---|
| `Keyword` | Officially printed on the card | `rush`, `blocker`, `banish`, `double_attack`, `counter` |
| `Semantic` | Custom RAG category derived from effect text | `searcher`, `drawer`, `board_wipe`, `don_manipulator` |

### TagSource
Where a `CardTag` row came from:

| Value | Meaning |
|---|---|
| `Llm` | Auto-classified by an LLM (has `confidence`) |
| `Human` | Manually curated by a user/admin (no confidence) |
| `Official` | Extracted from official rules text (deterministic keyword match) |

### TagScope
Which part of the card the tag applies to:

| Value | Meaning |
|---|---|
| `Main` | Applies to the main effect text |
| `Trigger` | Applies to the [Trigger] effect specifically |

This matters for RAG queries like "cards whose **trigger** draws" vs. "cards whose **main effect** draws".

---

## 6. Models

### 6.1 Reference

#### `Language`

Catalog of supported languages. Adding a language is a single `INSERT`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `code` | `String` PK | yes | ISO 639-1 (`"en"`, `"fr"`, `"ja"`) |
| `name` | `String` | yes | Display name (e.g. `"English"`, `"Français"`) |

Referenced by: every translation table and `CardVariantImage`, `CollectionItem`.

**Seed example**:
```ts
await prisma.language.createMany({
  data: [
    { code: "en", name: "English" },
    { code: "fr", name: "Français" },
  ],
});
```

---

### 6.2 Users

#### `User`

Minimal user model. Auth fields (passwordHash, OAuth providers, sessions) will be added when an auth provider is chosen (Supabase / NextAuth / Clerk).

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `String` PK | cuid | |
| `email` | `String` | yes, unique | |
| `displayName` | `String` | yes | |
| `createdAt`, `updatedAt` | `DateTime` | auto | |

Relations: `decks` (1-to-many), `collectionItems` (1-to-many). Deleting a user cascades to both.

---

### 6.3 Card catalog

#### `CardSet`

A canonical TCG set release (OP01, ST15, EB01…). The `code` matches the prefix of the card codes inside the set.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `String` PK | cuid | |
| `code` | `String` | yes, unique | e.g. `"OP01"`, `"ST15"`, `"EB01"` |
| `name` | `String` | yes | e.g. `"Romance Dawn"` |
| `releaseDate` | `DateTime?` | optional | |
| `createdAt` | `DateTime` | auto | |

Relations: `cards` (1-to-many).

---

#### `Card`

The canonical card definition (one row per printed card, regardless of variant or language). All language-neutral stats live here.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `String` PK | cuid | |
| `code` | `String` | yes, unique | e.g. `"OP01-001"`. Set prefix = `code.split("-")[0]` |
| `category` | `Category` | yes | Leader / Character / Event / Stage / Don |
| `colors` | `Color[]` | yes | 1 or 2 colors |
| `cost` | `Int?` | optional | Mana cost (null for Leaders / DON). For Leaders, life is stored separately. |
| `power` | `Int?` | optional | Combat power (null for non-combat types) |
| `life` | `Int?` | optional | Leader-only |
| `counterAmount` | `Int?` | optional | Counter value (e.g. `+1000`, `+2000`) |
| `attributes` | `Attribute[]` | yes | Empty array for cards without attribute (Events, Stages, Don) |
| `rarity` | `Rarity` | yes | |
| `setId` | `String` FK | yes | → `CardSet.id` |
| `createdAt`, `updatedAt` | `DateTime` | auto | |

Relations: `set`, `translations`, `variants`, `types`, `tags`, `legalities`.

Indexes: `(category)`, `(setId)`.

**Why rarity is at the Card level, not Variant level**: technically a card can be printed at different rarities across variants (regular C → SR alt-art). punk-records doesn't expose this, so we treat the card's "base rarity" as authoritative. If this becomes a problem, move `rarity` to `CardVariant`.

---

#### `CardTranslation`

Localized text for a card. One row per (card, language).

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `String` PK | cuid | |
| `cardId` | `String` FK | yes | → `Card.id`, cascade on delete |
| `languageCode` | `String` FK | yes | → `Language.code` |
| `name` | `String` | yes | Localized name (e.g. EN `"Edward Newgate"`, FR `"Edward Newgate"`) |
| `effect` | `String?` | optional | Main rules text (null for cards with no effect, e.g. vanilla characters) |
| `triggerEffect` | `String?` | optional | The `[Trigger]` effect text, if any |
| `overridden` | `Boolean` | default `false` | If `true`, the ingestion script will **not** touch this row. Set by admin tooling when correcting a punk-records typo or filling a gap. Reset to `false` to let the source overwrite again. |

Constraints: `@@unique([cardId, languageCode])` — one translation per language per card.

Indexes: `(languageCode)`, `(name)`.

**FR translations are optional**: newer sets release in FR ~6 months after EN, so it's expected that some cards have an EN translation but no FR translation yet. Queries should handle missing FR with a fallback to EN.

---

#### `CardVariant`

A specific printing of a card. The same `Card` can have many variants (regular print + parallel arts + reprints).

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `String` PK | cuid | |
| `cardId` | `String` FK | yes | → `Card.id`, cascade |
| `variantCode` | `String` | yes, unique | e.g. `"OP02-001"`, `"OP02-001_p1"`, `"EB01-006_r1"`. Comes from Bandai. |
| `variantType` | `VariantType` | default `Regular` | Derived from suffix: none → `Regular`, `_pN` → `Parallel`, `_rN` → `Reprint` |
| `isPromo` | `Boolean` | default `false` | True when the source rarity is `Promo`. Orthogonal to `variantType` (a promo can be Regular or Parallel). |
| `isStarter` | `Boolean` | default `false` | True when the variant was distributed in a Starter Deck product. Derived from punk-records pack title. |
| `marketPrice` | `Float?` | optional | Last known market price (overwritten on each seed) |
| `inventoryPrice` | `Float?` | optional | Last known inventory price |
| `createdAt`, `updatedAt` | `DateTime` | auto | |

Relations: `card`, `images` (1 per language), `leaderDecks` (via `Deck.leaderVariant`), `deckEntries`, `collected`.

Indexes: `(cardId)`, `(variantType)`.

**`isMangaRare`, `isAlternate` are gone**: they're now expressed by `variantType` (`Reprint` ≈ manga rare for most cases, `Parallel` = alternate art).

**`isStarter` derivation**: currently set from `setCode.startsWith('ST')` during ingestion. This captures the *origin set* of the variant, not literal pack membership — see [punk-records.md](punk-records.md) for the limitation and possible refinement.

---

#### `CardVariantImage`

One image URL per (variant, language). Bandai prints localized text *on the card image*, so each language has a different image file even for the same variant.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `String` PK | cuid | |
| `variantId` | `String` FK | yes | → `CardVariant.id`, cascade |
| `languageCode` | `String` FK | yes | → `Language.code` |
| `imageUrl` | `String` | yes | Absolute URL to the card image |

Constraints: `@@unique([variantId, languageCode])`.

---

### 6.4 Types (tribal categories on the card)

The "Straw Hat Crew", "Supernova", "Wano Country" tags printed on cards. Bandai calls these "types" in their JSON (`types[]`). Normalized into a separate table for efficient queries ("all Straw Hat Crew cards") and clean i18n.

⚠️ The join table is named `CardType`. Not to be confused with `Card.category` (the `Category` enum: Leader/Character/Event/Stage/Don).

#### `Type`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `String` PK | cuid | |
| `code` | `String` | yes, unique | Slug, e.g. `"straw-hat-crew"`, `"supernova"`. Generated from EN label. |

#### `TypeTranslation`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `String` PK | cuid | |
| `typeId` | `String` FK | yes | → `Type.id`, cascade |
| `languageCode` | `String` FK | yes | |
| `label` | `String` | yes | e.g. EN `"Straw Hat Crew"`, FR `"Équipage de Chapeau de paille"` |
| `overridden` | `Boolean` | default `false` | If `true`, the ingestion script will **not** touch this row. Used to fix missing FR labels (arity mismatch cases) or correct bad translations. Reset to `false` to let the source overwrite again. |

Constraints: `@@unique([typeId, languageCode])`.

#### `CardType`

Many-to-many join, with the source ordering preserved.

| Field | Type | Notes |
|---|---|---|
| `cardId` | `String` FK | |
| `typeId` | `String` FK | |
| `order` | `Int` | Position of this type in the source `types[]` array. Set by the EN pass. Used by non-EN passes to recover the right `Type` by index when they run **without** the EN pass in the same execution (e.g. incremental re-ingest of a single FR file). |

Constraints: `@@id([cardId, typeId])` (composite PK), `@@unique([cardId, order])` (one type per position per card). Index on `(typeId)`.

**EN-first ingestion**: the canonical `Type.code` is generated by slugifying the EN label. Non-EN labels are attached by matching the position in the card's `types[]` array (Bandai preserves order across languages). The persisted `order` makes this position-matching robust across separate runs. See [§8](#8-multi-language-ingestion-flow).

---

### 6.5 Tags (RAG semantic enrichment)

Tags are NOT visible to players on the card. They are an internal layer used by the chatbot to retrieve cards by semantic category.

#### `Tag`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `String` PK | cuid | |
| `code` | `String` | yes, unique | Slug, e.g. `"searcher"`, `"drawer"`, `"blocker"` |
| `kind` | `TagKind` | default `Semantic` | `Keyword` for officially printed terms, `Semantic` for custom categories |

Indexes: `(kind)`.

#### `TagTranslation`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `String` PK | cuid | |
| `tagId` | `String` FK | yes | cascade |
| `languageCode` | `String` FK | yes | |
| `label` | `String` | yes | Display name |
| `description` | `String?` | optional | Long-form description, used by the LLM to know when to apply the tag |

Constraints: `@@unique([tagId, languageCode])`.

#### `CardTag`

The application of a tag to a card.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `String` PK | cuid | |
| `cardId` | `String` FK | yes | cascade |
| `tagId` | `String` FK | yes | cascade |
| `scope` | `TagScope` | default `Main` | Applies to main effect or trigger |
| `source` | `TagSource` | default `Llm` | Who/what added this tag |
| `confidence` | `Float?` | optional | LLM confidence score (null for `Human` and `Official`) |
| `createdAt` | `DateTime` | auto | |

Constraints: `@@unique([cardId, tagId, scope])` — a card can't have the same tag twice on the same scope. Index on `(tagId, scope)`.

**Workflow**:

1. Bootstrap `Tag` rows with `TagKind.Keyword` for the ~10 official keywords (Rush, Blocker, Banish, Double Attack, Counter, On Play, On K.O., When Attacking, End of Your Turn, Trigger), and `TagKind.Semantic` for custom RAG categories (searcher, drawer, looker, reducer, rester, bounce, ko, board_wipe, counter_synergy, rush_synergy, banish_synergy, trash_recovery, don_manipulator, life_manipulator…).
2. Run an LLM batch classification on each `Card.translations.effect` and `triggerEffect` text → insert `CardTag` rows with `source: Llm` and appropriate `scope`.
3. Curate: humans can `INSERT` missed tags (`source: Human`) or `UPDATE` / `DELETE` wrong LLM tags.

---

### 6.6 Formats & banlist

#### `Format`

A competitive format.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `String` PK | cuid | |
| `code` | `String` | yes, unique | e.g. `"standard"`, `"world"`, `"limited"` |
| `isActive` | `Boolean` | default `true` | False for retired formats |
| `createdAt` | `DateTime` | auto | |

#### `FormatTranslation`

Localized name + description.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `String` PK | cuid | |
| `formatId` | `String` FK | yes | cascade |
| `languageCode` | `String` FK | yes | |
| `name` | `String` | yes | |
| `description` | `String?` | optional | |

Constraints: `@@unique([formatId, languageCode])`.

#### `FormatLegality`

A time-bounded legality rule. The banlist evolves: a card can be `Legal` from `2024-01-01` to `2026-03-01`, then `Limited` from `2026-03-01` onward.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `String` PK | cuid | |
| `formatId` | `String` FK | yes | cascade |
| `cardId` | `String` FK | yes | cascade |
| `status` | `LegalityStatus` | default `Legal` | |
| `maxCopies` | `Int?` | optional | Override the default (4) when status is `Restricted` / `Limited` |
| `reason` | `String?` | optional | Free text for the banlist announcement |
| `effectiveAt` | `DateTime` | default now | When this rule takes effect |
| `endsAt` | `DateTime?` | optional | When this rule is superseded (null = still in effect) |

Constraints: `@@unique([formatId, cardId, effectiveAt])`. Index on `(cardId, formatId)`.

**Current legality query**: to get the active legality of card X in format Y at time T, find the row where `formatId = Y AND cardId = X AND effectiveAt <= T AND (endsAt IS NULL OR endsAt > T)`.

---

### 6.7 Decks

#### `Deck`

A deck owned by a user, optionally bound to a format.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `String` PK | cuid | |
| `userId` | `String` FK | yes | cascade |
| `formatId` | `String?` FK | optional | Null = casual / no format declared |
| `leaderVariantId` | `String` FK | yes | → `CardVariant.id` (pick a specific art for the leader) |
| `name` | `String` | yes | |
| `description` | `String?` | optional | |
| `isPublic` | `Boolean` | default `false` | |
| `createdAt`, `updatedAt` | `DateTime` | auto | |

Indexes: `(userId)`, `(formatId)`.

**Deck colors are derived, not stored**: `deck.leaderVariant.card.colors`. This avoids divergence between the leader and the declared colors.

#### `DeckCard`

The cards in a deck. Quantity is between 1 and 4 (enforced at the application layer for now).

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `String` PK | cuid | |
| `deckId` | `String` FK | yes | cascade |
| `variantId` | `String` FK | yes | → `CardVariant.id` (player picks which art) |
| `quantity` | `Int` | default 1 | 1-4 per the game rules; ≤ rule depending on format legality |

Constraints: `@@unique([deckId, variantId])`.

**Why variant-level, not card-level**: deck list visualizers should show the specific art the player chose. If two players both run 4× `OP02-001`, one might run all regulars and the other all `_p1` alt-arts; the database preserves the choice.

---

### 6.8 Collection

#### `CollectionItem`

A user's physical card inventory. One row per (user, variant, language).

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `String` PK | cuid | |
| `userId` | `String` FK | yes | cascade |
| `variantId` | `String` FK | yes | → `CardVariant.id` |
| `languageCode` | `String` FK | yes | The physical card's printed language |
| `quantity` | `Int` | default 1 | |
| `createdAt`, `updatedAt` | `DateTime` | auto | |

Constraints: `@@unique([userId, variantId, languageCode])`.

**No card condition (Mint/Near Mint/...) in the MVP**: deliberately skipped. Easy to add later as an enum if collection valuation becomes a feature.

---

### 6.9 Ingestion audit

#### `IngestionRun`

Audit row written by each ingestion job (e.g. punk-records seeder). Also serves as the **state store for incremental ingestion**: the next run reads `lastCommitSha` from the most recent successful row to compute the diff.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `String` PK | cuid | |
| `source` | `String` | yes | e.g. `"punk-records"` |
| `commitSha` | `String` | yes | SHA of the source repo at run time |
| `status` | `IngestionStatus` | yes | `success` / `partial` / `failed` |
| `startedAt`, `finishedAt` | `DateTime` | yes | |
| `filesProcessed`, `cardsUpserted`, `variantsUpserted`, `errors` | `Int` | default 0 | |

Index on `(source, status, finishedAt)` to query the latest successful run quickly.

This table is intentionally **not coupled** to the rest of the schema (no FK in or out). It is an audit/state-store table for the ingestion pipeline; deleting all rows does not affect catalog integrity.

---

## 7. Constraints: DB-enforced vs application-enforced

Some game rules are enforced at the database level; others are left to the application service layer (NestJS). The split is pragmatic — cross-table CHECK constraints are awkward in Postgres and not portable.

### DB-enforced (recommended via raw SQL migration)

| Rule | How |
|---|---|
| `DeckCard.quantity` between 1 and 4 | `CHECK (quantity >= 1 AND quantity <= 4)` |
| `CollectionItem.quantity >= 1` | `CHECK (quantity >= 1)` |
| Sum of `DeckCard.quantity` per deck ≤ 50 (deck size cap, excluding leader and DON!!) | Trigger on `INSERT`/`UPDATE` of `DeckCard` |

### Application-enforced (NestJS service layer)

| Rule | Why DB can't easily do it |
|---|---|
| `Deck.leaderVariantId` must reference a variant of a `Card` with `category = Leader` | Cross-table check |
| All variants in `DeckCard` must reference cards matching the leader's colors | Cross-table check + color subset logic |
| Card legality respect for format (max copies derived from `FormatLegality.maxCopies`) | Joins `Format`, `FormatLegality`, `Card`; needs business logic |
| DON!! cards (`category = Don`) excluded from `DeckCard` | Cross-table check |

---

## 8. Multi-language ingestion flow

The canonical data source is the [punk-records](https://github.com/buhbbl/punk-records) JSON dataset, which scrapes Bandai's official sites.

### 8.1 Pass 1 — English (creates the canonical vocabulary)

```text
For each card file in english/cards/<packId>/<CODE>.json:
    setCode = card.id.split('-')[0]                        # "OP02-001_p1" → "OP02"
    cardCode = card.id.replace(/_[pr]\d+$/, '')            # "OP02-001_p1" → "OP02-001"

    upsert CardSet(code=setCode)
    upsert Card(code=cardCode, setId, category, colors, cost, power, attributes, ...)
    upsert CardVariant(variantCode=card.id, cardId, variantType=fromSuffix(card.id),
                       isPromo=(rarity=='Promo'), isStarter=setCode.startsWith('ST'))
    upsert CardTranslation(cardId, languageCode='en', name, effect, triggerEffect)
    upsert CardVariantImage(variantId, languageCode='en', imageUrl=card.img_full_url)

    For i, typeLabel in enumerate(card.types):
      code = slugify(typeLabel)
      upsert Type(code)
      upsert TypeTranslation(typeId, languageCode='en', label=typeLabel)
      upsert CardType(cardId, typeId, order=i)        # `order` persists the source position
```

### 8.2 Pass 2 — French (adds translations on top)

```text
For each card file in french/cards/<packId>/<CODE>.json:
    cardCode = card.id.replace(/_[pr]\d+$/, '')

    # The Card and CardVariant rows should already exist from Pass 1.
    # If not, the card has no EN release → log warning, skip.

    upsert CardTranslation(cardId, languageCode='fr', name, effect, triggerEffect)
    upsert CardVariantImage(variantId, languageCode='fr', imageUrl=card.img_full_url)

    # Types: match by POSITION in the types[] array.
    # `CardType.order` was set by Pass 1 → reliable across separate runs.
    enTypes = prisma.cardType.findMany({
      where: { cardId },
      orderBy: { order: 'asc' },
      include: { type: { select: { id: true } } },
    })
    For i, frLabel in enumerate(card.types):
      type = enTypes[i].type                       # same index → same canonical Type
      upsert TypeTranslation(typeId=type.id, languageCode='fr', label=frLabel)
```

### 8.3 Edge cases

- **Card exists in EN but not FR** (typical for newest sets): no `CardTranslation(fr)` row inserted. Application queries should fall back to EN.
- **Type array arity mismatch between EN and FR for the same card**: log warning, skip type translation for that card. Manual review recommended; should be very rare.
- **New language added later** (e.g. JP): add a Pass 3 with the same structure; no schema migration needed.

---

## 9. Common query patterns (RAG retrieval)

### Get the full localized card data

```ts
const card = await prisma.card.findUnique({
  where: { code: "OP01-005" },
  include: {
    translations: { where: { languageCode: "fr" } },
    variants: {
      include: { images: { where: { languageCode: "fr" } } },
    },
    types: {
      include: {
        type: {
          include: { translations: { where: { languageCode: "fr" } } },
        },
      },
    },
    tags: { include: { tag: true } },
  },
});
```

### "Red cards whose trigger draws a card"

```sql
SELECT c.code, ct.name
FROM "Card" c
JOIN "CardTag"         ctag ON ctag."cardId" = c.id
JOIN "Tag"             t    ON t.id = ctag."tagId"
JOIN "CardTranslation" ct   ON ct."cardId" = c.id AND ct."languageCode" = 'fr'
WHERE 'Red' = ANY(c.colors)
  AND t.code  = 'drawer'
  AND ctag.scope = 'Trigger';
```

### "Is OP01-005 currently legal in Standard?"

```sql
SELECT status, "maxCopies"
FROM "FormatLegality" fl
JOIN "Format" f ON f.id = fl."formatId"
JOIN "Card"   c ON c.id = fl."cardId"
WHERE f.code = 'standard'
  AND c.code = 'OP01-005'
  AND fl."effectiveAt" <= NOW()
  AND (fl."endsAt" IS NULL OR fl."endsAt" > NOW())
ORDER BY fl."effectiveAt" DESC
LIMIT 1;
```

If no row is returned, the card is implicitly `Legal` (no banlist entry).

### "All Straw Hat Crew cards with their FR labels"

```sql
SELECT c.code, ct.name
FROM "Card" c
JOIN "CardType"           ctp ON ctp."cardId" = c.id
JOIN "Type"               t   ON t.id = ctp."typeId"
JOIN "CardTranslation"    ct  ON ct."cardId" = c.id AND ct."languageCode" = 'fr'
WHERE t.code = 'straw-hat-crew';
```

### "All variants of OP02-001 with their FR images"

```sql
SELECT cv."variantCode", cv."variantType", cvi."imageUrl"
FROM "Card" c
JOIN "CardVariant"      cv  ON cv."cardId" = c.id
JOIN "CardVariantImage" cvi ON cvi."variantId" = cv.id AND cvi."languageCode" = 'fr'
WHERE c.code = 'OP02-001';
```

---

## 10. Out of scope for now

These were considered and deliberately left out of the MVP:

- **Card condition** on `CollectionItem` (Mint/Near Mint/…) — add when collection valuation becomes a feature.
- **Price history** — `marketPrice`/`inventoryPrice` are point-in-time snapshots on `CardVariant`. For charts/trends, add a `PriceSnapshot` table.
- **Match history / play logs** — placeholder for when a simulator is added; new tables (`Match`, `MatchParticipant`, `MatchEvent`) will be additive.
- **Deck social features** (likes, comments, forks) — `Deck.isPublic` is the only social field for now.
- **Auth fields on `User`** — passwordHash, OAuth provider IDs, sessions: deferred until an auth provider is chosen.

---

## 11. Source of truth and update protocol

- The Prisma schema at [`apps/api/prisma/schema.prisma`](../prisma/schema.prisma) is authoritative.
- When changing the schema, update this document **in the same PR** — outdated docs are worse than no docs.
- For renames or breaking changes, write a migration note at the bottom of the relevant section.
