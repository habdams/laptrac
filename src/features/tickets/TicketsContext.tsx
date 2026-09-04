import * as React from "react"
import { useAuth } from "../../auth/AuthContext"
import { useRole } from "../../auth/useRole"
import { getErrorMessage } from "../../lib/errors"
import { generateId } from "../../lib/id"
import { loadState, saveState } from "../../lib/persist"
import { useMembers } from "../users/MembersContext"
import {
  createTicket as createTicketApi,
  getCurrentUserTickets,
  getTickets,
  type RemoteTicket,
} from "./ticketsApi"
import type { Ticket, TicketComment, TicketStatus } from "./types"

const STORAGE_KEY = "laptrac.tickets"

// 0/1/3 confirmed with backend; any other value (e.g. 2) is unconfirmed, default to "open"
// rather than throw.
const STATUS_BY_HISTORY: Record<number, TicketStatus> = { 0: "open", 1: "claimed", 3: "resolved" }

interface TicketsState {
  tickets: Ticket[]
  status: "idle" | "loading" | "loaded" | "error"
  error: string | null
}

type TicketsAction =
  | { type: "loading" }
  | { type: "loaded"; tickets: Ticket[] }
  | { type: "error"; error: string }
  | { type: "create"; ticket: Ticket }
  | { type: "claim"; id: string; assigneeEmail: string; assigneeName: string }
  | { type: "resolve"; id: string }
  | { type: "comment"; id: string; comment: TicketComment }

function reducer(state: TicketsState, action: TicketsAction): TicketsState {
  switch (action.type) {
    case "loading":
      return { ...state, status: "loading", error: null }
    case "loaded":
      return { tickets: action.tickets, status: "loaded", error: null }
    case "error":
      return { ...state, status: "error", error: action.error }
    case "create":
      return { ...state, tickets: [action.ticket, ...state.tickets] }
    case "claim":
      return {
        ...state,
        tickets: state.tickets.map((t) =>
          t.id === action.id
            ? {
                ...t,
                status: "claimed" as TicketStatus,
                assignedToEmail: action.assigneeEmail,
                assignedToName: action.assigneeName,
              }
            : t,
        ),
      }
    case "resolve":
      return {
        ...state,
        tickets: state.tickets.map((t) => (t.id === action.id ? { ...t, status: "resolved" as TicketStatus } : t)),
      }
    case "comment":
      return {
        ...state,
        tickets: state.tickets.map((t) =>
          t.id === action.id ? { ...t, comments: [...t.comments, action.comment] } : t,
        ),
      }
  }
}

interface CreateTicketInput {
  title: string
  summary: string
  laptopId: string | null
  raisedByEmail: string
  raisedByName: string
}

interface TicketsContextValue {
  tickets: Ticket[]
  status: TicketsState["status"]
  error: string | null
  refresh: () => Promise<void>
  createTicket: (input: CreateTicketInput) => Promise<Ticket>
  claimTicket: (id: string, assignee: { email: string; name: string }) => void
  resolveTicket: (id: string) => void
  addComment: (id: string, comment: { authorEmail: string; authorName: string; message: string }) => void
}

const TicketsContext = React.createContext<TicketsContextValue | null>(null)

export function TicketsProvider({ children }: { children: React.ReactNode }) {
  const { users } = useMembers()
  const { status: authStatus } = useAuth()
  const role = useRole()
  const [state, dispatch] = React.useReducer(reducer, undefined, () =>
    loadState<TicketsState>(STORAGE_KEY, { tickets: [], status: "idle", error: null }),
  )

  React.useEffect(() => {
    saveState(STORAGE_KEY, state)
  }, [state])

  const stateRef = React.useRef(state)
  stateRef.current = state

  // Backend Ticket is { id, userId, description, comment, ticketHistory } — the comment thread
  // and laptop link stay as a local overlay keyed by the real ticket id. status and assignedTo
  // are seeded from ticketHistory the first time a ticket is seen; after that, local
  // claimTicket/resolveTicket dispatches are the only source (no backend mutation endpoint exists
  // yet to round-trip a claim/resolve, so once cached, the existing local copy wins for those
  // fields). The raiser's display name/email is NOT local-only (nothing ever mutates it), so it's
  // always refreshed from the current `users` list — otherwise it gets permanently stuck on a
  // fallback if this ticket was first normalized before the member list finished loading.
  const normalize = React.useCallback(
    (remote: RemoteTicket[]): Ticket[] => {
      const existingById = new Map(stateRef.current.tickets.map((t) => [t.id, t]))
      return remote.map((r) => {
        const existing = existingById.get(r.id)
        const raiser = users.find((u) => u.id === r.userId)
        const raisedByEmail = raiser?.emailAddress ?? r.userId
        const raisedByName = raiser?.fullName ?? r.userId

        if (existing) return { ...existing, raisedByEmail, raisedByName }

        const lastHistory = r.ticketHistory.at(-1)
        const assignee = lastHistory?.assignedTo ? users.find((u) => u.id === lastHistory.assignedTo) : undefined
        return {
          id: r.id,
          title: r.description,
          summary: r.description,
          status: lastHistory ? (STATUS_BY_HISTORY[lastHistory.ticketHistoryStatus] ?? "open") : "open",
          laptopId: null,
          raisedByEmail,
          raisedByName,
          assignedToEmail: assignee?.emailAddress ?? null,
          assignedToName: assignee?.fullName ?? null,
          createdAt: new Date().toISOString(),
          comments: r.comment
            ? [
                {
                  id: generateId("comment"),
                  authorEmail: raisedByEmail,
                  authorName: raisedByName,
                  message: r.comment,
                  createdAt: new Date().toISOString(),
                },
              ]
            : [],
        }
      })
    },
    [users],
  )

  const refresh = React.useCallback(async () => {
    // Don't fetch until auth has actually resolved — `useRole()` returns its "employee"
    // default the instant this provider mounts, before the real role is known. Fetching
    // against that guess would hit the wrong (current-user-only) endpoint, and since it's a
    // different endpoint than the IT-scoped one, whichever response lands second can clobber
    // the other with a less-complete result.
    if (authStatus !== "authenticated") return
    dispatch({ type: "loading" })
    try {
      const remote = role === "it" ? await getTickets() : await getCurrentUserTickets()
      dispatch({ type: "loaded", tickets: normalize(remote) })
    } catch (err) {
      dispatch({ type: "error", error: getErrorMessage(err) })
    }
  }, [normalize, role, authStatus])

  React.useEffect(() => {
    refresh()
  }, [refresh])

  const createTicket = React.useCallback(
    async (input: CreateTicketInput) => {
      const id = await createTicketApi(input.summary, input.summary)
      const ticket: Ticket = {
        id,
        title: input.title,
        summary: input.summary,
        status: "open",
        laptopId: input.laptopId,
        raisedByEmail: input.raisedByEmail,
        raisedByName: input.raisedByName,
        assignedToEmail: null,
        assignedToName: null,
        createdAt: new Date().toISOString(),
        comments: [],
      }
      dispatch({ type: "create", ticket })
      return ticket
    },
    [],
  )

  const claimTicket = React.useCallback(
    (id: string, assignee: { email: string; name: string }) =>
      dispatch({ type: "claim", id, assigneeEmail: assignee.email, assigneeName: assignee.name }),
    [],
  )

  const resolveTicket = React.useCallback((id: string) => dispatch({ type: "resolve", id }), [])

  const addComment = React.useCallback(
    (id: string, comment: { authorEmail: string; authorName: string; message: string }) =>
      dispatch({
        type: "comment",
        id,
        comment: { id: generateId("comment"), createdAt: new Date().toISOString(), ...comment },
      }),
    [],
  )

  const value = React.useMemo(
    () => ({ ...state, refresh, createTicket, claimTicket, resolveTicket, addComment }),
    [state, refresh, createTicket, claimTicket, resolveTicket, addComment],
  )

  return <TicketsContext.Provider value={value}>{children}</TicketsContext.Provider>
}

export function useTickets() {
  const ctx = React.useContext(TicketsContext)
  if (!ctx) throw new Error("useTickets must be used within TicketsProvider")
  return ctx
}
