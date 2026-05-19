# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Rayway is a One Piece TCG (trading card game) companion app — a multi-user SaaS where players can build/share decks, track their physical collection in multiple languages, and chat with an Ollama-powered mentor (RAG over the card database, no vectors).

npm workspace monorepo with two apps:

- `apps/api` — NestJS REST API backed by PostgreSQL via Prisma
- `apps/web` — React 19 + Vite frontend

## Commands

Run from the repo root:

```bash
# Start API in watch mode
npm run dev:api

# Start web dev server
npm run dev:web
```

Run from `apps/api`:

```bash
npm run build          # compile via nest build
npm run start:prod     # run compiled output
npm run lint           # eslint --fix
npm run test           # jest (unit, files matching *.spec.ts)
npm run test:watch     # jest in watch mode
npm run test:cov       # jest with coverage
npm run test:e2e       # jest with test/jest-e2e.json config
```

Run from `apps/web`:

```bash
npm run build    # tsc -b && vite build
npm run lint     # eslint
npm run preview  # vite preview of production build
```

## Database

PostgreSQL is required. Default connection (configured in `apps/api/.env`):

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/onepiecetcg-db?schema=public"
```

Prisma commands (run from `apps/api`):

```bash
npx prisma migrate dev      # apply pending migrations
npx prisma migrate deploy   # apply in production
npx prisma generate         # regenerate client after schema changes
```

The project uses the **new `prisma-client` generator** (Prisma 7+), not the legacy `prisma-client-js`. The new generator requires a custom output path — the client is generated to `apps/api/src/generated/prisma`. Import from there, not from `@prisma/client`:

```ts
import { PrismaClient } from '../generated/prisma/client.js'; // from src/ — note the .js extension (ESM)
import { Category, Color, Attribute, Rarity } from '../generated/prisma/enums.js';
```

`prisma.config.ts` at the api root configures the schema path and uses `DATABASE_URL` from the environment.

⚠️ Prisma 7's `PrismaClient` constructor **requires** a driver adapter argument. Calling `new PrismaClient()` without one throws. See `apps/api/prisma/prisma.service.ts` for the reference pattern (uses `@prisma/adapter-pg` + `DATABASE_URL`).

⚠️ After any `schema.prisma` change, run `npx prisma generate` explicitly. With the new generator + custom output path, `prisma migrate dev` does NOT always regenerate the client automatically, leading to "column does not exist" errors at runtime even though the DB is up-to-date.

## Architecture

### Data model (`apps/api/prisma/schema.prisma`)

**Full reference: [`apps/api/docs/database.md`](apps/api/docs/database.md)** — read this for field-by-field details, query patterns, and ingestion flow.

The schema is built around a **canonical core + per-language translations** pattern so that new languages can be added with `INSERT`s only, no migrations.

Model groups:

- **Reference** — `Language` (PK: ISO 639-1 code, e.g. `"en"`, `"fr"`).
- **Users** — `User` (minimal; auth fields TBD when an auth provider is chosen).
- **Card catalog** — `CardSet`, `Card` (language-neutral stats), `CardTranslation` (name/effect/triggerEffect per language), `CardVariant` (printings), `CardVariantImage` (one URL per language).
- **Types** — `Type` + `TypeTranslation` + `CardType` join. Tribal categories printed on cards ("Straw Hat Crew", "Supernova"), with canonical slug codes + per-language labels. ⚠️ `CardType` is the **join table** between `Card` and `Type` — do not confuse with `Card.category` (Leader/Character/Event/Stage/Don).
- **Tags** — `Tag` + `TagTranslation` + `CardTag` join. Semantic enrichment for RAG retrieval (NOT visible to players). Each `CardTag` has a `scope` (Main/Trigger), a `source` (Llm/Human/Official), and an optional confidence. `Tag.kind` distinguishes `Keyword` (officially printed: Rush, Blocker, Banish) from `Semantic` (custom: searcher, drawer, board_wipe).
- **Formats** — `Format` + `FormatTranslation` + `FormatLegality` (time-bounded banlist with `effectiveAt`/`endsAt` and per-status `maxCopies`).
- **Decks** — `Deck` (user-owned, optional format, leader is a `CardVariant`) + `DeckCard` (variant + quantity).
- **Collection** — `CollectionItem` (user × variant × language × quantity).
- **Ingestion** — `IngestionRun` (audit + state store for incremental seeding; stores `commitSha` of last successful run).

Key conventions:

- All primary keys are `cuid()` except `Language.code` (natural ISO key).
- Business identifiers (`Card.code`, `CardVariant.variantCode`, `Tag.code`, `Type.code`, etc.) live in dedicated `@unique` columns — never used as PKs.
- DON!! cards are integrated as `Category.Don` (no separate flag/table).
- `Card.category` (kind of card) uses the `Category` enum, `Card.attributes` is an array `Attribute[]`.
- Deck colors are derived from the leader, not stored on `Deck`.
- Variant classification uses the `VariantType` enum (`Regular` / `Parallel` / `Reprint`) derived from Bandai's `_pN`/`_rN` suffix on the `variantCode`, plus orthogonal `isPromo` / `isStarter` flags.

Enums: `Color`, `Category`, `Attribute`, `Rarity`, `LegalityStatus`, `TagSource`, `TagScope`, `TagKind`, `VariantType`, `IngestionStatus`. See [database.md §5](apps/api/docs/database.md) for full enum semantics.

Cross-table constraints (leader must be type `Leader`, deck cards must match leader colors, deck ≤ 50 cards, max 4 copies per card) are enforced at the **NestJS service layer**, not the DB, except for simple `CHECK` constraints (quantity 1-4) that can live in raw SQL migrations.

### Data ingestion

The canonical source is [buhbbl/punk-records](https://github.com/buhbbl/punk-records) — a JSON dataset auto-scraped from Bandai's official sites, supporting EN, FR, JP, CN-HK, CN-TW, TH. Replaces the previous optcgapi.com source (which was EN-only).

Code lives in `apps/api/src/ingestion/punk-records/` and is invoked via `npm run ingest:punk` (standalone `tsx` script, intentionally decoupled from the NestJS API so it can later run as a Cloud Run Job / ECS Scheduled Task without code changes). The script is **idempotent** and **incremental**: it stores the last successful git SHA in `IngestionRun.commitSha` and only re-processes files changed since then.

Ingestion flow: Pass 1 = EN (creates canonical `Type` codes by slugifying EN labels, persists the source position in `CardType.order`), Pass 2 = FR (resolves the canonical `Type` per card by `CardType.order` and attaches the FR `TypeTranslation`). See [database.md §8](apps/api/docs/database.md) and [punk-records.md](apps/api/docs/punk-records.md) for the source format details.

Note: punk-records groups variants by Bandai **product** (`pack_id`), not by TCG **set**, and `pack_id`s differ between languages. Our schema uses TCG sets (`OP01`, `ST15`…) derived from the prefix of the card code (stable across languages); pack info is not stored.

### API (`apps/api/src`)

NestJS modules organized one-per-domain-feature. All routes are prefixed with `/api/` (set via `app.setGlobalPrefix('api')`); Swagger UI is exposed at `/api/docs`.

⚠️ `apps/api` is an **ESM project** (`"type": "module"` in `package.json`, `"module": "NodeNext"` in `tsconfig.json`). All relative imports must include the `.js` extension (e.g. `from './cards/cards.module.js'`) — TypeScript does not auto-add it, and Node's ESM resolver requires it. Package imports (`from "@nestjs/common"`) don't need it (resolved via the package's `exports` field).

Module structure convention (established by `cards/`):

```
<module>/
├── <module>.module.ts
├── <module>.controller.ts
├── <module>.service.ts        # orchestration only — thin
├── dto/                        # input + response DTOs (with @ApiProperty for Swagger)
└── internal/                   # private helpers, not imported from outside the module
    ├── *-include.ts            # Prisma `include` factory + `GetPayload` type
    ├── *-where.ts              # Prisma `where` builder
    └── *-mapper.ts             # DB-payload → DTO mapper
```

Cross-module shared code lives in `src/common/`:

- `common/constants.ts` — `DEFAULT_LANG = 'en'` and other globals
- `common/lang/pick-by-lang.ts` — generic `pickByLang<T>(items, lang)` helper that returns the entry matching the requested language, falls back to `DEFAULT_LANG`, or `null` if neither exists

Language resolution pattern: every endpoint that returns translatable content accepts a `lang` query param (defaulting to `'en'`). The Prisma `include` filters translations on `[lang, DEFAULT_LANG]` only (not all 6 langs), and the mapper picks the requested language with EN fallback per row. The response includes a per-card `language` field reflecting which translation was actually served.

DTO / Prisma typing patterns to follow:

- Use `satisfies Prisma.<Model>Include` (not `: Prisma.<Model>Include`) on include literals — preserves the precise shape so `Prisma.<Model>GetPayload<{ include: ReturnType<typeof factory> }>` produces a fully-typed payload.
- Response DTOs use definite-assignment `!:` (e.g. `code!: string`) since values are assigned at runtime by the mapper, not in a constructor.
- For nullable fields, use `field!: T | null` with `@ApiProperty({ type: T, nullable: true })`.
- For arrays of DTOs, use `@ApiProperty({ type: [SubDto] })` — Swagger does not infer this from TypeScript.

Bootstrap quirks in `main.ts`:
- `NestFactory.create(AppModule, new ExpressAdapter(), { bodyParser: false })` is passed explicitly because npm-workspace hoisting breaks NestJS's dynamic `PackageLoader` autodetection of `@nestjs/platform-express`.
- `bodyParser: false` is required by `@thallesp/nestjs-better-auth` — the lib disables NestJS's global parser then re-adds JSON/urlencoded parsing for non-auth routes itself.

### Auth (`apps/api/src/auth/`)

Auth stack: **Better Auth** (self-hosted in NestJS, sessions in Postgres via Prisma) + **`@thallesp/nestjs-better-auth`** wrapper for the NestJS integration. Future paid plans will use **Polar.sh** via `@polar-sh/better-auth` (Merchant of Record, EU VAT handled).

Files:
- `auth/auth.ts` — instantiates `betterAuth({ database: prismaAdapter(prisma, { provider: 'postgresql' }), emailAndPassword: { enabled: true, requireEmailVerification: false } })`. Owns its own `PrismaClient` (separate from `PrismaService`) because the file is evaluated at module-load time, before NestJS DI is wired.
- `auth/auth.module.ts` — wraps `AuthModule.forRoot({ auth })` from `@thallesp/nestjs-better-auth` (aliased as `BetterAuthModule` to avoid the name clash with our wrapper). Exported and imported by `AppModule`.

Schema additions for Better Auth (in `prisma/schema.prisma`):
- `User` extended with `name` (replaces former `displayName`), `emailVerified`, `image`, plus `sessions` / `accounts` relations.
- New tables: `Session`, `Account`, `Verification`. We **removed the `@@map(...)` lowercase mappings** that the CLI added, to keep SQL table naming consistent (PascalCase) with the rest of the schema.

Routes: Better Auth mounts its routes at `/api/auth/*` via an Express middleware (not via NestJS controllers, so they don't appear in the Nest `RouterExplorer` log). The lib detects and respects the global `/api` prefix automatically — no `setGlobalPrefix` exclusion needed.

Env vars (in `apps/api/.env`):
- `BETTER_AUTH_SECRET` — must be ≥ 32 chars, generate with `openssl rand -base64 32`
- `BETTER_AUTH_URL` — `http://localhost:3000` in dev

⚠️ Version sync: `@thallesp/nestjs-better-auth` and `better-auth` must stay roughly in sync. The wrapper v2.4 imports `createAuthMiddleware` from `better-auth/plugins` which fails against recent `better-auth` (1.6+) where this symbol moved to `better-auth/api`. Use wrapper ≥ 2.6.

⚠️ The wrapper requires Node ≥ 22.22.1. Older Node (22.20-) only triggers an `EBADENGINE` warning at install but may fail later at runtime.

⚠️ The deprecation warning shown by TypeScript on `forRoot` is cosmetic — only the legacy `forRoot(auth, options?)` 2-arg signature is deprecated. The object-based `forRoot({ auth, ...options })` we use is fine.

Auth-protection model: the wrapper installs a **global `AuthGuard` by default** (`disableGlobalAuthGuard: false`). Every route is protected unless explicitly marked `@AllowAnonymous()` (or `@OptionalAuth()`). Use the `@Session() session: UserSession<typeof auth>` param decorator (from `@thallesp/nestjs-better-auth`) in protected handlers to access `session.user.id`.

⚠️ Don't return `session.user` directly to clients — it's Better Auth's internal shape and may carry fields you didn't intend to expose. Always re-fetch via Prisma with an explicit `select` matching your response DTO.

Modules status:

- **`cards/`** — ✅ implemented. `GET /api/cards` (paginated list with filters: `colors`, `category`, `tags`, `q`, `lang`, `page`, `limit`) + `GET /api/cards/:code` (detail). Multi-lang resolution with EN fallback. Public routes (marked `@AllowAnonymous()`). See `apps/api/src/cards/` as the reference structure for new modules.
- **`auth/`** — ✅ Better Auth integration working. `POST /api/auth/sign-up/email`, `/sign-in/email`, `GET /api/auth/get-session` all functional. Email/password only for now; OAuth (Google/Discord) deferred. Email verification disabled at MVP — can be flipped on later via the `requireEmailVerification` config flag.
- **`users/`** — ✅ implemented. `GET /api/users/me` returns the authenticated user (id, email, name, emailVerified, image, createdAt). Protected by the global auth guard. Minimal structure (no `internal/` helpers — no translations, no complex filters).
- **`decks/`** — ❌ removed (was built against the old schema). To be rewritten with cross-table constraints enforced at the service layer: leader must be type `Leader`, deck cards must match leader colors (intersection of `Card.colors ∩ Leader.colors ≠ ∅`), deck ≤ 50 cards, max 4 copies per `Card.code` (summed across variants), no DON!! cards (10 standard DON!! implicit at MVP).
- **`collection/`, `formats/`, `types/`, `tags/`, `mentor/` (RAG)** — not yet implemented. Priority order TBD; next focus is the web frontend (first slice: sign-up/sign-in/sign-out, account view, card list with filters, card detail).

### Web (`apps/web/src`)

React 19 SPA served by Vite. The frontend is at the scaffold stage.

Planned stack for the first slice (auth + cards browsing):

- **Routing**: `react-router` v7 in library/SPA mode (no SSR — the Nest API is the only backend).
- **Data fetching**: `@tanstack/react-query` for cache, refetch, loading/error states and invalidation after mutations.
- **Auth client**: `better-auth/react` (hooks `useSession`, `signIn.email`, `signOut`). All fetches must use `credentials: 'include'` so the `better-auth.session_token` cookie is sent cross-origin.
- **UI**: Tailwind v4 (via `@tailwindcss/vite`) + shadcn/ui (Radix primitives copied into the repo, no runtime lib).
- **Forms**: `react-hook-form` + `zod` (`@hookform/resolvers`).
- **HTTP**: native `fetch`, wrapped in a thin `api/client.ts` that injects the base URL and `credentials: 'include'`.

Cross-origin wiring (front on `:5173`, API on `:3000`):

- API: `app.enableCors({ origin: 'http://localhost:5173', credentials: true })` in `main.ts`.
- Better Auth: `trustedOrigins: ['http://localhost:5173']` in the `betterAuth({...})` config (in `auth/auth.ts`).
- Front: every fetch must pass `credentials: 'include'`, otherwise the session cookie is dropped silently.
