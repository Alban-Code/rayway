# Rayway API

NestJS REST API for the Rayway One Piece TCG companion. Backed by PostgreSQL via Prisma 7, with authentication handled by Better Auth.

All routes are prefixed with `/api/`. Swagger UI is exposed at `/api/docs`.

## Stack

- NestJS 11 (ESM, `NodeNext`)
- Prisma 7 (new `prisma-client` generator, output at `src/generated/prisma`)
- PostgreSQL via `@prisma/adapter-pg`
- Better Auth + `@thallesp/nestjs-better-auth` (v2.6+)

## Environment

Create `apps/api/.env`:

```env
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/onepiecetcg-db?schema=public"
BETTER_AUTH_SECRET="<openssl rand -base64 32>"
BETTER_AUTH_URL="http://localhost:3000"
```

`.env` is gitignored.

## Database

```bash
npx prisma migrate dev      # apply pending migrations in dev
npx prisma migrate deploy   # apply in production
npx prisma generate         # regenerate the client after schema changes
```

⚠️ After any `schema.prisma` change, run `npx prisma generate` explicitly — with the custom output path used by the new `prisma-client` generator, `migrate dev` does not always regenerate the client.

## Scripts

```bash
npm run start:dev      # watch mode
npm run build          # nest build
npm run start:prod     # run compiled output
npm run lint           # eslint --fix
npm run test           # vitest unit tests (single run)
npm run test:watch     # vitest watch mode
npm run test:cov       # vitest with coverage
npm run ingest:punk    # ingest cards from buhbbl/punk-records (idempotent, incremental)
```

## Modules

| Module     | Status | Notes                                                                 |
| ---------- | ------ | --------------------------------------------------------------------- |
| `cards/`   | ✅     | `GET /api/cards` (filters + pagination), `GET /api/cards/:code`. Public via `@AllowAnonymous()`. Multi-lang with EN fallback. |
| `auth/`    | ✅     | Email/password sign-up, sign-in, sessions. OAuth deferred.            |
| `users/`   | ✅     | `GET /api/users/me`. Protected by the global auth guard.              |
| `decks/`   | 🚧     | `GET /api/decks`, `GET /:id`, `POST /api/decks` shipped; build rules (leader, color intersection, ≤4/`Card.code`, ≤50, no DON!!/Leader) enforced in service + unit-tested. `PATCH`/`DELETE` pending. |
| `collection/`, `formats/`, `types/`, `tags/`, `mentor/` | ❌ | Not yet implemented. |

See [`../../CLAUDE.md`](../../CLAUDE.md) for architecture, conventions, and known gotchas (ESM `.js` extensions, Prisma 7 generator, Better Auth wrapper version sync, etc.).

See [`docs/database.md`](docs/database.md) for the full data model reference and [`docs/punk-records.md`](docs/punk-records.md) for the ingestion source format.
