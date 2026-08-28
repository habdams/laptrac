import * as React from "react"
import { loadState, saveState } from "../../lib/persist"

const STORAGE_KEY = "laptrac.it-team"

// Bootstrap: at least one seeded IT member so someone can sign in and
// manage the allowlist from the Admin page.
const defaultAllowlist = ["bob.smith@laptrac.dev"]

type ITTeamAction = { type: "add"; email: string } | { type: "remove"; email: string }

function reducer(state: string[], action: ITTeamAction): string[] {
  switch (action.type) {
    case "add": {
      const email = action.email.trim().toLowerCase()
      if (!email || state.includes(email)) return state
      return [...state, email]
    }
    case "remove": {
      const email = action.email.trim().toLowerCase()
      return state.filter((e) => e !== email)
    }
  }
}

interface ITTeamContextValue {
  allowlist: string[]
  addEmail: (email: string) => void
  removeEmail: (email: string) => void
  isITMember: (email: string | undefined | null) => boolean
}

const ITTeamContext = React.createContext<ITTeamContextValue | null>(null)

export function ITTeamProvider({ children }: { children: React.ReactNode }) {
  const [allowlist, dispatch] = React.useReducer(reducer, undefined, () =>
    loadState<string[]>(STORAGE_KEY, defaultAllowlist),
  )

  React.useEffect(() => {
    saveState(STORAGE_KEY, allowlist)
  }, [allowlist])

  const addEmail = React.useCallback((email: string) => dispatch({ type: "add", email }), [])
  const removeEmail = React.useCallback((email: string) => dispatch({ type: "remove", email }), [])
  const isITMember = React.useCallback(
    (email: string | undefined | null) => !!email && allowlist.includes(email.trim().toLowerCase()),
    [allowlist],
  )

  const value = React.useMemo(
    () => ({ allowlist, addEmail, removeEmail, isITMember }),
    [allowlist, addEmail, removeEmail, isITMember],
  )

  return <ITTeamContext.Provider value={value}>{children}</ITTeamContext.Provider>
}

export function useITTeam() {
  const ctx = React.useContext(ITTeamContext)
  if (!ctx) throw new Error("useITTeam must be used within ITTeamProvider")
  return ctx
}
