# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Rayway is a One Piece TCG (trading card game) companion app — a multi-user SaaS where players can build/share decks, track their physical collection in multiple languages, and chat with an Ollama-powered mentor (RAG over the card database, no vectors).

npm workspace monorepo with two apps:

- `apps/api` — NestJS REST API backed by PostgreSQL via Prisma
- `apps/web` — React 19 + Vite frontend

## Commands

From the repo root: `npm run dev:api` (API watch), `npm run dev:web` (web dev server).

From `apps/api`: `npm run build` / `start:prod` / `lint` (eslint --fix) / `test` (jest `*.spec.ts`) / `test:watch` / `test:cov` / `test:e2e`.

From `apps/web`: `npm run build` (tsc -b && vite build) / `lint` / `preview`.

## Database

PostgreSQL required. `DATABASE_URL` configured in `apps/api/.env` (default DB `onepiecetcg-db`).

Prisma commands (from `apps/api`): `npx prisma migrate dev` / `migrate deploy` / `generate`. Config in `prisma.config.ts`.

Uses the **new `prisma-client` generator** (Prisma 7+), not legacy `prisma-client-js`. Client is generated to `apps/api/src/generated/prisma` (custom output path required). Import from there with the `.js` extension (ESM):

```ts
import { PrismaClient } from '../generated/prisma/client.js';
import { Category, Color, Attribute, Rarity } from '../generated/prisma/enums.js';
```

⚠️ Prisma 7's `PrismaClient` constructor **requires** a driver adapter argument (`@prisma/adapter-pg` + `DATABASE_URL`). Calling `new PrismaClient()` bare throws. Reference pattern: `apps/api/prisma/prisma.service.ts`.

⚠️ After any `schema.prisma` change, run `npx prisma generate` **explicitly** — with the custom output path, `migrate dev` does NOT always regenerate the client, causing "column does not exist" runtime errors despite an up-to-date DB.

## Architecture

### Data model (`apps/api/prisma/schema.prisma`)

**Full reference: [`apps/api/docs/database.md`](apps/api/docs/database.md)** — field-by-field details, query patterns, ingestion flow.

Built around a **canonical core + per-language translations** pattern, so new languages are added with `INSERT`s only, no migrations.

Model groups: `Language` (PK = ISO 639-1 code) · `User` · catalog (`CardSet`, `Card` = language-neutral stats, `CardTranslation`, `CardVariant`, `CardVariantImage`) · `Type`/`TypeTranslation`/`CardType` join · `Tag`/`TagTranslation`/`CardTag` join (RAG enrichment, not player-visible) · `Format`/`FormatTranslation`/`FormatLegality` · `Deck`/`DeckCard` · `CollectionItem` · `IngestionRun`.

Key conventions:

- PKs are `cuid()` except `Language.code` (natural ISO key). Business identifiers (`Card.code`, `CardVariant.variantCode`, `Tag.code`, `Type.code`…) live in dedicated `@unique` columns, never as PKs.
- ⚠️ `CardType` is the **join table** between `Card` and `Type` (tribal categories like "Straw Hat Crew") — do not confuse with `Card.category` (Leader/Character/Event/Stage/Don, the `Category` enum).
- DON!! cards are `Category.Don` (no separate flag/table). `Card.attributes` is `Attribute[]`.
- Deck colors are derived from the leader, not stored on `Deck`.
- `CardTag` carries `scope` (Main/Trigger), `source` (Llm/Human/Official), optional confidence. `Tag.kind` = `Keyword` (printed: Rush, Blocker…) vs `Semantic` (custom: searcher, drawer…).
- Variant classification: `VariantType` enum (`Regular`/`Parallel`/`Reprint`) from Bandai's `_pN`/`_rN` suffix, plus orthogonal `isPromo`/`isStarter`.
- Enums: `Color`, `Category`, `Attribute`, `Rarity`, `LegalityStatus`, `TagSource`, `TagScope`, `TagKind`, `VariantType`, `IngestionStatus`. Full semantics in database.md §5.

Cross-table constraints (leader must be type `Leader`, deck cards must match leader colors, deck ≤ 50, max 4 copies/card) are enforced at the **NestJS service layer**, not the DB — except simple `CHECK` constraints (quantity 1-4) in raw SQL migrations.

### Data ingestion

Source: [buhbbl/punk-records](https://github.com/buhbbl/punk-records) (JSON scraped from Bandai, supports EN/FR/JP/CN-HK/CN-TW/TH).

Code in `apps/api/src/ingestion/punk-records/`, run via `npm run ingest:punk` (standalone `tsx` script, decoupled from the API so it can later run as a Cloud Run Job / ECS task). **Idempotent + incremental**: stores last successful git SHA in `IngestionRun.commitSha`, only re-processes changed files.

Flow: Pass 1 = EN (creates canonical `Type` codes by slugifying EN labels, stores source position in `CardType.order`), Pass 2 = FR (resolves canonical `Type` per card by `CardType.order`, attaches FR `TypeTranslation`). Details: database.md §8, punk-records.md.

Note: punk-records groups variants by Bandai **product** (`pack_id`, differs per language); our schema uses TCG sets (`OP01`, `ST15`…) from the card-code prefix (stable across languages). Pack info not stored.

**Image self-hosting (shipped 2026-05-25):** We download and self-host card images during ingestion because Bandai serves them with `Cross-Origin-Resource-Policy: same-site` (unembeddable cross-origin). `CardVariantImage` stores `sourceUrl` (Bandai) + `storageKey` (e.g. `en/OP02-001_p1.png`); the served URL is computed at read time in `cards/internal/card-mapper.ts` as `${IMAGE_BASE_URL}/${storageKey}` (never stored). `downloadImage()` (`ingestion/punk-records/images.ts`) streams to disk with skip-if-exists; wired serially in `run.ts` after `upsertCard` commits, in its own try/catch. Storage at `IMAGE_STORAGE_PATH` (gitignored), served in dev via `@nestjs/serve-static` at `/images`. Prod backend (S3) is TBD — extract behind an `ImageStorage` interface when needed (YAGNI for now). No orphan cleanup yet.

⚠️ **FR image coverage is partial** (2026-05-31: ~2383 `fr/` files on disk vs ~4203 `en/`). The code path is correct — `run.ts` loops `['en','fr']`, `parser.ts` builds the lang-prefixed `storageKey` (`fr/<id>.png`), and `upsert.ts` upserts `CardVariantImage` per `(variantId, languageCode)` in **both** passes — so the gap is *coverage*, not wiring; cards lacking an FR image fall back to EN via `pickByLang`. Suspects to investigate: incremental skip (`listChangedCardFiles` vs `IngestionRun.lastSha` — a re-run with unchanged SHA early-exits, so a backfill needs a forced full run), FR source JSONs missing `img_full_url`, and the **per-card (not per-variant) try/catch** in `run.ts` that skips a card's remaining variants once one download throws.

### API (`apps/api/src`)

NestJS modules, one per domain feature. Routes prefixed `/api/` (`app.setGlobalPrefix('api')`); Swagger at `/api/docs`.

⚠️ **ESM project** (`"type": "module"`, `"module": "NodeNext"`). All relative imports must include `.js` (e.g. `./cards/cards.module.js`). Package imports don't need it.

Module structure (reference: `cards/`):

```
<module>/
├── <module>.module.ts / .controller.ts / .service.ts (thin, orchestration only)
├── dto/                  # input + response DTOs with @ApiProperty
└── internal/             # private helpers
    ├── *-include.ts      # Prisma include factory + GetPayload type
    ├── *-where.ts        # Prisma where builder
    └── *-mapper.ts       # DB payload → DTO
```

Shared code in `src/common/`: `constants.ts` (`DEFAULT_LANG = 'en'`), `lang/pick-by-lang.ts` (`pickByLang<T>(items, lang)` → match lang, fall back to `DEFAULT_LANG`, else `null`).

**Language resolution:** every translatable endpoint accepts a `lang` query param (default `'en'`). The Prisma `include` filters translations on `[lang, DEFAULT_LANG]` only; the mapper picks the requested lang with EN fallback per row. Responses include a `language` field reflecting what was served.

DTO / Prisma typing:

- Use `satisfies Prisma.<Model>Include` (not `:`) on include literals → preserves shape for `Prisma.<Model>GetPayload<...>`.
- Response DTOs use definite-assignment `!:` (assigned at runtime by the mapper).
- Nullable: `field!: T | null` + `@ApiProperty({ type: T, nullable: true })`. Arrays of DTOs: `@ApiProperty({ type: [SubDto] })` (Swagger won't infer it).

⚠️ `main.ts` bootstrap: `NestFactory.create(AppModule, new ExpressAdapter(), { bodyParser: false })`. The explicit adapter works around workspace-hoisting breaking `PackageLoader` autodetection; `bodyParser: false` is required by `@thallesp/nestjs-better-auth`.

### Auth (`apps/api/src/auth/`)

Stack: **Better Auth** (self-hosted in NestJS, sessions in Postgres via Prisma) + **`@thallesp/nestjs-better-auth`** wrapper. Future paid plans: **Polar.sh** via `@polar-sh/better-auth` (Merchant of Record, EU VAT).

- `auth/auth.ts` — `betterAuth({ database: prismaAdapter(...), emailAndPassword: { enabled: true, requireEmailVerification: false } })`. Owns its own `PrismaClient` (evaluated at module-load, before DI).
- `auth/auth.module.ts` — wraps `AuthModule.forRoot({ auth })` (aliased `BetterAuthModule`).
- Schema: `User` extended (`name`, `emailVerified`, `image`, `sessions`/`accounts` relations); tables `Session`, `Account`, `Verification` (we removed the CLI's `@@map` lowercase mappings to keep PascalCase).
- Routes mounted at `/api/auth/*` via Express middleware (respects the `/api` prefix automatically; not in the Nest route log).
- Env (`apps/api/.env`): `BETTER_AUTH_SECRET` (≥32 chars, `openssl rand -base64 32`), `BETTER_AUTH_URL` (`http://localhost:3000` dev).

⚠️ Version sync: wrapper `@thallesp/nestjs-better-auth` ≥ 2.6 against `better-auth` ≥ 1.6 (older wrapper imports `createAuthMiddleware` from a moved path). Wrapper needs Node ≥ 22.22.1. The TS deprecation warning on the object-arg `forRoot({ auth, ... })` is cosmetic (only the 2-arg signature is deprecated).

**Protection model:** the wrapper installs a **global `AuthGuard`** — every route is protected unless marked `@AllowAnonymous()` / `@OptionalAuth()`. Use `@Session() session: UserSession<typeof auth>` to read `session.user.id`.

⚠️ Don't return `session.user` directly — re-fetch via Prisma with an explicit `select` matching your DTO.

**Module status:**

- **`cards/`** ✅ `GET /api/cards` (paginated, filters: `colors`, `category`, `tags`, `q`, `lang`, `page`, `limit`) + `GET /api/cards/:code`. Multi-lang with EN fallback, public (`@AllowAnonymous()`). Reference structure for new modules.
- **`auth/`** ✅ sign-up/sign-in/get-session functional. Email/password only; OAuth deferred; email verification off at MVP.
- **`users/`** ✅ `GET /api/users/me` (id, email, name, emailVerified, image, createdAt). Protected. Minimal (no `internal/`).
- **`decks/`** ❌ removed (old schema). To rewrite with service-layer constraints: leader type `Leader`, color intersection `Card.colors ∩ Leader.colors ≠ ∅`, ≤ 50 cards, ≤ 4 per `Card.code` (summed across variants), no DON!! cards.
- **`collection/`, `formats/`, `types/`, `tags/`, `mentor/` (RAG)** — not yet. Next focus is the web frontend.

### Web (`apps/web/src`)

React 19 SPA on Vite. **Slices done:** auth (sign-in/up/out + account, 2026-05-24) and cards browsing (list + filters + detail panel + hover preview + pagination, 2026-05-29; **search `q` + language switcher, 2026-05-31**).

**Stack:** `react-router` v7 (SPA, no SSR) · `@tanstack/react-query` (cache/refetch, `staleTime: 30_000`, `refetchOnWindowFocus: false`) · `better-auth/react` (auth client) · Tailwind v4 + shadcn/ui · `react-hook-form` + `zod` · native `fetch` wrapped in `api/client.ts` (injects base URL + `credentials: 'include'`).

**Cross-origin wiring (front `:5173`, API `:3000`):** API `enableCors({ origin: 'http://localhost:5173', credentials: true })` · Better Auth `trustedOrigins: ['http://localhost:5173']` · every fetch must pass `credentials: 'include'` (else the session cookie is dropped silently).

#### Design system — 5 ruling principles (decided 2026-05-25)

1. **Generic UI → shadcn.** `npx shadcn@latest add <component>`. Don't rewrite in CSS what shadcn provides.
2. **Layout → Tailwind utilities** inline on JSX (`grid grid-cols-[230px_1fr]`, `flex gap-4`, `h-dvh`). No `.cards-page { display: grid }` for a banal 2-column layout.
3. **Theming → the 3-bridge stays.** `styles/tokens.css` (OKLCH tokens) → `index.css` `@layer base` maps shadcn vars → `@theme inline` registers them with Tailwind v4. `bg-primary` / `border-border` resolve to tokens — never hardcode a color. Only the `devil-fruit` palette is wired; 6 others stay dormant.
4. **Custom CSS (in `styles/`) → signature visuals only** (the `.card-tile` bicolor gradient, hover glow, `:has()` dimming). Not for layout, not for a button.
5. **Maquette = visual inspiration, NOT spec.** Adapt the spirit (dark + glow + OKLCH + display typo); don't reproduce HTML/CSS 1:1.

Consequence: `pages/cards.css` should hold only the `.card-tile` family. `primitives.css` shrinks as screens get migrated (replace when you touch them, no big-bang).

#### Folder convention (type-first, 2026-05-22)

```
src/
├── pages/              ← ONLY route entry components (1 file = 1 route, thin)
├── components/
│   ├── ui/             ← shadcn primitives, cross-feature
│   └── <feature>/      ← sub-components scoped to one feature (auth/, cards/…)
├── lib/                ← non-components: auth-client, Zod schemas, hooks, utils
├── api/                ← HTTP client wrappers
└── styles/             ← tokens.css, primitives.css, pages/*.css
```

Cross-folder imports use the `@/...` alias; same-folder use relative. Dependency direction is `pages → components`, never reverse — a sub-component's prop type is defined in the component and imported by the page.

#### Auth on the web client

`useSession()` from `better-auth/react` (re-exported via `@/lib/auth-client`) is the **single source of truth for the current user**. Exposes `data.user` = `{ id, email, name, image, emailVerified, createdAt }`.

⚠️ **Do not call `/api/users/me` from the web at MVP** — it duplicates session data. The REST endpoint is for future non-web consumers. New domain-specific user fields → a separate endpoint + React Query hook, not `/me`.

**Route protection (React Router 7 has no middleware):** layout-route wrappers in `components/auth/` — `RequireAuth` (`<Navigate to="/sign-in" replace />` if unauth, else `<Outlet />`) and `RedirectIfAuth` (inverse, wraps `/sign-in` + `/sign-up`). Both handle `isPending` explicitly to avoid a flash redirect. Wired in `App.tsx` via pathless layout routes.

**Form pattern** (`SignInForm`/`SignUpForm`): `useForm` + `zodResolver` (schemas in `lib/auth-schemas.ts`) · local `useState` for server errors (Better Auth returns `{ data, error }`, no throw) · `navigate("/account")` on success · `noValidate` on `<form>` · `autoComplete` `current-password` vs `new-password`. `SignUpForm` has a `pwScore` strength bar.

#### Cards UI patterns

**Filters & URL state** — source of truth is the URL, no `useState` mirror.
- `lib/hooks/useCardsFilter.ts` exposes `colors`, `category`, `q`, `lang`, `page`, `activeCount`, `handleColorClick`, `setCategoryFilter`, `setSearch`, `setLang`, `setPage`, `clearAll`.
- ⚠️ Any filter setter does `prev.delete('page')` → changing a filter always resets to page 1 (else filtering on page 5 lands on an empty grid). `setPage(n)` deletes the key when `n` is falsy/1 (clean URL).
- `lib/hooks/useCards.ts` / `useCardDetail.ts` — `useQuery` wrappers; both use `placeholderData: keepPreviousData` so page/card transitions don't flash the skeleton.

**Search (`q`, 2026-05-31)** — the one spot a local `useState` mirror beats pure URL state (snappy typing); the URL stays the source of truth for the query.
- `lib/hooks/useDebounce.ts` — `useEffect` + `setTimeout` with a **`clearTimeout` cleanup** (the cleanup IS the debounce: each keystroke cancels the previous pending timer, only the last survives). Seed `useState(value)` so it's never `undefined`.
- `CardSearch.tsx` — controlled `<Input value={text}>`, `useDebounce(text, 300)` pushed to the URL via `setSearch`. To reflect *external* URL changes (clearAll, back button) back into the input, resync with the render-time pattern (`const [prevQ,setPrevQ]=useState(q); if(q!==prevQ){setPrevQ(q);setText(q)}`) — more performant than a `[q]` effect (adjusts during render, no second paint).
- `useCardsFilter.setSearch` writes `?q=` with `{ replace: true }` (no history spam while typing) + `prev.delete('page')`. `fetchCards` guards `if (params.q)` (truthy, not `!== undefined`) so an empty `q` is omitted. API already supported `q` (`card-where.ts`, on translations name/effect).

**Language (`lang`, 2026-05-31)** — `LANGUAGES` const + `isLang` guard in `api/cards.ts` (only `en`/`fr` seeded). `useCardsFilter` exposes `lang` + `setLang`.
- ⚠️ `setLang` does **NOT** `prev.delete('page')` — language is a *view* (same cards, re-translated), not a filter, so it must not reset the page. (Edge case: with `q` active, switching lang can shift matches/total; ignored for now.)
- UI: controlled shadcn `<Select>` in the `CardsPage` header — `value={filters.lang}` + `onValueChange={(v) => { if (isLang(v)) setLang(v) }}` (guard narrows `string`→`LangCode`). The handler goes on the **root `<Select>`**, not `SelectContent`.
- ⚠️ Thread `lang` through **both** the list (`useCards`) **and** the detail: `fetchCard(code, lang)` + `useCardDetail(code, lang)` with `lang` **in the queryKey** (`['card', code, lang]`). Forgetting the detail = panel stuck in EN while the hover (fed by the list query) shows FR. **React Query rule: everything the queryFn reads must be in the queryKey**, else a stale cache entry is served. `CardDetailSheet` reads `lang` from `useCardsFilter().lang` (the `?lang` survives nested nav because `CardThumb`/sheet-close propagate `location.search`).
- Architecture decision: card-data language (`?lang`, scoped to the cards feature, shareable per-view) is **distinct** from a future UI locale (global; will live on `User`/localStorage, NOT in the path for an authed SPA). When UI i18n lands, `lang`'s default falls back to the UI locale; the `?lang` override is unchanged.

**Signature visual — `.card-tile`** (the one place custom CSS earns its keep):
- `lib/idStyle.ts` `idColorStyle(colors)` → `{ '--id-color-a', '--id-color-b' }` (fallback `var(--accent)`; mono-color → `b = a`).
- `CardThumb.tsx` injects `--id-color-a/b` + `--art-image` inline; JSX renders only `top-bar` + `art` (the printed image already shows cost/name/type/code — no overlays).
- Pattern (reusable for any dynamic-color visual): inject CSS vars via inline `style`, consume them in CSS with `color-mix` + fallbacks.
- ⚠️ `.card-tile` carries **no `width: 100%`** — parent grid/flex sizes it, and Tailwind utilities (`w-[140px]`) can apply. **Unlayered CSS outranks `@layer utilities` regardless of specificity** — if a Tailwind utility silently doesn't apply, suspect an unlayered rule on the same property.

**Card detail panel** — non-modal side-sheet, **state derived from the URL**, never `useState`. `/cards/:code` is a nested route under `/cards`; `CardsPage` renders `<Outlet />`, `useMatch('/cards/:code')` tells whether it's open.
- `CardDetailSheet.tsx` reads `:code`, fetches, renders `<Sheet modal={false}>` with `showOverlay={false}` and `onInteractOutside={(e) => e.preventDefault()}` — so clicking another `CardThumb` updates the panel in place (re-fetch on new `:code`) without closing. Escape / ✕ close via `navigate('/cards')`.
- `CardDetailView.tsx` (pure presentation) + one file per section: `CardDetail{Header,Stats,Chips,Effects,Variants}.tsx`. Wrap the view in `<div key={card.code} className="animate-in fade-in-50">` to replay the fade on each card.
- ⚠️ **Sheet specificity:** removed `data-[side=...]:sm:max-w-sm` from `ui/sheet.tsx`'s default className — `data-[...]:` variants compile to higher-specificity selectors that beat a `sm:max-w-2xl` passed via `cn()` (and `tailwind-merge` only resolves equal-specificity conflicts). General lesson: when a shadcn class won't override, suspect `data-`/`aria-`/`group-data-` variant specificity; fix it by editing the shadcn file, not by adding `!`.
- ⚠️ **Panel/grid width must stay in sync:** `<main>` gets `sm:pr-[min(100vw,42rem)]` when open; the Sheet is `sm:max-w-2xl` (= 42rem). Change one → change the other.

**Hover preview** — text-dense (full effect text, no image), inlined in `CardThumb.tsx` via shadcn `<HoverCard openDelay={300} closeDelay={100}>`. Reuses `CardDetailHeader/Stats/Chips/Effects` (no Variants).
- ⚠️ `<HoverCardTrigger asChild>` is mandatory (else Radix wraps the `<Link>` in a `<button>`, breaking ctrl-click + a11y).
- ⚠️ **CSS vars don't propagate through Radix Portals** — re-inject `style={idColorStyle(...)}` on `<HoverCardContent>` if you need bicolor there.

**Card effects render** — DB stores raw `<br/>`. `CardDetailEffects` uses a `normalizeBreaks()` helper (`<br\s*\/?>` → `\n`) + `whitespace-pre-line`. **Never `dangerouslySetInnerHTML`**, even on "trusted" DB content.

**Pagination** — shadcn `<Pagination>` in a sticky `<main>` footer (outside the scroll region). `getPageRange(current, total): (number | 'ellipsis')[]` (top-of-file, 4 cases: ≤7 all, near-start, near-end, middle).
- ⚠️ `<PaginationLink>` renders an `<a>`: pass `href="#"` + `onClick` with `preventDefault` (keeps styling, keeps routing). For disabled Prev/Next combine `aria-disabled` + `tabIndex={-1}` + `pointer-events-none opacity-50` and early-return in `onClick`.
- Scroll-to-top on page change: `useEffect` (not layout) on `[page]` → `scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })`, ref on the `flex-1 overflow-auto` div.

**Principle — URL search preservation:** any internal navigation within a URL-state feature must propagate `location.search` (e.g. `CardThumb` `<Link to={{ pathname, search: location.search }}>`, `CardDetailSheet` close `navigate({ pathname: '/cards', search: location.search })`). If this duplicates more than twice, extract a `useCardsLink()` helper.

#### Next steps on the Cards slice

1. **Adaptive page size + selector** — `limit` is hardcoded at 30. Plan: cols fixed per breakpoint, rows snapped to `innerHeight` buckets via a `useGridSize()` hook (preserve identity when buckets don't change → no cache miss). User-selectable via shadcn `<Select>` (`Auto/24/48/96`), persisted via `?size=N` + localStorage. Setting size resets `page` to 1.
2. **Anti-flash polish** — dim grid during refetch via `isPlaceholderData`; prefetch next page with `queryClient.prefetchQuery`.
3. **New filter facets (rarity / cost / type)** — next front chantier (user picked it 2026-05-31). Extend the API first: `tags` is already filterable, but `rarity` / `cost` / type-`code` are not — add to `CardQueryDto` + `buildCardWhere`. Then wire the front (sidebar facet + `useCardsFilter` + chips), reusing the `q` / `lang` URL-state pattern.
4. **FR card images — partial coverage** (ingestion task, user's immediate next focus). See Data ingestion §Image self-hosting.
