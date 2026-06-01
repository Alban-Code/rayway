# CLAUDE.md

Guidance for Claude Code working in this repo.

## Overview

Rayway — One Piece TCG companion SaaS: decks, multi-language collection, Ollama mentor (RAG over the card DB, no vectors). npm workspace monorepo: `apps/api` (NestJS + PostgreSQL/Prisma), `apps/web` (React 19 + Vite SPA).

## Commands

- Root: `npm run dev:api` / `npm run dev:web`.
- `apps/api`: `build` / `start:prod` / `lint` / `test` (jest `*.spec.ts`) / `test:e2e`. Ingestion: `npm run ingest:punk`.
- `apps/web`: `build` (tsc -b && vite build) / `lint` / `preview`.

## Database

PostgreSQL, `DATABASE_URL` in `apps/api/.env`. Prisma (from `apps/api`): `npx prisma migrate dev|deploy|generate`, config `prisma.config.ts`. New `prisma-client` generator (Prisma 7+), output `apps/api/src/generated/prisma`. ESM imports end in `.js`: `from '../generated/prisma/client.js'`, `.../enums.js`.

- ⚠️ Prisma 7 `PrismaClient` **requires** a driver adapter (`@prisma/adapter-pg` + `DATABASE_URL`); bare `new PrismaClient()` throws. Pattern: `apps/api/prisma/prisma.service.ts`.
- ⚠️ After any `schema.prisma` change run `npx prisma generate` **explicitly** — custom output path means `migrate dev` doesn't always regenerate.

## Data model (`apps/api/prisma/schema.prisma`)

Full ref: `apps/api/docs/database.md`. **Canonical core + per-language translations** → new languages = `INSERT`s, no migrations.

Models: `Language` (PK = ISO code) · `User` · catalog (`CardSet`, `Card` = language-neutral stats, `CardTranslation`, `CardVariant`, `CardVariantImage`) · `Type`/`TypeTranslation`/`CardType` join · `Tag`/`TagTranslation`/`CardTag` join (RAG, not player-visible) · `Format`/`FormatLegality` · `Deck`/`DeckCard` · `CollectionItem` · `IngestionRun`.

- PKs `cuid()` except `Language.code`. Business IDs (`Card.code`, `CardVariant.variantCode`) in `@unique`, never PKs.
- ⚠️ `CardType` = join Card↔Type (tribes like "Straw Hat Crew") ≠ `Card.category` (`Category` enum: Leader/Character/Event/Stage/Don). DON!! = `Category.Don`. `Card.attributes: Attribute[]`. Deck colors derived from leader.
- `CardTag`: `scope` (Main/Trigger), `source` (Llm/Human/Official). `Tag.kind` = Keyword (printed) vs Semantic. `VariantType` (`Regular`/`Parallel`/`Reprint`) from `_pN`/`_rN`; orthogonal `isPromo`/`isStarter`.
- Cross-table constraints (leader type, color intersection, ≤50, ≤4/card) in the **service layer**, not DB (except `CHECK` quantity 1-4).

## Ingestion (`apps/api/src/ingestion/punk-records/`)

Source [buhbbl/punk-records] (Bandai JSON, EN/FR/JP/CN/TH). Standalone `tsx`. **Idempotent + incremental** via last git SHA in `IngestionRun.commitSha`. Pass 1 EN (creates canonical `Type` codes, position in `CardType.order`), Pass 2 FR (resolves Type by `order`). Variants grouped by TCG set prefix.

- **Image self-host (2026-05-25):** Bandai images are `Cross-Origin-Resource-Policy: same-site`, so downloaded at ingestion. `CardVariantImage` = `sourceUrl` + `storageKey` (`en/OP02-001_p1.png`); served URL computed in `card-mapper.ts` = `${IMAGE_BASE_URL}/${storageKey}`. `downloadImage()` (`images.ts`) skip-if-exists, serial in `run.ts`. `IMAGE_STORAGE_PATH` gitignored, dev-served via `@nestjs/serve-static` at `/images`. Prod (S3) TBD. [[project-image-self-host]].
- ⚠️ **FR image coverage < EN, partly legitimate** — Bandai released only some variants in FR; a `Reprint` is sometimes the base art. Front is **FR-only, no EN fallback**. Backfill only genuine scraping misses. [[project-fr-language-display]].

## API (`apps/api/src`)

NestJS modules per domain. Routes `/api/`; Swagger `/api/docs`.

- ⚠️ **ESM** (`"type":"module"`, NodeNext): all relative imports end in `.js`.
- Module layout (ref `cards/`): `*.module/controller/service.ts` (thin) + `dto/` + `internal/` (`*-include.ts` Prisma include + GetPayload, `*-where.ts` where builder, `*-mapper.ts` payload→DTO).
- Shared `src/common/`: `constants.ts` (`DEFAULT_LANG='en'`), `lang/pick-by-lang.ts`.
- **Language:** every translatable endpoint takes `lang` (default `'en'`). ⚠️ **No EN fallback for card data** — non-default lang returns only cards available in that lang (where guard on a `lang` image; variants without a `lang` image dropped by mapper). [[project-fr-language-display]].
- Typing: `satisfies Prisma.<Model>Include`; DTOs use `!:`; nullable = `field!: T | null` + `@ApiProperty({ nullable: true })`; DTO arrays need `@ApiProperty({ type: [Sub] })`.
- ⚠️ `main.ts`: `NestFactory.create(AppModule, new ExpressAdapter(), { bodyParser: false })` — explicit adapter (workspace hoisting breaks autodetect), `bodyParser:false` for `@thallesp/nestjs-better-auth`.

### Auth (`apps/api/src/auth/`)

**Better Auth** self-hosted (sessions in Postgres via Prisma) + `@thallesp/nestjs-better-auth`. Paid plans later: **Polar.sh**. [[project-auth-payment-stack]], [[rayway-esm-better-auth]].

- `auth/auth.ts`: `betterAuth({ database: prismaAdapter(...), emailAndPassword: { enabled, requireEmailVerification: false } })` (owns its own PrismaClient). `auth.module.ts` wraps `AuthModule.forRoot({ auth })`.
- Tables `Session`/`Account`/`Verification` (PascalCase). Routes `/api/auth/*`. Env: `BETTER_AUTH_SECRET` (≥32), `BETTER_AUTH_URL`. Version sync: wrapper ≥2.6 / `better-auth` ≥1.6, Node ≥22.22.1.
- **Protection:** global `AuthGuard` — every route protected unless `@AllowAnonymous()`/`@OptionalAuth()`. Read user via `@Session()`. ⚠️ Don't return `session.user` directly — re-fetch via Prisma with explicit `select`.

### Module status

- `cards/` ✅ `GET /api/cards` (filters `colors`, `category`, `attribute`, `types`, `tags`, `q`, `lang`, `page`, `limit`) + `/:code`. FR-only per lang. Public. Reference module. `types` = OU (`{ types: { some: { type: { code: { in } } } } }`), `attribute` = mono (`{ attributes: { has } }`).
- `types/` ✅ `GET /api/types?lang` → `[{code,label}]`. Public. **strict-lang** (where `translations.some.languageCode`, no EN fallback), sorted by label. ⚠️ `@ApiOkResponse({ type: [TypeDto] })`.
- `auth/` ✅ sign-up/in/session (email+password only). `users/` ✅ `GET /api/users/me` (protected, minimal).
- `decks/` ❌ removed — rewrite w/ service constraints (leader type, color intersection, ≤50, ≤4/`Card.code`, no DON!!). [[project-deck-rules]].
- `collection/`, `formats/`, `tags/`, `mentor/` (RAG) — not yet.

## Web (`apps/web/src`)

React 19 SPA / Vite. **Done:** auth, cards browsing (list + filters + detail panel + hover + pagination + `q` + language + FR-only + styled effects + attribute & type facets). [[project-auth-slice-status]].

**Stack:** `react-router` v7 · `@tanstack/react-query` (`staleTime: 30_000`, `refetchOnWindowFocus: false`) · `better-auth/react` · Tailwind v4 + shadcn/ui (registry `radix-mira`, base `@base-ui/react`) · `react-hook-form`+`zod` · `fetch` in `api/client.ts` (base URL + `credentials:'include'`).

**Cross-origin (front :5173, API :3000):** API `enableCors({ origin, credentials: true })` · Better Auth `trustedOrigins` · every fetch `credentials:'include'` (else session cookie dropped silently).

**Design system (5 principles, [[rayway-frontend-design-system]]):** (1) generic UI → shadcn; (2) layout → Tailwind inline; (3) theming → 3-bridge (`tokens.css` OKLCH → `index.css @layer base` shadcn vars → `@theme inline`), never hardcode a color; (4) custom CSS (`styles/`) → signature visuals only; (5) maquette = inspiration, not spec.

**Folder convention:** `pages/` = thin route entries · `components/ui` (shadcn) + `components/<feature>/` · `lib/` (hooks, schemas, utils) · `api/` · `styles/`. Cross-folder = `@/...`; deps go pages→components only.

**Auth on web:** `useSession()` (via `@/lib/auth-client`) = single source of truth for the user. ⚠️ Don't call `/api/users/me` from web at MVP. Route protection = `RequireAuth`/`RedirectIfAuth` layout wrappers (React Router 7 has no middleware).

### Cards UI patterns

- **Filters = URL state**, no `useState` mirror. `lib/hooks/useCardsFilter.ts` exposes filters + setters; every setter (incl. **`setLang`** — lang is a real FR-only filter) does `prev.delete('page')`. `useCards`/`useCardDetail` use `placeholderData: keepPreviousData`.
- **Search (`q`):** local `useState` mirror for snappy typing (the one URL-SoT exception), `useDebounce` (the `clearTimeout` cleanup *is* the debounce), pushed with `{ replace: true }`.
- **Language (`lang`):** `LANGUAGES`+`isLang` in `api/cards.ts`. ⚠️ Thread `lang` through list AND detail, **in the queryKey** (`['card', code, lang]`) — everything the queryFn reads is in the key. Card-data lang (`?lang`, per-view) ≠ future UI locale (global, on User/localStorage, not the path).
- **Type facet:** `TypeFilter.tsx` + `useTypes({lang})` (queryKey `['types',{lang}]`). UI = **Base UI Combobox** (`@base-ui/react`, NOT cmdk) — follow Base UI docs, all parts already in `ui/combobox.tsx`. ⚠️ Gotchas: (1) `value` is the **item type** — can't be string codes when items are objects; control via URL with `value={data.filter(t => types.includes(t.code))}` + `onValueChange={s => setTypes(s.map(t => t.code))}`. (2) **`itemToStringLabel`** = display + text filtering; `itemToStringValue` = form submit only. (3) `isItemEqualToValue={(a,b)=>a.code===b.code}` (default equality is `Object.is`). `setTypes(codes)` appends multi `?types=`.
- **Attribute facet:** mono-select shadcn `<Toggle>` like Category. `ATTRIBUTES` is an `as const` array (not object) so `.map` works.
- **Active chips label-from-code:** `ActiveFilterChips` re-calls `useTypes({lang})` (deduped by queryKey, no extra fetch) → `Map(code→label)`, render `labelByCode.get(code) ?? code`. Skeleton gated on **`!typeOptions`** (not `isPending`) → no flash when cache is warm.
- **`.card-tile`** (signature visual): `idStyle.ts` injects `--id-color-a/b` + `--art-image` inline, consumed in `pages/cards.css` via `color-mix`. ⚠️ No `width:100%` on `.card-tile`; **unlayered CSS beats `@layer utilities`** regardless of specificity.
- **Detail panel** = non-modal side-sheet, **state from URL** (`/cards/:code` nested under `/cards`, `<Outlet/>` + `useMatch`). `<Sheet modal={false}>` `showOverlay={false}` `onInteractOutside preventDefault`. ⚠️ Removed `data-[side]:sm:max-w-sm` from `ui/sheet.tsx` (data-variant specificity beats `cn()` classes); keep `<main>` `sm:pr-[42rem]` in sync with the `sm:max-w-2xl` sheet.
- **Hover preview** = text-only, inlined in `CardThumb` via `<HoverCard>`. ⚠️ `<HoverCardTrigger asChild>` mandatory; CSS vars don't cross Radix Portals.
- **Effects render:** `lib/renderEffects.tsx` `renderEffect()` tokenizes via `split` capturing group — `[..]`→keyword/timing/DON pill (`.fx-kw`/`.fx-kw--don`), `{..}`→type (`.fx-type`) — decodes `&nbsp;`/`&lt;`/`&gt;`. **Never `dangerouslySetInnerHTML`.** Wire on both `effect` AND `triggerEffect`. ⚠️ `--accent` is shadcn-overridden; use `--accent-hi/-glow/-fg` for the brand color.
- **Pagination:** shadcn `<Pagination>` sticky footer; `getPageRange(current,total)`; `<PaginationLink>` is an `<a>` → `href="#"`+`onClick preventDefault`.
- **URL search preservation:** internal nav in a URL-state feature must propagate `location.search` (`CardThumb` Link, sheet-close navigate).

**Next on Cards:** (1) facets `rarity` (enum → like category) + `cost` (numeric range, only new pattern) — extend `CardQueryDto` + `buildCardWhere` first; (2) adaptive page-size + `?size` selector (`limit` hardcoded 30); (3) anti-flash (dim on `isPlaceholderData`, prefetch next page).
