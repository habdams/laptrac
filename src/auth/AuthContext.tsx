import * as React from "react"
import { loadState, saveState } from "../lib/persist"
import type { AuthState, AuthUser } from "./types"

const STORAGE_KEY = "laptrac.auth"

type AuthAction = { type: "login"; user: AuthUser } | { type: "logout" }

function reducer(_state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "login":
      return { status: "authenticated", user: action.user }
    case "logout":
      return { status: "anonymous", user: null }
  }
}

type AuthContextValue = AuthState & {
  login: (user: AuthUser) => void
  logout: () => void
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(reducer, undefined, () =>
    loadState<AuthState>(STORAGE_KEY, { status: "anonymous", user: null }),
  )

  React.useEffect(() => {
    saveState(STORAGE_KEY, state)
  }, [state])

  const login = React.useCallback((user: AuthUser) => dispatch({ type: "login", user }), [])
  const logout = React.useCallback(() => dispatch({ type: "logout" }), [])

  const value = React.useMemo(() => ({ ...state, login, logout }), [state, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
