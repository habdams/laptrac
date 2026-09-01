import * as React from "react"
import type { User } from "oidc-client-ts"
import { setAccessTokenGetter } from "../lib/apiClient"
import { userManager } from "./oidcConfig"
import type { AuthUser } from "./types"

type AuthState =
  | { status: "loading"; user: null }
  | { status: "anonymous"; user: null }
  | { status: "authenticated"; user: AuthUser }

function toAuthUser(profile: { sub: string; email?: string; name?: string }): AuthUser {
  return { sub: profile.sub, email: profile.email ?? "", name: profile.name ?? profile.email ?? "Unknown" }
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
      try {
        let user = await userManager.getUser()
        if (!user || user.expired) {
          user = await userManager.signinSilent()
        }
        if (cancelled) return
        if (user && !user.expired) {
          accessTokenRef.current = user.access_token
          setState({ status: "authenticated", user: toAuthUser(user.profile) })
        } else {
          setState({ status: "anonymous", user: null })
        }
      } catch {
        if (!cancelled) setState({ status: "anonymous", user: null })
      }
    }

    recoverSession()

    const handleUserLoaded = (user: User) => {
      accessTokenRef.current = user.access_token
      setState({ status: "authenticated", user: toAuthUser(user.profile) })
    }
    const handleUserUnloaded = () => {
      accessTokenRef.current = null
      setState({ status: "anonymous", user: null })
    }
    const handleSilentRenewError = () => {
      accessTokenRef.current = null
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
