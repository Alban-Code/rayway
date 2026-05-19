# Rayway Web

React 19 SPA served by Vite. Frontend for the Rayway One Piece TCG companion.

⚠️ Currently at the scaffold stage. The first vertical slice (sign-up / sign-in / sign-out / account view / card list + filters / card detail) is in progress.

## Planned stack

- **React 19** + **Vite**
- **`react-router` v7** (library/SPA mode — no SSR)
- **`@tanstack/react-query`** for server state
- **`better-auth/react`** for the auth client (`useSession`, `signIn.email`, `signOut`)
- **Tailwind v4** (via `@tailwindcss/vite`) + **shadcn/ui** for components
- **`react-hook-form` + `zod`** for forms

## Cross-origin / cookies

The web app talks to the API at `http://localhost:3000` from `http://localhost:5173`. All API fetches **must** use `credentials: 'include'` so that the `better-auth.session_token` cookie is sent. A small `api/client.ts` wrapper centralizes this.

The API side needs matching CORS + `trustedOrigins` config — see [`../../CLAUDE.md`](../../CLAUDE.md) → "Web" section.

## Scripts

```bash
npm run dev      # vite dev server (port 5173)
npm run build    # tsc -b && vite build
npm run lint     # eslint
npm run preview  # serve the production build locally
```
