# LapTrac

An internal tool for tracking company laptops/assets and the IT support tickets raised against them. Employees can see their own assigned laptop and raise tickets; IT team members see the full inventory, every ticket, and the member directory.

## Tech stack

- **React 19** + **TypeScript**, built with **Vite**
- **Chakra UI v3** for components/theming
- **React Router v8** (data router, lazy-loaded routes)
- **Axios** for API calls, hand-rolled `Context` + `useReducer` per feature for data/state (no Redux/React Query)
- **oidc-client-ts** for authentication (Authorization Code + PKCE against an external IdentityServer)

## Prerequisites

- Node.js 20+ and npm
- Access to the backend API and an OIDC client registration (ask a maintainer for the authority/client ID)

## Getting started

```bash
npm install
cp .env.example .env   # fill in the OIDC values, see below
npm run dev
```

The app runs at `http://localhost:5173` by default.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_BASE_URL` | No (has a default) | Base URL of the backend API. Defaults to the hosted demo backend if unset. |
| `VITE_OIDC_AUTHORITY` | Yes | The IdentityServer authority URL. |
| `VITE_OIDC_CLIENT_ID` | Yes | The OIDC client ID registered for this app. |
| `VITE_OIDC_SECRET` | Temporary | **Demo-only workaround** — the IdP's `web` client is currently registered as confidential instead of public, so the token endpoint rejects requests without a secret. This ships in plaintext in the built bundle and must be removed once the backend reconfigures the client as public + PKCE-only. See `POST_DEMO_TODO.md`. |

Sign-in will fail with a console error if `VITE_OIDC_AUTHORITY`/`VITE_OIDC_CLIENT_ID` are missing.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and produce a production build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build locally |

## How auth works

1. `src/auth/oidcConfig.ts` configures `oidc-client-ts` (`UserManager`) for the Authorization Code + PKCE flow. The access token is kept in memory only (not `localStorage`) and recovered on load via `signinSilent()` against the IdP's SSO session.
2. `src/auth/AuthContext.tsx` owns the token lifecycle and, once a token is available, calls `GET /api/users/current-user` — the single source of truth for everything the app knows about the signed-in user (id, name, email, role, and their assigned laptop). If that call fails, the app drops back to the anonymous/login state rather than showing a half-populated user.
3. `useRole()` (`src/auth/useRole.ts`) exposes `"it" | "employee"` derived from the current user's numeric `role` field (`1` = IT team). Role gates admin-only routes/actions (`/admin/members`, ticket claim/resolve, the full laptop inventory) throughout the app.

## Feature areas (`src/features/*`, `src/routes/*`)

- **Tickets** — employees raise tickets against their laptop; IT can see and claim/resolve every ticket. Visibility is scoped server-side: IT calls `GET /api/tickets` (all tickets), everyone else calls `GET /api/tickets/current-user`.
- **Laptops** — the full asset inventory (IT-only list/detail/create) plus a "My laptop" card sourced directly from the current-user API for the signed-in employee.
- **Users/Members** — the IT-only member directory (`/admin/members`) for adding people and toggling IT access.
- **Notifications** — a lightweight, client-side-only notification feed (e.g. "ticket claimed") surfaced via the bell icon.

Each feature follows the same pattern: an `xApi.ts` file wrapping typed Axios calls, an `XContext.tsx` provider (`useReducer` + `status: "idle" | "loading" | "loaded" | "error"`) exposing a `useX()` hook, and routes/components that consume it. Data that the backend doesn't support yet (e.g. ticket comments, laptop assignment history) is layered on top as a local overlay persisted to `localStorage` — see the comments in `TicketsContext.tsx` and `LaptopsContext.tsx` for exactly which fields are local-only.

## Known limitations

This is an active demo/MVP integrating against a backend that's still catching up in places. The full list of temporary workarounds and backend asks is tracked in [`POST_DEMO_TODO.md`](./POST_DEMO_TODO.md) — notably:

- Ticket **claim/resolve/comment** are local-only (no backend endpoint to persist them yet); they reset to server truth if the local cache is ever cleared.
- The OIDC client currently requires a `client_secret` shipped client-side, which is a security workaround pending a backend config change.
- Several backend enums (user role labels, laptop condition labels, ticket history status `2`) are undocumented — the frontend shows numeric fallbacks until confirmed.

## Deployment

The production build (`npm run build`, output in `dist/`) is a static SPA deployed via Netlify.
