# Rayway

Application One Piece TCG — monorepo npm workspaces avec :

- `apps/api` — API REST NestJS + PostgreSQL via Prisma
- `apps/web` — Frontend React 19 + Vite

## Prérequis

- Node.js 20+
- PostgreSQL en local

## Installation

```bash
npm install
```

## Configuration

Crée le fichier `apps/api/.env` avec le contenu suivant (adapte les identifiants si besoin) :

```env
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/onepiecetcg-db?schema=public"
BETTER_AUTH_SECRET="<openssl rand -base64 32>"
BETTER_AUTH_URL="http://localhost:3000"
```

Ce fichier est ignoré par git — ne jamais le committer.

Pour générer un `BETTER_AUTH_SECRET` valide (≥ 32 caractères) :

```bash
openssl rand -base64 32
```

## Base de données

Depuis `apps/api`, applique les migrations et génère le client Prisma :

```bash
cd apps/api
npx prisma migrate dev
npx prisma generate
```

## Lancer le projet

Depuis la racine du repo :

```bash
# API (port 3000 par défaut)
npm run dev:api

# Frontend (port 5173 par défaut)
npm run dev:web
```
