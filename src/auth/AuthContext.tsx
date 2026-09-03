import * as React from "react"
import type { User } from "oidc-client-ts"
import { getCurrentUserRole } from "../features/users/usersApi"
import { setAccessTokenGetter } from "../lib/apiClient"
import { setAuthAsReady } from "../lib/authTracker"
import { userManager } from "./oidcConfig"
import type { AuthUser } from "./types"

type AuthState =
  | { status: "loading"; user: null }
  | { status: "anonymous"; user: null }
  | { status: "authenticated"; user: AuthUser }

function toAuthUser(profile: { sub: string; email?: string; name?: string }, role: AuthUser["role"]): AuthUser {
  return { sub: profile.sub, email: profile.email ?? "", name: profile.name ?? profile.email ?? "Unknown", role }
}

// Least-privilege default: a failed role lookup should never grant IT access.
async function resolveRole(): Promise<AuthUser["role"]> {
  try {
    const role = await getCurrentUserRole()
    return role === 1 ? "it" : "employee"
  } catch {
    return "employee"
  }
}

type AuthContextValue = AuthState & {
  login: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>({ status: "loading", user: null })
  const accessTokenRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    setAccessTokenGetter(() => accessTokenRef.current)
  }, [])

  React.useEffect(() => {
    let cancelled = false

    async function recoverSession() {
      // CallbackPage owns session establishment here via signinRedirectCallback().
      // Racing it with signinSilent() (a separate, cross-origin iframe round trip)
      // can resolve after the real login and stomp a freshly-authenticated state.
      if (window.location.pathname === "/auth/callback") return

      try {
        let user = await userManager.getUser()
        if (!user || user.expired) {
          user = await userManager.signinSilent()
        }
        if (cancelled) return
        if (user && !user.expired) {
          accessTokenRef.current = user.access_token
          // Unblock apiClient's auth-ready gate now that the token is set — the
          // role lookup below goes through that same gate, so resolving it any
          // later (e.g. after setState) deadlocks: the gate waits on "authenticated"
          // state, which waits on this fetch, which waits on the gate.
          setAuthAsReady()
          const role = await resolveRole()
          if (cancelled) return
          setState({ status: "authenticated", user: toAuthUser(user.profile, role) })
        } else {
          setAuthAsReady()
          setState({ status: "anonymous", user: null })
        }
      } catch {
        setAuthAsReady()
        if (!cancelled) setState({ status: "anonymous", user: null })
      }
    }

    recoverSession()

    const handleUserLoaded = (user: User) => {
      accessTokenRef.current = user.access_token
      setAuthAsReady()
      resolveRole().then((role) => {
        setState({ status: "authenticated", user: toAuthUser(user.profile, role) })
      })
    }
    const handleUserUnloaded = () => {
      accessTokenRef.current = null
      setAuthAsReady()
      setState({ status: "anonymous", user: null })
    }
    const handleSilentRenewError = () => {
      accessTokenRef.current = null
      setAuthAsReady()
      setState({ status: "anonymous", user: null })
    }

    userManager.events.addUserLoaded(handleUserLoaded)
    userManager.events.addUserUnloaded(handleUserUnloaded)
    userManager.events.addSilentRenewError(handleSilentRenewError)

    return () => {
      cancelled = true
      userManager.events.removeUserLoaded(handleUserLoaded)
      userManager.events.removeUserUnloaded(handleUserUnloaded)
      userManager.events.removeSilentRenewError(handleSilentRenewError)
    }
  }, [])

  const login = React.useCallback(() => userManager.signinRedirect(), [])
  const logout = React.useCallback(async () => {
    accessTokenRef.current = null
    await userManager.signoutRedirect()
  }, [])

  const value = React.useMemo(() => ({ ...state, login, logout }), [state, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
