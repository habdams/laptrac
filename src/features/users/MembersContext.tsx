import * as React from "react"
import { useRole } from "../../auth/useRole"
import { getErrorMessage } from "../../lib/errors"
import { createUser, getUsers, updateUser } from "./usersApi"
import type { CreateUserInput, UpdateUserInput, User } from "./types"

interface MembersState {
  users: User[]
  status: "idle" | "loading" | "loaded" | "error"
  error: string | null
}

type MembersAction =
  | { type: "loading" }
  | { type: "loaded"; users: User[] }
  | { type: "error"; error: string }
  | { type: "upsert"; user: User }

function reducer(state: MembersState, action: MembersAction): MembersState {
  switch (action.type) {
    case "loading":
      return { ...state, status: "loading", error: null }
    case "loaded":
      return { users: action.users, status: "loaded", error: null }
    case "error":
      return { ...state, status: "error", error: action.error }
    case "upsert": {
      const exists = state.users.some((u) => u.id === action.user.id)
      return {
        ...state,
        users: exists ? state.users.map((u) => (u.id === action.user.id ? action.user : u)) : [action.user, ...state.users],
      }
    }
  }
}

interface MembersContextValue extends MembersState {
  refresh: () => Promise<void>
  createMember: (input: CreateUserInput) => Promise<void>
  updateMember: (userId: string, input: UpdateUserInput) => Promise<void>
}

const MembersContext = React.createContext<MembersContextValue | null>(null)

export function MembersProvider({ children }: { children: React.ReactNode }) {
  const role = useRole()
  const [state, dispatch] = React.useReducer(reducer, { users: [], status: "idle", error: null })

  // GET /api/users is the full member directory — IT-only functionality (member management,
  // laptop-owner picker). Non-IT users never need it, so skip the fetch entirely for them rather
  // than exposing every employee's record to every employee.
  const refresh = React.useCallback(async () => {
    if (role !== "it") {
      dispatch({ type: "loaded", users: [] })
      return
    }
    dispatch({ type: "loading" })
    try {
      const users = await getUsers()
      dispatch({ type: "loaded", users })
    } catch (err) {
      dispatch({ type: "error", error: getErrorMessage(err) })
    }
  }, [role])

  React.useEffect(() => {
    refresh()
  }, [refresh])

  const createMember = React.useCallback(async (input: CreateUserInput) => {
    await createUser(input)
    await refresh()
  }, [refresh])

  const updateMember = React.useCallback(async (userId: string, input: UpdateUserInput) => {
    await updateUser(userId, input)
    await refresh()
  }, [refresh])

  const value = React.useMemo(
    () => ({ ...state, refresh, createMember, updateMember }),
    [state, refresh, createMember, updateMember],
  )

  return <MembersContext.Provider value={value}>{children}</MembersContext.Provider>
}

export function useMembers() {
  const ctx = React.useContext(MembersContext)
  if (!ctx) throw new Error("useMembers must be used within MembersProvider")
  return ctx
}
