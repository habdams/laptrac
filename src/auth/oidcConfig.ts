import {
  InMemoryWebStorage,
  UserManager,
  WebStorageStateStore,
  type UserManagerSettings,
} from "oidc-client-ts";

// scope1/scope2 are the literal names granted to this client per the backend's
// IdentityServer config — confirm with backend these aren't leftover quickstart placeholders.
const SCOPE = "openid profile verification scope1 scope2";

if (
  !import.meta.env.VITE_OIDC_AUTHORITY ||
  !import.meta.env.VITE_OIDC_CLIENT_ID
) {
  // eslint-disable-next-line no-console
  console.error(
    "Missing VITE_OIDC_AUTHORITY / VITE_OIDC_CLIENT_ID — copy .env.example to .env and fill them in. Sign-in will fail until then.",
  );
}

const settings: UserManagerSettings = {
  authority: import.meta.env.VITE_OIDC_AUTHORITY,
  client_id: import.meta.env.VITE_OIDC_CLIENT_ID,
  redirect_uri: `${window.location.origin}/auth/callback`,
  post_logout_redirect_uri: `${window.location.origin}/login`,
  silent_redirect_uri: `${window.location.origin}/auth/silent-renew`,
  // TEMPORARY for demo: IdentityServer client "web" is still registered as confidential,
  // so the token endpoint rejects requests without this. It ships in plaintext in the
  // built bundle (VITE_ vars are inlined client-side) — remove once backend makes the
  // client public/PKCE-only. See POST_DEMO_TODO.md.
  client_secret: import.meta.env.VITE_OIDC_SECRET,
  scope: SCOPE,
  response_type: "code",
  automaticSilentRenew: true,
  // Token kept in-memory only (not localStorage/sessionStorage) — lost on refresh by design;
  // recovered via signinSilent() against the IdP's own SSO session on app load.
  userStore: new WebStorageStateStore({ store: new InMemoryWebStorage() }),
  // stateStore must survive the full-page redirect to the IdP and back (an in-memory store
  // would be wiped by that navigation, breaking signinRedirectCallback), so this stays in
  // sessionStorage — it only ever holds the transient PKCE verifier/nonce, not the session itself.
  stateStore: new WebStorageStateStore({ store: window.sessionStorage }),
};

export const userManager = new UserManager(settings);
