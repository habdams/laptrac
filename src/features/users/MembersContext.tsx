import * as React from "react"
import { useRole } from "../../auth/useRole"
import { getErrorMessage } from "../../lib/errors"
import { createUser, getUsers, searchUsers, updateUser, type PaginatedUsers } from "./usersApi"
import type { CreateUserInput, User } from "./types"

interface MembersState {
  users: User[]
  pageIndex: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
  search: string
  status: "idle" | "loading" | "loaded" | "error"
  error: string | null
}

type MembersAction =
  | { type: "loading" }
  | { type: "loaded"; result: PaginatedUsers; search: string }
  | { type: "error"; error: string }
  | { type: "upsert"; user: User }

function reducer(state: MembersState, action: MembersAction): MembersState {
  switch (action.type) {
    case "loading":
      return { ...state, status: "loading", error: null }
    case "loaded":
      return {
        users: action.result.item,
        pageIndex: action.result.pageIndex,
        totalPages: action.result.totalPages,
        hasPreviousPage: action.result.hasPreviousPage,
        hasNextPage: action.result.hasNextPage,
        search: action.search,
        status: "loaded",
        error: null,
      }
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
  goToPage: (page: number) => Promise<void>
  setSearch: (search: string) => Promise<void>
  createMember: (input: CreateUserInput) => Promise<void>
  updateMember: (userId: string, role: number) => Promise<void>
}

const MembersContext = React.createContext<MembersContextValue | null>(null)

export function MembersProvider({ children }: { children: React.ReactNode }) {
  const role = useRole()
  const [state, dispatch] = React.useReducer(reducer, {
    users: [],
    pageIndex: 1,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
    search: "",
    status: "idle",
    error: null,
  })

  // GET /api/users is the full member directory — IT-only functionality (member management,
  // laptop-owner picker). Non-IT users never need it, so skip the fetch entirely for them rather
  // than exposing every employee's record to every employee.
  const loadPage = React.useCallback(async (page: number, search: string) => {
    if (role !== "it") {
      dispatch({
        type: "loaded",
        result: { pageIndex: 1, totalPages: 1, item: [], hasPreviousPage: false, hasNextPage: false },
        search,
      })
      return
    }
    dispatch({ type: "loading" })
    try {
      const result = search.trim()
        ? await searchUsers(search.trim(), page, 10)
        : await getUsers(page, 10)
      dispatch({ type: "loaded", result, search })
    } catch (err) {
      dispatch({ type: "error", error: getErrorMessage(err) })
    }
  }, [role])

  const refresh = React.useCallback(() => loadPage(state.pageIndex, state.search), [loadPage, state.pageIndex, state.search])

  React.useEffect(() => {
    loadPage(1, "")
  }, [loadPage])

  const goToPage = React.useCallback((page: number) => loadPage(page, state.search), [loadPage, state.search])
  const setSearch = React.useCallback((search: string) => loadPage(1, search), [loadPage])

  const createMember = React.useCallback(async (input: CreateUserInput) => {
    await createUser(input)
    await refresh()
  }, [refresh])

  const updateMember = React.useCallback(async (userId: string, role: number) => {
    await updateUser(userId, role)
    await refresh()
  }, [refresh])

  const value = React.useMemo(
    () => ({ ...state, refresh, goToPage, setSearch, createMember, updateMember }),
    [state, refresh, goToPage, setSearch, createMember, updateMember],
  )

  return <MembersContext.Provider value={value}>{children}</MembersContext.Provider>
}

export function useMembers() {
  const ctx = React.useContext(MembersContext)
  if (!ctx) throw new Error("useMembers must be used within MembersProvider")
  return ctx
}
