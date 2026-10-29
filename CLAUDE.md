# CLAUDE.md

Guidance for Claude Code working in this repo.

## Overview

Rayway — One Piece TCG companion SaaS: decks, multi-language collection, Ollama mentor (RAG over the card DB, no vectors). npm workspace monorepo: `apps/api` (NestJS + PostgreSQL/Prisma), `apps/web` (React 19 + Vite SPA).

## Commands

- Root: `npm run dev:api` / `npm run dev:web`.
- `apps/api`: `build` / `start:prod` / `lint` / `test` (Vitest `*.spec.ts`, ESM-native) / `test:watch` / `test:cov`. Ingestion: `npm run ingest:punk`.
- `apps/web`: `build` (tsc -b && vite build) / `lint` / `preview` / `test` (Vitest, added 2026-08-18 — see Web testing below).

## Database

PostgreSQL, `DATABASE_URL` in `apps/api/.env`. Prisma (from `apps/api`): `npx prisma migrate dev|deploy|generate`, config `prisma.config.ts`. New `prisma-client` generator (Prisma 7+), output `apps/api/src/generated/prisma`.

- ⚠️ ESM imports end in `.js`: `from '../generated/prisma/client.js'`, `.../enums.js`.
- ⚠️ Prisma 7 `PrismaClient` **requires** a driver adapter (`@prisma/adapter-pg` + `DATABASE_URL`); bare `new PrismaClient()` throws. Pattern: `apps/api/prisma/prisma.service.ts`.
- ⚠️ After any `schema.prisma` change run `npx prisma generate` **explicitly** — custom output path means `migrate dev` doesn't always regenerate.

## Data model (`apps/api/prisma/schema.prisma`)

Full ref: `apps/api/docs/database.md`. **Canonical core + per-language translations** → new languages = `INSERT`s, no migrations.

Models: `Language` (PK = ISO code) · `User` · catalog (`CardSet`, `Card` = language-neutral stats, `CardTranslation`, `CardVariant`, `CardVariantImage`) · `Type`/`TypeTranslation`/`CardType` join · `Tag`/`TagTranslation`/`CardTag` join (RAG, not player-visible) · `Format`/`FormatLegality` · `Deck`/`DeckCard` · `CollectionItem` · `IngestionRun`.

- PKs `cuid()` except `Language.code`. Business IDs (`Card.code`, `CardVariant.variantCode`) `@unique`, never PKs.
- ⚠️ `CardType` = join Card↔Type (tribes like "Straw Hat Crew") ≠ `Card.category` (`Category` enum: Leader/Character/Event/Stage/Don; DON!! = `Category.Don`). `Card.attributes: Attribute[]`. Deck colors derived from leader.
- `CardTag`: `scope` (Main/Trigger), `source` (Llm/Human/Official). `Tag.kind` = Keyword (printed) vs Semantic. `VariantType` (`Regular`/`Parallel`/`Reprint`) from `_pN`/`_rN`; orthogonal `isPromo`/`isStarter`.
- Cross-table constraints (leader type, color intersection, ≤50, ≤4/card) in the **service layer**, not DB (except `CHECK` quantity 1-4).

## Ingestion (`apps/api/src/ingestion/punk-records/`)

Source [buhbbl/punk-records] (Bandai JSON, EN/FR/JP/CN/TH). Standalone `tsx`. **Idempotent + incremental** via last git SHA in `IngestionRun.commitSha`. Pass 1 EN (creates canonical `Type` codes, position in `CardType.order`), Pass 2 FR (resolves Type by `order`). Variants grouped by TCG set prefix.

- **Image self-host:** Bandai images are CORP `same-site` → downloaded at ingestion. `CardVariantImage` = `sourceUrl` + `storageKey` (`en/OP02-001_p1.png`); served URL computed in `card-mapper.ts` = `${IMAGE_BASE_URL}/${storageKey}`. `IMAGE_STORAGE_PATH` gitignored, dev-served via `@nestjs/serve-static` at `/images`. Prod (S3) TBD. [[project-image-self-host]].
- ⚠️ **FR image coverage < EN, partly legitimate** — Bandai released only some variants in FR (a `Reprint` is sometimes the base art). Front is **FR-only, no EN fallback**. Backfill only genuine scraping misses. [[project-fr-language-display]].

## API (`apps/api/src`)

NestJS modules per domain. Routes `/api/`; Swagger `/api/docs`.

- ⚠️ **ESM** (`"type":"module"`, NodeNext): all relative imports end in `.js`.
- Module layout (ref `cards/`): thin `*.module/controller/service.ts` + `dto/` + `internal/` (`*-include.ts` = Prisma include + GetPayload, `*-where.ts` = where builder, `*-mapper.ts` = payload→DTO).
- Shared `src/common/`: `constants.ts` (`DEFAULT_LANG='en'`), `lang/pick-by-lang.ts`.
- **Language:** every translatable endpoint takes `lang` (default `'en'`). ⚠️ **No EN fallback for card data** — non-default lang returns only cards available in that lang. [[project-fr-language-display]].
- Typing: `satisfies Prisma.<Model>Include`; DTOs use `!:`; nullable = `field!: T | null` + `@ApiProperty({ nullable: true })`; DTO arrays need `@ApiProperty({ type: [Sub] })`.
- ⚠️ `main.ts`: `NestFactory.create(AppModule, new ExpressAdapter(), { bodyParser: false })` — explicit adapter (workspace hoisting breaks autodetect), `bodyParser:false` for `@thallesp/nestjs-better-auth`.

### Testing (`apps/api`)

**Vitest** (ESM-native — replaced Jest, which is CJS-first and only "experimental" on ESM). Config `vitest.config.ts`: `globals: true` (Jest-like `describe/it/expect` without imports; `tsconfig` has `"types": ["vitest/globals"]`) + `unplugin-swc` plugin. Specs are `src/**/*.spec.ts`, co-located next to the file under test.

- ⚠️ **swc plugin is mandatory, not cosmetic:** Vitest transpiles via esbuild, which does **not** emit `emitDecoratorMetadata` → NestJS DI (`@Injectable`, constructor injection) breaks in tests without swc. Fine for pure functions today; required the day a service/`Test.createTestingModule` is tested.
- Assert exceptions with a thunk: `expect(() => fn()).toThrow(BadRequestException)` (type) or `.toThrow(/regex/)` (message). `expect(fn())` (no arrow) throws *before* `expect` captures it.
- Fixtures for Prisma payloads: forge minimal objects + `as <GetPayload type>` (fill only the fields the code reads) — don't build full rows. See `decks/internal/deck-rules.spec.ts`.

### Auth (`apps/api/src/auth/`)

**Better Auth** self-hosted (sessions in Postgres via Prisma) + `@thallesp/nestjs-better-auth`. Paid plans later: **Polar.sh**. [[project-auth-payment-stack]], [[rayway-esm-better-auth]].

- `auth/auth.ts`: `betterAuth({ database: prismaAdapter(...), emailAndPassword: { enabled, requireEmailVerification: false } })` (owns its own PrismaClient). `auth.module.ts` wraps `AuthModule.forRoot({ auth })`.
- Tables `Session`/`Account`/`Verification`. Routes `/api/auth/*`. Env: `BETTER_AUTH_SECRET` (≥32), `BETTER_AUTH_URL`. Versions: wrapper ≥2.6 / `better-auth` ≥1.6, Node ≥22.22.1.
- **Protection:** global `AuthGuard` — every route protected unless `@AllowAnonymous()`/`@OptionalAuth()`. Read user via `@Session()`. ⚠️ Don't return `session.user` directly — re-fetch via Prisma with explicit `select`.

### Module status

- `cards/` ✅ `GET /api/cards` (filters `colors`, `category`, `attribute`, `types`, `cost`, `counter`, `q`, `lang`, `page`, `limit`) + `/:code`. FR-only per lang. Public. **Reference module.**
- `types/` ✅ `GET /api/types?lang` → `[{code,label}]`. Public, strict-lang (no EN fallback), sorted by label.
- `auth/` ✅ sign-up/in/session (email+password). `users/` ✅ `GET /api/users/me` (protected).
- `decks/` ✅ **CRUD complet** : `GET /api/decks` (list) · `GET /:id` (detail) · `POST` · `PUT /:id` (full-replace, atomic `deck.update` deleteMany+create, stable id) · `DELETE /:id` (204, `assertOwnership`→404). Build rules in `internal/deck-rules.ts` (`assertDeckRules`) — leader type, color intersection, ≤4/`Card.code`, ≤50, no DON!!/Leader in lines — **unit-tested** (`deck-rules.spec.ts`, 8 cases). ⚠️ rule order = category (Don/Leader) **before** color, else a colorless DON!! trips the color rule. **Detail DTO enriched (2026-08-18)** for the front detail page: `DeckCardDto` carries card stats (`category`/`cost`/`counterAmount`/`colors`/`power`/`types`/`effect`…); leader enriched **detail-only** via `DeckLeaderDetailDto` + `DeckDetailDto extends OmitType(DeckListItemDto,['leader'])` (redeclaring a class field = TS2612 + decorators can't sit on `declare` → `OmitType` is the clean fix); `types` join added to `deckDetailInclude` (cards+leader) only, list `deckInclude` stays slim; `mapDeckBase` shared → leader enrichment done in `mapDeckDetail` to keep list light. [[project-deck-rules]].
- `collection/`, `formats/`, `tags/`, `mentor/` (RAG) — not yet.

## Web (`apps/web/src`)

React 19 SPA / Vite. **Done:** auth · cards browsing (list + filters + detail panel + hover + pagination + `q` + language + FR-only + styled effects + facets attribute/type/cost/counter + page-size) · navbar + shared `AppLayout`. [[project-auth-slice-status]].

**Stack:** `react-router` v7 · `@tanstack/react-query` (`staleTime: 30_000`, `refetchOnWindowFocus: false`) · `better-auth/react` · Tailwind v4 + shadcn/ui (registry `radix-mira`, base `@base-ui/react`) · `react-hook-form`+`zod` · `fetch` in `api/client.ts` (base URL + `credentials:'include'`).

**Cross-origin (front :5173, API :3000):** API `enableCors({ origin, credentials: true })` · Better Auth `trustedOrigins` · every fetch `credentials:'include'` (else session cookie dropped silently).

**Design system (5 principles, [[rayway-frontend-design-system]]):** (1) generic UI → shadcn; (2) layout → Tailwind inline; (3) theming → 3-bridge (`tokens.css` OKLCH → `index.css @layer base` shadcn vars → `@theme inline`), **never hardcode a color**; (4) custom CSS (`styles/`) → signature visuals only (`.card-tile`, `.app-chrome` glass navbar); (5) maquette = inspiration, not spec.

**Folder convention:** `pages/` = thin route entries · `components/ui` (shadcn) + `components/<feature>/` (incl. `layouts/`) · `lib/` (hooks, schemas, utils) · `api/` · `styles/`. Cross-folder = `@/...`; deps go pages→components only.

**Auth on web:** `useSession()` (via `@/lib/auth-client`) = single source of truth for the user. ⚠️ Don't call `/api/users/me` from web at MVP. Route protection = `RequireAuth`/`RedirectIfAuth` layout wrappers (React Router 7 has no middleware).

**Layout:** `AppLayout` (layout route) = `flex flex-col h-dvh` with `<Navbar>` (`shrink-0`) + content region `flex-1 min-h-0` (the `min-h-0` lets inner `overflow-auto` scroll); pages fill it with `h-full`. Auth pages stay outside AppLayout. Navbar links = `NavLink` (active via `className` fn; `end` on `to="/"`).

### Cards UI patterns (full detail in [[project-auth-slice-status]])

- **Filters = URL state**, no `useState` mirror. `lib/hooks/useCardsFilter.ts` exposes filters + setters; every *filter* setter does `prev.delete('page')` (lang & size don't — they're views/prefs). `useCards`/`useCardDetail` use `placeholderData: keepPreviousData`.
- **Search (`q`):** local `useState` mirror for snappy typing (the one URL-SoT exception) + `useDebounce` (the `clearTimeout` cleanup *is* the debounce), pushed `{ replace: true }`.
- **Language (`lang`):** FR-only filter. ⚠️ Thread `lang` through list AND detail, **in the queryKey** (`['card', code, lang]`). Card-data lang (`?lang`, per-view) ≠ future UI locale (global, not the path).
- **Facets:** mono-select (category/attribute) = shadcn `<Toggle>`; multi-select (colors/cost/counter) = toggle list; type = **Base UI Combobox** (`@base-ui/react`, NOT cmdk). Generic widgets: `ToggleFilterGroup<T>`, `ComboboxFilter<T>`, `FilterSection`. Active chips resolve label-from-code via a deduped `useTypes` query.
- **`.card-tile`** (signature): `idStyle.ts` injects `--id-color-a/b` + `--art-image` inline, consumed in `pages/cards.css` via `color-mix`. ⚠️ **unlayered CSS beats `@layer utilities`** regardless of specificity (same reason `bg-background` is dropped from the `.app-chrome` nav).
- **Detail panel** = non-modal side-sheet, **state from URL** (`/cards/:code` nested under `/cards`, `<Outlet/>` + `useMatch`). `<Sheet modal={false}>` `showOverlay={false}`; keep `<main>` `sm:pr-[42rem]` in sync with the `sm:max-w-2xl` sheet.
- **Hover preview** = text-only `<HoverCard>` in `CardThumb`. ⚠️ `<HoverCardTrigger asChild>` mandatory; CSS vars don't cross Radix Portals.
- **Effects render:** `lib/renderEffects.tsx` `renderEffect()` tokenizes via `split` capturing group — `[..]`→keyword/DON pill, `{..}`→type — decodes entities. **Never `dangerouslySetInnerHTML`.** Wire on both `effect` AND `triggerEffect`. ⚠️ `--accent` is shadcn-overridden; use `--accent-hi/-glow/-fg` for the brand color.
- **Pagination:** shadcn `<Pagination>` sticky footer; `getPageRange(current,total)`; `<PaginationLink>` is an `<a>` → `href="#"`+`onClick preventDefault`.
- **URL search preservation:** internal nav in a URL-state feature must propagate `location.search` (`CardThumb` Link, sheet-close navigate).

**Next on Cards:** facet `rarity` (enum → like category) · fix `activeCount` (excludes `costs`/`counters` → wrong badge) · anti-flash (dim on `isPlaceholderData`, prefetch next page).

### Web testing (Vitest, added 2026-08-18)

`apps/web` had **no test runner** until 2026-08-18; now Vitest `^4` is wired (mirrors the API). Config lives **in `vite.config.ts`** (`import { defineConfig } from 'vitest/config'` + `test: { globals: true, include: ['src/**/*.spec.ts'], environment: 'node' }`) — merged, not a separate config, so the `@` alias + plugins carry over for future component tests. `tsconfig.app.json` has `"vitest/globals"` in `types`. **No swc** here (no decorators, unlike the API). Run `npm test -w apps/web -- --run`. First spec: `lib/deckGrouping.spec.ts`. [[rayway-web-testing]].

### Decks web — étape 2 detail `/decks/:id` (🚧 in progress, 2026-08-18)

Pipeline + pure logic done, rendering left. ⚠️ **Detail route = full page, SIBLING of `/decks` (not nested)** — deliberate contrast with `/cards/:code` which IS nested (side-sheet via `<Outlet/>`). `useDeckDetail` uses `queryKey ['deck', id]` and **no `keepPreviousData`** (a detail page is a fresh nav, not pagination). `lib/deckGrouping.ts` (`groupByCategory` + `costHistogram`, buckets 0–10, holes kept) **done + Vitest-tested**. Remaining: `components/decks/detail/{DeckHeader, CategorySection, CostCurve}` (CostCurve = shadcn chart / Recharts, `npx shadcn add chart` not yet installed) + `styles/pages/deck-detail.css`. Full detail in [[project-auth-slice-status]] and [[project-deck-rules]]. NB unrelated pre-existing build blocker: `pages/AccountPage.tsx` unused `error` var trips `noUnusedLocals`.

## AI service (`apps/ai`, Python, added 2026-10-24)

Local One Piece TCG **coach**: Ollama (`qwen3.5:9b`, runs inside WSL, `localhost:11434`) + direct read-only Postgres access + hand-written tool-calling loop. Independent of NestJS (not an npm workspace). Roadmap: env ✅ · local LLM ✅ · card data ✅ · **SIM log parser ✅ decoding + 30 pytest tests (2026-10-27) — Life/Triggers/Attach not decoded yet, then `engine/`** · analysis · FastAPI/NestJS integration · video. Full state, next steps and gotchas: [[project-ai-service]]; log format reference: [[project-sim-log-format]]; working mode (user learns Python and writes the structuring code; Claude writes regexes/prompt text, explains, reviews): [[feedback-user-runs-commands]].

- Layout: `pyproject.toml` · `.venv/` (gitignored) · `scripts/` (manual try-outs) · `src/rayway_ai/{cards/repository.py, llm/chat.py + llm/rules.md, sim/{events.py, parser.py}}` · `tests/sim/test_parser.py` (`pip install -e ".[dev]"`, then `pytest -v`; synthetic logs only, fake player names) · `data/` (**gitignored**: `rules/` official PDFs, `sim_logs/` 88 real logs with real player names). `llm/rules.md` = summary of Comprehensive Rules v1.2.1, injected in the system prompt.
- Target architecture: `sim/` (parser → typed events) → `engine/` (replay/state) → `analysis/` (pure state→facts) → `llm/` (narrates facts) → `api/` later. The LLM never computes facts. Setup: `python3 -m venv .venv && source .venv/bin/activate && pip install -e .`. Env in `apps/ai/.env`: `DATABASE_URL` (role `rayway_ai`, **SELECT only**), `OLLAMA_URL`. Never print secrets.
- Postgres runs in Docker Desktop on Windows (start the container first), reachable from WSL on `localhost:5432`.
- ⚠️ Card data for the coach is **always English** + optional `name_fr`; the web "no EN fallback" rule applies to display only.
- ⚠️ Prisma identifiers are quoted in SQL (`"Card"`, `"cardId"`). Enum-array columns need `::text[]` or psycopg returns `"{Red}"` strings.
- ⚠️ The raw model hallucinates game rules (e.g. Leader "HP", "cannot be attacked"): rules/facts must come from tools or a deterministic engine, never from model memory.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.

## Agent skills

### Issue tracker

Issues et specs vivent dans GitHub Issues (`Alban-Code/rayway`, CLI `gh`). See `docs/agents/issue-tracker.md`.

### Triage labels

Vocabulaire par défaut : `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context : un `GLOSSARY.md` et `docs/adr/` à la racine. See `docs/agents/domain.md`.
