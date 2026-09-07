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

### 6. `GET /api/tickets*` contract changed with no notice — several things still unconfirmed

As of 2026-09-07, `GET /api/tickets` and `GET /api/tickets/current-user` return a flat shape —
`{ id, userLaptopID, comment, assignedTo, ticketStatus, comments }` — replacing the nested
`ticketHistory` array this doc used to describe (`ticketHistoryStatus`/`assignedTo`/etc. per
history entry). No deprecation notice or changelog entry came with this; the frontend
(`src/features/tickets/ticketsApi.ts`, `TicketsContext.tsx`) has been updated to match, using
best-effort inference where the new contract is ambiguous. **Please confirm/fix the following:**

- The full `ticketStatus` enum. Only `0` (open), `1` (claimed), `3` (resolved) are confirmed
  (carried over from the old `ticketHistoryStatus`); the frontend guesses `null` means
  "claimed" when `assignedTo` is set, else "open" — confirm this is actually what `null` means.
- `assignedTo` is now a **display name string** (e.g. `"Bob"`) instead of a user id. This is a
  behavior change, not just a rename — the frontend can no longer reliably resolve an email from
  it (falls back to a fragile name-match against the member list). If duplicate first/full names
  exist among IT members, this will misattribute — recommend switching back to a stable id.
- **No field identifies who raised a ticket anymore** (`userId` is gone). For
  `GET /api/tickets/current-user` this doesn't matter (server-scoped to the caller), but for
  `GET /api/tickets` (IT's all-tickets view), the raiser is now permanently unresolvable
  client-side and shows as a placeholder ("Unknown employee"). Please restore an owner id/email
  on the ticket, or otherwise supported.
- Confirm `userLaptopID` refers to the `UserLaptop` record's own id (matching
  `GET /api/users/current-user`'s `userLaptops[].id`) and not a user id — the frontend assumes
  this to match a ticket to "my own laptop", but has no way to verify it, and the admin bulk
  `/api/laptops` endpoint (see item below) doesn't expose this id at all, so IT can't resolve the
  laptop for tickets other than their own.
- Confirm the shape of `comments[]` items (field names for message/author/timestamp) — currently
  read defensively with guessed field names (`message`/`comment`/`text`,
  `authorName`/`author`/`by`, `createdAt`), degrading to blanks rather than crashing if wrong.

### 7. No backend endpoint to persist claim/resolve/comment

`claimTicket`/`resolveTicket`/`addComment` in `src/features/tickets/TicketsContext.tsx` are
purely local `dispatch()` calls — nothing round-trips to the server. A ticket's status/assignee
is only ever read from the server the first time the frontend sees that ticket (see
`normalize()`) — after that, local claim/resolve actions win and are never synced back. The new
`comments` field (item 6) suggests the backend may be building toward real persistence here —
worth checking whether there's already a way to write comments/claims before building more
local-only overlay.

**Ask backend for:**
- `POST /api/tickets/{id}/claim` — sets status to claimed, `assignedTo` = current user (from bearer token, no body needed).
- `POST /api/tickets/{id}/resolve` — sets status to resolved, `resolvedBy` = current user.
- Some way to persist comments, if `comments[]` (item 6) isn't already writable.

Once these exist, replace the local `dispatch()` calls in `claimTicket`/`resolveTicket` with
real API calls, and remove the `if (existing) return existing` short-circuit in `normalize()`
so status/assignee stay live from the server instead of freezing after first load.
