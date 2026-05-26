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
- **Card catalog** — `CardSet`, `Card` (language-neutral stats), `CardTranslation` (name/effect/triggerEffect per language), `CardVariant` (printings), `CardVariantImage` (`sourceUrl` + `storageKey` per language — see §Image self-hosting).
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

#### Image self-hosting (shipped 2026-05-25)

We **download and self-host** card images during ingestion rather than serving Bandai's URLs directly. Reason: Bandai's image responses include `Cross-Origin-Resource-Policy: same-site`, which makes their images unembeddable from any other origin (browsers receive 200 but refuse to render).

Implementation:

- **`CardVariantImage` schema**: `sourceUrl` (Bandai origin, with cache-buster `?251017`) + `storageKey` (internal path like `en/OP02-001_p1.png`). The served URL is computed at read time in `cards/internal/card-mapper.ts` as `${process.env.IMAGE_BASE_URL}/${storageKey}` — never stored.
- **Downloader** (`ingestion/punk-records/images.ts`): a single function `downloadImage(url, storageKey, storageRoot)` that streams the response via `Readable.fromWeb(res.body)` + `pipeline()` into `createWriteStream(target)`. Skip-if-exists is a plain `fs.access(target)` check (no cache-buster comparison in v1 — Bandai rarely changes images; if needed, just delete the local file to force re-download).
- **Wiring in `run.ts`**: after `upsertCard` returns (transaction committed), a `for (variant of card.variants)` loop calls `downloadImage(...)` serially, wrapped in its own `try/catch` so a network error doesn't fail the card. No concurrency / `p-limit` — ingestion is rare enough that serial is fine.
- **Storage location**: `IMAGE_STORAGE_PATH=./storage/images` env var (in `apps/api/.env`, dir gitignored). Resolved to absolute at module load via `node:path` `resolve()`.
- **Serving in dev**: `@nestjs/serve-static` mounted at `serveRoot: '/images'`. Front fetches `http://localhost:3000/images/en/OP01-001.png` via `IMAGE_BASE_URL=http://localhost:3000/images`. In prod, point `IMAGE_BASE_URL` to a CDN/S3 origin and no app code changes.
- **Prod storage**: still TBD — when an S3-style backend is needed, extract `downloadImage` behind an `ImageStorage` interface with `LocalDiskStorage` + `S3Storage` implementations. Intentionally not done now (YAGNI).
- **Orphan cleanup**: not implemented. Add a `prune` command later if disk usage matters.

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

React 19 SPA served by Vite. **Auth slice complete** (2026-05-24): sign-in / sign-up / sign-out / account view all functional via Better Auth.

**Cards UI slice — list view + detail panel + hover preview DONE (2026-05-26).** The detail view is a **non-modal side-sheet** that slides over the list, not a separate page. URL-driven, deep-linkable, browser-back closes it. The hover preview is text-dense (no image, full effect text) and lives inside `CardThumb`. See §Card detail panel and §Hover preview below for the full patterns.

**What's in place on the list view:**

- React Query wired (`QueryClientProvider` in `main.tsx`, Devtools installed, `staleTime: 30_000`, `refetchOnWindowFocus: false`).
- `api/cards.ts`: DTO types (`CardListItemDto`, `CardVariantDto`, `CardTypeDto`, `PaginatedCardsDto`), enum-like `as const` arrays + union types (`COLORS`, `CATEGORIES`, `RARITIES`), type guards (`isColor`, `isCategory`), `fetchCards(params)` builder using `URLSearchParams.append` for multi-value params.
- `lib/hooks/useCards.ts` — thin wrapper around `useQuery({ queryKey: ['cards', params], queryFn })`.
- `lib/hooks/useCardsFilter.ts` — custom hook. Source of truth = URL (no `useState` mirror). Exposes `colors`, `category`, `activeCount`, `handleColorClick(color)`, `setCategoryFilter(value)`, `clearAll()`.
- `lib/idStyle.ts` — `idColorStyle(colors: Color[])` helper. Maps `Color → 'var(--id-red)'`, etc., and returns `{ '--id-color-a', '--id-color-b' }` as inline style. Fallback to `var(--accent)` if no color; if mono-color, `b = a`.
- `components/cards/CardThumb.tsx` — **the only signature visual.** Wraps `<Link to="/cards/:code">` around `.card-tile`, itself wrapped in `<HoverCard>` (see §Hover preview). Injects `--id-color-a/b` (via `idColorStyle`) and `--art-image` (if `imageUrl`) in inline style. JSX renders **only `top-bar` and `art`** — the printed card image already shows cost/name/type/code, so no overlays.
- `styles/pages/cards.css` — **only the `.card-tile` family** lives here (~100 lines). Bicolor gradient on `.art` (radial top-left on color-a, linear ramp toward color-b), bicolor top-bar (linear-gradient 90deg a→b), bicolor hover glow (two box-shadows offset left/right tinted a and b). `--id-color` alias points to `--id-color-a` so `:hover`/`.compare-check` keep working. **No `width: 100%`** on `.card-tile` — block + grid/flex parent handle sizing, and removing it lets Tailwind utilities like `w-[140px]` apply without specificity battles (Tailwind v4 utilities are in `@layer utilities`, lose to unlayered CSS).
- `components/cards/CardGrid.tsx` — pure Tailwind: `grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3`.
- `components/cards/CardFilters.tsx` — sidebar (`<aside>`) in Tailwind utilities. Color + Category sections use shadcn `<Toggle>` (`@/components/ui/toggle`). Color toggles inject `--chip-color` inline and consume it via `data-[state=on]:bg-[color-mix(in_oklch,var(--chip-color)_22%,transparent)]` etc. — pure Tailwind arbitrary values, no CSS class.
- `components/cards/ActiveFilterChips.tsx` — bar of active filter chips using shadcn `<Badge>`. Returns `null` if `activeCount === 0`. Each badge has its own `--chip-color`; click on `×` calls `handleColorClick` / `setCategoryFilter(undefined)`. "Clear all" link at the right uses `clearAll()`.
- `components/cards/CardsSkeleton.tsx` — 18 shadcn `<Skeleton>` cards (`aspect-[0.715/1]`) in the same grid layout as `CardGrid`. Avoids layout shift when data arrives.
- `pages/CardsPage.tsx` — thin layout: `grid grid-cols-[260px_1fr] h-dvh overflow-hidden` → sidebar + main column. Main has header (title + count), `<ActiveFilterChips />`, and a scrollable area with the skeleton/error/grid ternary. **No early returns** — the layout (sidebar, header) stays mounted during loading.
- shadcn primitives installed: `button`, `toggle`, `badge`, `skeleton`, `input` (input not used yet, reserved for search).

Images are served from our own origin (see Data ingestion §Image self-hosting) — the API mapper returns `${IMAGE_BASE_URL}/${storageKey}` as `imageUrl`. `CardThumb` consumes it via the `--art-image` CSS var.

Pattern to remember (will be reused for any visual signature with dynamic color):

```tsx
// 1. In the component, inject CSS vars via inline style
<Link className="card-tile" style={idColorStyle(card.colors)}>...</Link>

// 2. In cards.css, consume them with color-mix and fallbacks
background: linear-gradient(90deg, var(--id-color-a, var(--accent)), var(--id-color-b, var(--accent)));
```

### Card detail panel (2026-05-26)

The detail view is a side-sheet, not a separate page. URL pattern: `/cards/:code` is a **nested route** under `/cards`, not a sibling.

```tsx
// App.tsx
{ path: "/cards", element: <CardsPage />, children: [
    { path: ":code", element: <CardDetailSheet /> }
]}
```

`CardsPage` renders `<Outlet />` inside its layout. When the URL matches `/cards/:code`, the Outlet mounts `CardDetailSheet`. The "panel is open" state is **derived from the URL** (`useMatch('/cards/:code')`), never stored in a `useState`. Browser back, link sharing, and inter-card navigation all just work.

**Files:**

- `api/cards.ts` → `fetchCard(code)` (returns `CardListItemDto`, same shape as the list).
- `lib/hooks/useCardDetail.ts` → `useQuery({ queryKey: ['card', code], queryFn, placeholderData: keepPreviousData })`. The `keepPreviousData` is **critical**: without it, switching between cards flashes the skeleton each time.
- `components/cards/CardDetailSheet.tsx` → smart wrapper. Reads `:code` via `useParams`, fetches, renders `<Sheet>`. Closes via `navigate('/cards')` on Escape / ✕ click.
- `components/cards/CardDetailView.tsx` → pure presentation, receives `card` as prop. Single-column flex layout with image on top (`.card-tile.card-tile--static`, `w-full max-w-[360px]` — `w-full` is required since `.card-tile` no longer carries `width: 100%`), then Header / Stats / Chips / Effects / Variants. JSX renders `top-bar` + `art` only (no overlays).
- `components/cards/CardDetail{Header,Stats,Chips,Effects,Variants}.tsx` → one file per section.

**Sheet customization (`components/ui/sheet.tsx`):**

- Added a `showOverlay?: boolean` prop (default `true`). `CardDetailSheet` passes `showOverlay={false}` → no dim, no blur.
- **Removed `data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm` from the default `className`.** Reason: these `data-[side=...]:` variants compile to selectors with **higher specificity** (attribute + class) than a plain `sm:max-w-2xl` passed via `cn()`. `tailwind-merge` can't help — it resolves conflicts at equal specificity only, and the data-variant always wins. Symptom: your `sm:max-w-2xl` looks correct in the generated CSS but is crossed out in devtools.
- General lesson: when a shadcn component class doesn't override as expected, suspect specificity from `data-[...]:` / `aria-[...]:` / `group-data-[...]:` variants. The fix is editing the shadcn file (which lives in your repo for exactly this reason), not adding `!` everywhere.

**Non-modal behavior:**

```tsx
<Sheet modal={false} open={true} onOpenChange={(open) => { if (!open) navigate('/cards'); }}>
  <SheetContent
    side="right"
    showOverlay={false}
    onInteractOutside={(e) => e.preventDefault()}
    className="sm:max-w-2xl w-full overflow-y-auto"
  >
```

- `modal={false}` disables Radix's focus trap → the user can interact with the list behind.
- `onInteractOutside.preventDefault()` is **also required** — without it, clicking the list closes the Sheet, defeating the purpose. With it: clicking another `CardThumb` changes the URL (`/cards/:newCode`), `useParams` re-runs, `useCardDetail` re-fetches, the panel **updates in place without ever closing**. Escape and the ✕ button remain the only ways to close.

**Layout shift (list grid shrinks when panel opens):**

In `CardsPage`, the `<main>` element gets a dynamic right-padding when the panel is open:

```tsx
const isDetailOpen = !!useMatch('/cards/:code')
<main className={cn(
  "flex flex-col overflow-hidden transition-[padding] duration-300 ease-out",
  isDetailOpen && "sm:pr-[min(100vw,42rem)]"
)}>
```

⚠️ **The padding value (`42rem`) and the Sheet's `sm:max-w-2xl` (also 42rem) MUST stay in sync.** Otherwise the grid either overflows under the panel or leaves dead space. If you change one, change the other. Eventually candidate for a shared CSS var (`--w-detail-panel`) once it proliferates.

**Animation polish:**

- The `<CardDetailView>` is wrapped in `<div key={card.code} className="animate-in fade-in-50 duration-200">`. The `key` forces a remount on each new card → replays the `animate-in` animation = smooth fade between cards. Combined with `keepPreviousData`, no skeleton flash between selections.
- Skeleton only shows when truly empty: `isPending && !data` (since `placeholderData` keeps `data` truthy during refetches).

**Static card-tile in the panel:**

Reuses the `.card-tile` class from the grid, plus a new BEM modifier `card-tile--static` (in `pages/cards.css`) that:
- Disables the hover transform/glow (via `.card-tile:not(.card-tile--static):hover { ... }`).
- Sets `cursor: default`.
- Adds a permanent colored ring + glow using `--id-color-a`.

**Panel-in-panel surface hierarchy:**

The Sheet body uses `bg-popover` (= `--bg-panel-2`). Inner sections (Stats / Effects / Variants) use `bg-card` (= `--bg-panel`) + `border border-border` + `rounded-xl` + `px-3.5 py-3`. Two surface levels without shadows. Header and Chips stay "at the floor level" (no case) intentionally — if everything is a case, nothing stands out.

**Maquette-faithful typography (from `maquettes/Cards.html`):**

- Section labels: `text-[9px] uppercase tracking-[0.08em] font-bold text-muted-foreground`
- Stat values: `text-xl font-display font-bold tabular-nums leading-none` — `tabular-nums` prevents digit jitter, `leading-none` keeps the label/value pair tight.
- Effect body: `text-[12.5px] leading-[1.55]`
- Variants: mini-cards in `grid grid-cols-4 gap-2`, each at `aspect-[0.715/1]`, with `<img loading="lazy">` and a black `bg-black/65 backdrop-blur-sm` footer for the variantType.

**Card effects with `<br/>`:**

The DB stores raw `<br/>` tags inside `effect` / `triggerEffect`. `CardDetailEffects` uses a local `normalizeBreaks()` helper that replaces `<br\s*\/?>` (case-insensitive) with `\n`, and the `<p>` uses `whitespace-pre-line`. **Do not use `dangerouslySetInnerHTML`** — even on "trusted" DB content, you're one bad row away from XSS. Transform-to-text + CSS rendering is safer and equally effective for this use case.

### Hover preview (2026-05-26)

Hover on a grid tile pops a side card with the **full effect text** of the card. No image (the tile under the cursor and the detail panel already show it — duplicating pollutes). Text-only, info-dense.

**Implementation lives directly in `CardThumb.tsx`** — no separate `CardHoverCard.tsx` component, the wrapping is trivial enough to inline:

```tsx
<HoverCard openDelay={300} closeDelay={100}>
  <HoverCardTrigger asChild>
    <Link to={`/cards/${card.code}`} className="card-tile" style={style}>
      <div className="top-bar" />
      <div className={imageUrl ? "art has-image" : "art"} />
    </Link>
  </HoverCardTrigger>
  <HoverCardContent
    side="right"
    align="start"
    sideOffset={8}
    className="w-[460px] p-3 max-h-[80vh] overflow-y-auto"
    style={idColorStyle(card.colors)}
  >
    <div className="flex flex-col gap-3">
      <CardDetailHeader card={card} />
      <CardDetailStats card={card} />
      <CardDetailChips card={card} />
      <CardDetailEffects card={card} />
    </div>
  </HoverCardContent>
</HoverCard>
```

**Design decisions:**

- **No image, no `line-clamp`.** Full `effect` + `triggerEffect` are the most valuable info. If they get long, `max-h-[80vh] overflow-y-auto` scrolls instead of truncating.
- **No `CardDetailVariants`** in the preview — it'd be visually heavy and the panel covers it.
- **Reuses the detail sub-components** (`CardDetailHeader/Stats/Chips/Effects`) — same DTO shape, no compact-mode prop needed.
- **`openDelay={300}` / `closeDelay={100}`** — without `openDelay`, hovering across the grid flickers a popover at every tile. 300ms is the idiomatic floor.

**Pitfalls hit during the build (keep in mind for future Radix work):**

- **`<HoverCardTrigger asChild>` is mandatory.** Without `asChild`, Radix wraps your `<Link>` in a `<button>`, breaking ctrl-click and a11y. The Slot pattern lets Radix apply its props directly to the `<Link>`.
- **CSS vars do NOT propagate through Radix Portals.** `style={idColorStyle(...)}` on the Trigger is invisible to the Content (which renders in a portal at `<body>` root). Re-inject `style={idColorStyle(card.colors)}` on the `<HoverCardContent>` itself if you want bicolor styling there. Here we don't really need it (text-only, no `.card-tile` inside) but it's harmless and future-proof.
- **Tailwind v4 utility vs unlayered CSS.** `w-[140px]` (Tailwind, `@layer utilities`) was getting beaten by `.card-tile { width: 100%; }` (unlayered) in an earlier iteration that did include the static image in the popover. **Unlayered rules outrank `@layer utilities` regardless of specificity.** Fix: remove the conflicting unlayered rule (or wrap the consumer in `@layer components`). The lesson generalizes — if a Tailwind utility silently doesn't apply, check whether an unlayered CSS rule defines the same property.

**Cleanup that came with this slice:**

`.card-tile .cost`, `.card-tile .type-tag`, `.card-tile .name`, `.card-tile .code` were removed from `cards.css` and from `CardThumb.tsx` + `CardDetailView.tsx`. The printed card image already shows all that info — overlaying it was noise. Note `AuthHero.tsx` has its own `.hc .cost` style (different selector), unaffected.

### Next steps on the Cards slice

By suggested order:

1. **Pagination `?page=N`** — DTO already returns `page`/`limit`/`total`. Add `page` to `useCardsFilter`. Reuse `placeholderData: keepPreviousData` (already installed pattern) on the list query for smooth page transitions.
2. **Search `?q=...`** — debounce via `useDeferredValue` or custom hook. Needs API extension on `/api/cards`.
3. **Language switcher `?lang=fr|en|jp|...`** — DTO already returns `language`, API already supports the param.

**Folder convention (type-first, established 2026-05-22):**

```
apps/web/src/
├── pages/              ← ONLY route entry components (1 file = 1 route)
├── components/
│   ├── ui/             ← shadcn primitives, cross-feature
│   └── <feature>/      ← sub-components scoped to one feature (auth/, cards/, ...)
├── lib/                ← non-components: auth-client, Zod schemas, utils
├── api/                ← HTTP client wrappers
└── styles/             ← tokens.css, primitives.css, pages/*.css
```

Rules:
- A component used in one feature → `components/<feature>/`
- Cross-folder imports use the `@/...` alias (configured in `tsconfig.app.json` + `vite.config.ts`)
- Same-folder imports use relative paths
- Dependency direction is `pages → components`, never the reverse. If a sub-component exposes a prop type, define it **in the component** and let the page import it from there.
- Page components stay thin: they read URL params/session, compose sub-components, pass props. No JSX-heavy rendering at the page level.

**Design system (shadcn + Tailwind primary, custom CSS only when needed):**

The 5 ruling principles (decided 2026-05-25, after a first iteration where the maquette was treated as 1:1 SoT and most pages were styled with raw CSS — the result was a class proliferation that ignored the shadcn/Tailwind stack we had installed):

1. **Generic UI components → shadcn.** Button, Input, Card, Badge, Dialog, Combobox, Popover, Tabs, Sheet, etc. When a new one is needed: `npx shadcn@latest add <component>`. Don't rewrite in CSS what shadcn already provides.
2. **Layout → Tailwind utilities.** `grid grid-cols-[230px_1fr]`, `flex gap-4`, `h-dvh`, `overflow-hidden` — written inline on the JSX. Stop writing `.cards-page { display: grid; ... }` for a banal 2-column layout.
3. **Theming → the 3-bridge stays.** `src/styles/tokens.css` defines OKLCH tokens → `src/index.css` `@layer base` maps shadcn vars (`--primary`, `--border`, etc.) to Rayway tokens → `@theme inline` registers them with Tailwind v4. So `bg-primary` / `border-border` resolve to your tokens automatically — never hardcode a color.
4. **Custom CSS (in `styles/`) → signature visuals only.** Things with no shadcn equivalent that deserve abstraction: the `.card-tile` with its bicolor gradient via `--id-color-a/b`, hover glow, `:has()` dimming. Not for a 2-column layout, not for a button.
5. **Maquette = visual inspiration, NOT spec.** Look at the spirit (dark + glow + OKLCH + display typo) and adapt. Don't try to reproduce HTML/CSS 1:1 — especially not the class names from `maquettes/shared.css`.

Practical consequences:
- `primitives.css` will gradually shrink (replaced by shadcn). Don't big-bang migrate; replace when you touch a screen.
- `pages/cards.css` should only contain `.card-tile` + its sub-elements. Everything else (`.cards-page`, `.filters-col`, `.cards-head`, …) belongs in Tailwind utilities.
- Existing pages (auth, account) stay as-is for now. Migrate them only when you next edit them.

Only the `devil-fruit` palette is wired (via `:root`); the 6 others stay dormant in `tokens.css` for later.

Stack for the first slice (auth + cards browsing):

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

**Auth on the web client — source of truth:**

`useSession()` from `better-auth/react` (re-exported via `@/lib/auth-client`) is the **single source of truth for the current user** on the web. It auto-syncs across tabs, refreshes on focus, and exposes `data.user` with `{ id, email, name, image, emailVerified, createdAt }` — the same fields `GET /api/users/me` returns.

⚠️ **Do not call `/api/users/me` from the web client at MVP.** It would double a request for data already in the session. The REST endpoint is kept for future non-web consumers (mobile, CLI, server-to-server). If a future feature needs user fields not in the Better Auth session (e.g. domain-specific `level`, `preferences`), add them via a separate endpoint and a React Query hook — don't redirect `/me` for it.

**Route protection — `<RequireAuth>` / `<RedirectIfAuth>` pattern:**

React Router 7 has no middleware. Protection is done via **layout route wrappers** in `components/auth/`:

- `RequireAuth.tsx` — reads `useSession`, returns `<Navigate to="/sign-in" replace />` if unauth'd, `<Outlet />` otherwise.
- `RedirectIfAuth.tsx` — inverse, used to wrap `/sign-in` and `/sign-up` so logged-in users get bounced to `/account`.

Both handle `isPending` explicitly (returns a loading state) — skipping this branch causes a flash redirect on first render before the session resolves.

Wired in `App.tsx` via nested routes:

```tsx
{ element: <RedirectIfAuth />, children: [
    { path: "/sign-in", element: <AuthPage /> },
    { path: "/sign-up", element: <AuthPage /> },
]},
{ element: <RequireAuth />, children: [
    { path: "/account", element: <AccountPage /> },
]},
```

A *layout route* (no `path`, just `element` + `children`) is React Router's way of applying a wrapper to a group of routes. The wrapper renders `<Outlet />` where the matched child route should appear.

**Pages currently implemented:**

- `/sign-in`, `/sign-up` → `pages/AuthPage.tsx` (one component, mode derived from `location.pathname`). Composed of `components/auth/AuthHero` (left visual hero) + `components/auth/AuthForm` (right card with toggle + `SignInForm` / `SignUpForm`).
- `/account` → `pages/AccountPage.tsx`. Displays user fields in a `.panel` (name, email, verified, member since) + sign-out button. Styles in `styles/pages/account.css`.

**Form pattern (established by `SignInForm` / `SignUpForm`):**

1. `useForm<T>({ resolver: zodResolver(schema) })` with Zod schema from `lib/auth-schemas.ts`.
2. Local `useState<string | null>` for server errors (Better Auth returns `{ data, error }`, no throw).
3. Async `onSubmit` calls Better Auth client, checks `error`, sets `serverError` on failure, `navigate("/account")` on success.
4. Markup follows `field-group > field > .lbl + .input + .help.err` from `styles/pages/auth.css`.
5. `autoComplete` matters: `current-password` (sign-in) vs `new-password` (sign-up).
6. `noValidate` on `<form>` to disable HTML5 native validation in favor of Zod messages.

`SignUpForm` extras: `watch("password")` + a `pwScore` helper (top-of-file pure function) drive a `.strength.lvl{0-4}` bar (CSS lives in `auth.css`, classes already styled).
