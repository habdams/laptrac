# Post-demo cleanup

Temporary compromises made to get the demo working. Fix these afterward.

## OIDC auth

### 1. Remove `client_secret` from the frontend (security)

`src/auth/oidcConfig.ts` currently sends `client_secret: import.meta.env.VITE_OIDC_SECRET`.
`VITE_`-prefixed env vars are inlined into the built JS bundle, so this secret ships in
plaintext to every browser — it provides no actual security and defeats the purpose of a
client secret. The authorization-code + PKCE flow exists specifically so a public client
(a browser SPA) doesn't need one.

**Fix:** once backend item #2 below is done, delete the `client_secret` line and the
`VITE_OIDC_SECRET` env var from `.env`/Netlify build config.

### 2. Backend: make the `web` IdentityServer client public

The token endpoint currently rejects requests from `web` without a `client_secret`,
meaning it's registered as a **confidential** client. Ask backend to reconfigure it as
**public**:
- `RequireClientSecret = false`
- `RequirePkce = true`

This is what let a `client_secret` requirement exist in the first place — the real fix is
here, not in the frontend.

### 3. Backend: `/home/error` 404s

IdentityServer's own error-handling page (`cavistatestidentityserver.onrender.com/home/error`)
returns 404. Any auth failure at the IdP currently dead-ends users on a blank page instead
of a message. Needs a registered error route/controller (their `UserInteraction:ErrorUrl`
config, or the missing controller behind it).

### 4. Confirm `scope1`/`scope2` are real

`src/auth/oidcConfig.ts` requests scope `openid profile verification scope1 scope2`.
`scope1`/`scope2` look like they could be leftover IdentityServer quickstart placeholder
scopes rather than real ones — confirm with backend what these actually grant, or replace
them with real scope names.

### 5. Watch for silent-renew failures during normal use

Fixed the race where `signinSilent()` (a cross-origin hidden-iframe call) stomped a
freshly-completed login (see `AuthContext.tsx` commit `fe116e8f`), but `signinSilent()` is
still used for background token renewal once the session is running (`automaticSilentRenew`)
and for session recovery on every other route. Cross-origin iframe silent-renew is prone to
breaking under third-party-cookie restrictions (Safari ITP, Chrome). If users get logged out
unexpectedly mid-session (not just right after login), this is the likely cause — may need a
refresh-token-based renewal instead of iframe-based `signinSilent()`.

## Tickets

### 6. No backend endpoint to persist claim/resolve/comment

`claimTicket`/`resolveTicket`/`addComment` in `src/features/tickets/TicketsContext.tsx` are
purely local `dispatch()` calls — nothing round-trips to the server. `GET /api/tickets` and
`GET /api/tickets/current-user` both return a `ticketHistory` array per ticket with real
status (`ticketHistoryStatus`) and `assignedTo`, but there's no way to *write* a new history
entry yet. A ticket's status/assignee is only ever read from `ticketHistory` the first time
the frontend sees that ticket (see `normalize()`) — after that, local claim/resolve actions
win and are never synced back.

**Ask backend for:**
- `POST /api/tickets/{id}/claim` — sets `ticketHistoryStatus = 1`, `assignedTo` = current user (from bearer token, no body needed).
- `POST /api/tickets/{id}/resolve` — sets `ticketHistoryStatus = 3`, `resolvedBy` = current user.
- What `ticketHistoryStatus = 2` means — only `0` (open), `1` (claimed), and `3` (resolved) are confirmed; the frontend currently defaults anything else to `"open"`.
- Some way to persist comments (`TicketComment[]` in the UI) — separate from `ticketHistory.comment` (a single nullable string per history entry), there's no backend endpoint for the comment thread at all today.

Once these exist, replace the local `dispatch()` calls in `claimTicket`/`resolveTicket` with
real API calls, and remove the `if (existing) return existing` short-circuit in `normalize()`
so status/assignee stay live from the server instead of freezing after first load.

## Laptops

### 7. Backend: add `GET /api/laptops/current-user`

`src/features/laptops/LaptopsContext.tsx` called `GET /api/laptops` (every laptop, for every
user) unconditionally, regardless of role — an employee opening `TicketDetailDrawer` or just
seeing "My laptop" in the sidebar pulled the full company laptop list (and every assignment)
to find their own one entry client-side. Scoped this the same way tickets were scoped:
non-`"it"` users now call `getCurrentUserLaptops()`, pointed at
`GET /api/laptops/current-user` (`src/features/laptops/laptopsApi.ts`) — **this endpoint
doesn't exist on the backend yet**, calls to it will 404 until it's added.

**Ask backend for:**
- `GET /api/laptops/current-user`, scoped by the bearer token to the calling user's own laptop(s).
- Same response envelope as the existing `GET /api/laptops` — `PaginatedListOfUserLaptop`
  (`{ pageIndex, totalPages, item: RemoteUserLaptop[], hasPreviousPage, hasNextPage }`), just
  server-filtered — no new shape to add on the frontend. Confirmed one laptop per user, so
  `item` will realistically be a 0- or 1-length array, but keeping the same paginated envelope
  as `/api/tickets/current-user` keeps the client code uniform.
- Accepts the same `pageNumber`/`pageSize` query params as `/api/laptops` for consistency (the
  frontend calls it with `pageNumber=1, pageSize=100`, same default as everywhere else).
