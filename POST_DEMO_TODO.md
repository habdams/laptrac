# Post-demo cleanup: OIDC auth

Temporary compromises made to get the demo working. Fix these afterward.

## 1. Remove `client_secret` from the frontend (security)

`src/auth/oidcConfig.ts` currently sends `client_secret: import.meta.env.VITE_OIDC_SECRET`.
`VITE_`-prefixed env vars are inlined into the built JS bundle, so this secret ships in
plaintext to every browser — it provides no actual security and defeats the purpose of a
client secret. The authorization-code + PKCE flow exists specifically so a public client
(a browser SPA) doesn't need one.

**Fix:** once backend item #2 below is done, delete the `client_secret` line and the
`VITE_OIDC_SECRET` env var from `.env`/Netlify build config.

## 2. Backend: make the `web` IdentityServer client public

The token endpoint currently rejects requests from `web` without a `client_secret`,
meaning it's registered as a **confidential** client. Ask backend to reconfigure it as
**public**:
- `RequireClientSecret = false`
- `RequirePkce = true`

This is what let a `client_secret` requirement exist in the first place — the real fix is
here, not in the frontend.

## 3. Backend: `/home/error` 404s

IdentityServer's own error-handling page (`cavistatestidentityserver.onrender.com/home/error`)
returns 404. Any auth failure at the IdP currently dead-ends users on a blank page instead
of a message. Needs a registered error route/controller (their `UserInteraction:ErrorUrl`
config, or the missing controller behind it).

## 4. Confirm `scope1`/`scope2` are real

`src/auth/oidcConfig.ts` requests scope `openid profile verification scope1 scope2`.
`scope1`/`scope2` look like they could be leftover IdentityServer quickstart placeholder
scopes rather than real ones — confirm with backend what these actually grant, or replace
them with real scope names.

## 5. Watch for silent-renew failures during normal use

Fixed the race where `signinSilent()` (a cross-origin hidden-iframe call) stomped a
freshly-completed login (see `AuthContext.tsx` commit `fe116e8f`), but `signinSilent()` is
still used for background token renewal once the session is running (`automaticSilentRenew`)
and for session recovery on every other route. Cross-origin iframe silent-renew is prone to
breaking under third-party-cookie restrictions (Safari ITP, Chrome). If users get logged out
unexpectedly mid-session (not just right after login), this is the likely cause — may need a
refresh-token-based renewal instead of iframe-based `signinSilent()`.
