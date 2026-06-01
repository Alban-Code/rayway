# CLAUDE.md

Guidance for Claude Code working in this repo.

## Project overview

Rayway — One Piece TCG companion SaaS: build/share decks, track a multi-language collection, chat with an Ollama mentor (RAG over the card DB, no vectors). npm workspace monorepo:

- `apps/api` — NestJS REST API + PostgreSQL via Prisma
- `apps/web` — React 19 + Vite SPA

## Commands

- Root: `npm run dev:api` / `npm run dev:web`.
- `apps/api`: `build` / `start:prod` / `lint` (eslint --fix) / `test` (jest `*.spec.ts`) / `test:e2e`.
- `apps/web`: `build` (tsc -b && vite build) / `lint` / `preview`.

## Database

PostgreSQL, `DATABASE_URL` in `apps/api/.env` (default DB `onepiecetcg-db`). Prisma (from `apps/api`): `npx prisma migrate dev|deploy|generate`, config in `prisma.config.ts`.

Uses the **new `prisma-client` generator** (Prisma 7+), output to `apps/api/src/generated/prisma`. Import with `.js` (ESM): `import { PrismaClient } from '../generated/prisma/client.js'`, `import { Category } from '../generated/prisma/enums.js'`.

- ⚠️ Prisma 7 `PrismaClient` **requires** a driver adapter (`@prisma/adapter-pg` + `DATABASE_URL`); bare `new PrismaClient()` throws. Pattern: `apps/api/prisma/prisma.service.ts`.
- ⚠️ After any `schema.prisma` change, run `npx prisma generate` **explicitly** — with the custom output path, `migrate dev` doesn't always regenerate (→ "column does not exist" at runtime).

## Architecture

### Data model (`apps/api/prisma/schema.prisma`)

Full reference: [`apps/api/docs/database.md`]. **Canonical core + per-language translations** → new languages = `INSERT`s only, no migrations.

Models: `Language` (PK = ISO code) · `User` · catalog (`CardSet`, `Card` = language-neutral stats, `CardTranslation`, `CardVariant`, `CardVariantImage`) · `Type`/`TypeTranslation`/`CardType` join · `Tag`/`TagTranslation`/`CardTag` join (RAG, not player-visible) · `Format`/`FormatLegality` · `Deck`/`DeckCard` · `CollectionItem` · `IngestionRun`.

- PKs `cuid()` except `Language.code`. Business IDs (`Card.code`, `CardVariant.variantCode`…) in `@unique` columns, never PKs.
- ⚠️ `CardType` = join table Card↔Type (tribes like "Straw Hat Crew") ≠ `Card.category` (`Category` enum: Leader/Character/Event/Stage/Don).
- DON!! = `Category.Don`. `Card.attributes: Attribute[]`. Deck colors derived from the leader.
- `CardTag`: `scope` (Main/Trigger), `source` (Llm/Human/Official). `Tag.kind` = Keyword (printed) vs Semantic.
- `VariantType` (`Regular`/`Parallel`/`Reprint`) from `_pN`/`_rN`; orthogonal `isPromo`/`isStarter`.
- Cross-table constraints (leader type, color intersection, ≤50, ≤4/card) enforced in the **service layer**, not the DB (except `CHECK` quantity 1-4).

### Data ingestion (`apps/api/src/ingestion/punk-records/`)

Source: [buhbbl/punk-records] (Bandai JSON, EN/FR/JP/CN/TH). Run `npm run ingest:punk` (standalone `tsx`, decoupled from the API). **Idempotent + incremental** via last git SHA in `IngestionRun.commitSha`. Flow: Pass 1 EN (creates canonical `Type` codes, stores position in `CardType.order`), Pass 2 FR (resolves Type by `order`, attaches FR translation). Variants grouped by TCG set (code prefix), not Bandai product.

**Image self-hosting (2026-05-25):** Bandai serves images `Cross-Origin-Resource-Policy: same-site` (unembeddable cross-origin), so we download during ingestion. `CardVariantImage` stores `sourceUrl` + `storageKey` (`en/OP02-001_p1.png`); served URL computed at read time in `card-mapper.ts` = `${IMAGE_BASE_URL}/${storageKey}`. `downloadImage()` (`images.ts`) streams with skip-if-exists, wired serially in `run.ts`. Storage `IMAGE_STORAGE_PATH` (gitignored), dev-served via `@nestjs/serve-static` at `/images`. Prod (S3) TBD. Details: [[project-image-self-host]].

- ⚠️ **FR image coverage < EN, and partly legitimate** — Bandai released only some variants in FR (manga/parallel/reprint), and a `Reprint` is sometimes the base art. The front is now **FR-only with no EN fallback** (see Web §Language). Backfill targets only genuine scraping misses. Details: [[project-fr-language-display]].

### API (`apps/api/src`)

NestJS modules per domain. Routes prefixed `/api/`; Swagger `/api/docs`.

- ⚠️ **ESM** (`"type":"module"`, NodeNext): all relative imports end in `.js`.
- Module layout (ref `cards/`): `*.module/controller/service.ts` (thin) + `dto/` + `internal/` (`*-include.ts` Prisma include + GetPayload, `*-where.ts` where builder, `*-mapper.ts` payload→DTO).
- Shared `src/common/`: `constants.ts` (`DEFAULT_LANG='en'`), `lang/pick-by-lang.ts`.
- **Language resolution:** every translatable endpoint takes `lang` (default `'en'`). ⚠️ **No EN fallback for card data** — in a non-default lang, only cards available in that lang are returned (where guard on a `lang` image) and variants without a `lang` image are dropped by the mapper. See [[project-fr-language-display]].
- Typing: `satisfies Prisma.<Model>Include` on include literals; response DTOs use `!:`; nullable = `field!: T | null` + `@ApiProperty({ nullable: true })`; DTO arrays need explicit `@ApiProperty({ type: [Sub] })`.
- ⚠️ `main.ts`: `NestFactory.create(AppModule, new ExpressAdapter(), { bodyParser: false })` — explicit adapter (workspace hoisting breaks autodetect), `bodyParser:false` required by `@thallesp/nestjs-better-auth`.

### Auth (`apps/api/src/auth/`)

**Better Auth** self-hosted in NestJS (sessions in Postgres via Prisma) + `@thallesp/nestjs-better-auth`. Paid plans later: **Polar.sh**. Details: [[project-auth-payment-stack]], [[rayway-esm-better-auth]].

- `auth/auth.ts`: `betterAuth({ database: prismaAdapter(...), emailAndPassword: { enabled, requireEmailVerification: false } })` (owns its own PrismaClient, module-load). `auth.module.ts` wraps `AuthModule.forRoot({ auth })`.
- `User` extended; tables `Session`/`Account`/`Verification` (PascalCase, removed CLI `@@map`). Routes at `/api/auth/*` (Express middleware). Env: `BETTER_AUTH_SECRET` (≥32), `BETTER_AUTH_URL`.
- ⚠️ Version sync: wrapper ≥2.6 vs `better-auth` ≥1.6, Node ≥22.22.1. `forRoot({...})` deprecation warning is cosmetic.
- **Protection:** global `AuthGuard` — every route protected unless `@AllowAnonymous()`/`@OptionalAuth()`. Read user via `@Session()`. ⚠️ Don't return `session.user` directly — re-fetch via Prisma with explicit `select`.

**Module status:**

- `cards/` ✅ `GET /api/cards` (filters `colors`, `category`, `tags`, `q`, `lang`, `page`, `limit`) + `/:code`. FR-only per lang (see above). Public. Reference module.
- `auth/` ✅ sign-up/in/session. Email+password only; OAuth + email-verif deferred.
- `users/` ✅ `GET /api/users/me`. Protected, minimal.
- `decks/` ❌ removed (old schema). Rewrite w/ service constraints: leader type `Leader`, color intersection, ≤50, ≤4 per `Card.code`, no DON!!. See [[project-deck-rules]].
- `collection/`, `formats/`, `types/`, `tags/`, `mentor/` (RAG) — not yet.

### Web (`apps/web/src`)

React 19 SPA / Vite. **Done:** auth, cards browsing (list + filters + detail panel + hover + pagination + search `q` + language + FR-only + styled effects). Per-slice build notes: [[project-auth-slice-status]].

**Stack:** `react-router` v7 (SPA) · `@tanstack/react-query` (`staleTime: 30_000`, `refetchOnWindowFocus: false`) · `better-auth/react` · Tailwind v4 + shadcn/ui · `react-hook-form`+`zod` · `fetch` wrapped in `api/client.ts` (base URL + `credentials:'include'`).

**Cross-origin (front :5173, API :3000):** API `enableCors({ origin, credentials: true })` · Better Auth `trustedOrigins` · every fetch `credentials:'include'` (else session cookie dropped silently).

**Design system (5 principles, 2026-05-25, details [[rayway-frontend-design-system]]):** (1) Generic UI → shadcn. (2) Layout → Tailwind utilities inline. (3) Theming → 3-bridge (`tokens.css` OKLCH → `index.css @layer base` shadcn vars → `@theme inline`), never hardcode a color. (4) Custom CSS (`styles/`) → signature visuals only. (5) Maquette = inspiration, not spec. → `pages/cards.css` holds only the `.card-tile` family; effect labels in `pages/card-effects.css`.

**Folder convention (2026-05-22):** `pages/` = route entries only (thin) · `components/ui` (shadcn) + `components/<feature>/` · `lib/` (hooks, schemas, utils) · `api/` · `styles/`. Cross-folder = `@/...`; deps go pages→components, never reverse.

**Auth on web:** `useSession()` (via `@/lib/auth-client`) = single source of truth for the user. ⚠️ Don't call `/api/users/me` from web at MVP (dupes session data). Route protection = `RequireAuth`/`RedirectIfAuth` layout wrappers in `components/auth/` (React Router 7 has no middleware).

**Cards UI patterns:**

- **Filters = URL state**, no `useState` mirror. `lib/hooks/useCardsFilter.ts` exposes filters + setters; every setter (incl. **`setLang`** — lang is now a real FR-only filter) does `prev.delete('page')` → reset to page 1. `useCards`/`useCardDetail` use `placeholderData: keepPreviousData`.
- **Search (`q`):** local `useState` mirror for snappy typing (the one exception to URL-SoT), `useDebounce` (the `clearTimeout` cleanup *is* the debounce), pushed to URL with `{ replace: true }`.
- **Language (`lang`):** `LANGUAGES`+`isLang` in `api/cards.ts`. ⚠️ Thread `lang` through list AND detail, **in the queryKey** (`['card', code, lang]`) — React Query rule: everything the queryFn reads is in the key. Card-data lang (`?lang`, per-view) is distinct from a future UI locale (global, on User/localStorage, not the path).
- **`.card-tile`** (signature visual): `idStyle.ts` injects `--id-color-a/b` + `--art-image` inline, consumed in `cards.css` via `color-mix`. Thumbnail = `card.variants[0]`. ⚠️ No `width:100%` on `.card-tile` (parent sizes it); **unlayered CSS beats `@layer utilities`** regardless of specificity.
- **Detail panel** = non-modal side-sheet, **state from the URL** (`/cards/:code` nested under `/cards`, `<Outlet/>` + `useMatch`). `<Sheet modal={false}>` `showOverlay={false}` `onInteractOutside preventDefault` → clicking another thumb re-fetches in place. ⚠️ Sheet width: removed `data-[side]:sm:max-w-sm` from `ui/sheet.tsx` (data-variant specificity beats `cn()`-passed classes); keep `<main>` `sm:pr-[42rem]` in sync with the `sm:max-w-2xl` sheet.
- **Hover preview** = text-only (full effect), inlined in `CardThumb` via `<HoverCard>`. ⚠️ `<HoverCardTrigger asChild>` mandatory; CSS vars don't cross Radix Portals (re-inject if needed).
- **Effects render:** `lib/renderEffects.tsx` `renderEffect()` tokenizes the text (`split` with a capturing group) — `[..]`→keyword/timing/DON pill (`.fx-kw`/`.fx-kw--don`), `{..}`→type (`.fx-type`) — and decodes `&nbsp;`/`&lt;`/`&gt;`. **Never `dangerouslySetInnerHTML`.** Wire it on both `effect` **and** `triggerEffect`. ⚠️ `--accent` is shadcn-overridden in `index.css`; use `--accent-hi/-glow/-fg` for the brand color. See [[project-fr-language-display]].
- **Pagination:** shadcn `<Pagination>` in a sticky footer; `getPageRange(current,total)`. `<PaginationLink>` is an `<a>` → `href="#"`+`onClick preventDefault`.
- **URL search preservation:** internal nav in a URL-state feature must propagate `location.search` (`CardThumb` Link, sheet-close navigate).

**Next on Cards:** (1) adaptive page-size + `?size` selector (`limit` hardcoded 30); (2) anti-flash (dim on `isPlaceholderData`, prefetch next page); (3) filter facets rarity/cost/type (extend `CardQueryDto` + `buildCardWhere` first, then reuse the `q`/`lang` URL-state pattern).
