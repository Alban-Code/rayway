# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Rayway is a One Piece TCG (trading card game) application — an npm workspace monorepo with two apps:

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

The Prisma client is generated to `apps/api/generated/prisma` (not the default location). Import from there, not from `@prisma/client`.

`prisma.config.ts` at the api root configures the schema path and uses `DATABASE_URL` from the environment.

## Architecture

### Data model (`apps/api/prisma/schema.prisma`)

The core domain is One Piece TCG cards and deck building:

- **Card** — canonical card data (code, name, set, type, colors, stats). `isDon` flags Don!! cards.
- **CardVariant** — printings of a card (image, promo/starter/alternate flags, market/inventory prices).
- **CardTag** — LLM-sourced tags attached to cards (`source`, `confidence` fields indicate provenance).
- **CardTrigger** — parsed trigger effects, also LLM-sourced.
- **Deck** — a named deck with a leader and color identity.
- **DeckCard** — join table (deck ↔ card with quantity). Deck deletion cascades to DeckCard rows.

Enums: `Color` (Red/Blue/Green/Black/Yellow/Purple), `CardType` (Leader/Character/Event/Stage).

### API (`apps/api/src`)

Standard NestJS module structure: modules, controllers, services. Currently only the default `AppModule` exists — feature modules for cards, decks, etc. should be added here following NestJS conventions (one module per domain feature).

### Web (`apps/web/src`)

React 19 SPA served by Vite. The frontend is at the scaffold stage.
