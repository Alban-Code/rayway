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
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/onepiecetcg-db?schema=public"
```

Ce fichier est ignoré par git — ne jamais le committer.

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
