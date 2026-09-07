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
const STATUS_BY_NUMBER: Record<number, TicketStatus> = { 0: "open", 1: "claimed", 3: "resolved" }

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
  const { status: authStatus, user: authUser } = useAuth()
  const role = useRole()
  const [state, dispatch] = React.useReducer(reducer, undefined, () =>
    loadState<TicketsState>(STORAGE_KEY, { tickets: [], status: "idle", error: null }),
  )

  React.useEffect(() => {
    saveState(STORAGE_KEY, state)
  }, [state])

  const stateRef = React.useRef(state)
  stateRef.current = state

  // Backend Ticket is now the flat shape `{ id, userLaptopID, comment, assignedTo, ticketStatus,
  // comments }` (confirmed live 2026-09-07) — this replaced an older nested-`ticketHistory`
  // contract with no deprecation notice (see POST_DEMO_TODO.md #6, which still describes the old
  // shape and needs updating once backend confirms the details flagged below).
  //
  // `userId` is GONE — there is no longer any field identifying who raised a ticket. This is a
  // real regression for the IT all-tickets view (getTickets()): nothing client-side can resolve
  // the raiser for someone else's ticket anymore (`userLaptopID` is a laptop-record id, not a
  // user id — see LaptopsContext.tsx's "backend has no laptop id" comment for why those two ID
  // spaces differ). `selfScoped` tells us whether these tickets came from getCurrentUserTickets(),
  // which is scoped server-side to the caller — every ticket from that endpoint belongs to
  // `authUser` by construction, so the raiser is always known there. For getTickets() (IT viewing
  // everyone's tickets), fall back to a placeholder rather than fabricate a match.
  //
  // `assignedTo` is now a display name (e.g. "Bob"), not a user id — best-effort recover an email
  // by name match against `users` (IT-only list); this is fragile (breaks on duplicate names) but
  // degrades to just showing the name, never a wrong name.
  //
  // `comments` (plural) is new and its item shape is unconfirmed — read defensively with fallback
  // field names so an unexpected shape never throws (see RemoteTicketComment in ticketsApi.ts).
  const normalize = React.useCallback(
    (remote: RemoteTicket[], selfScoped: boolean): Ticket[] => {
      const existingById = new Map(stateRef.current.tickets.map((t) => [t.id, t]))
      return remote.map((r) => {
        const existing = existingById.get(r.id)
        const raisedByEmail = selfScoped ? (authUser?.email ?? "Unknown employee") : "Unknown employee"
        const raisedByName = selfScoped ? (authUser?.name ?? "Unknown employee") : "Unknown employee"

        if (existing) return { ...existing, raisedByEmail, raisedByName }

        const assignee = r.assignedTo ? users.find((u) => u.fullName === r.assignedTo) : undefined
        const status: TicketStatus =
          r.ticketStatus != null ? (STATUS_BY_NUMBER[r.ticketStatus] ?? "open") : r.assignedTo ? "claimed" : "open"

        return {
          id: r.id,
          title: r.comment,
          summary: r.comment,
          status,
          laptopId: r.userLaptopID,
          raisedByEmail,
          raisedByName,
          assignedToEmail: assignee?.emailAddress ?? null,
          assignedToName: r.assignedTo,
          createdAt: new Date().toISOString(),
          comments: (Array.isArray(r.comments) ? r.comments : []).map((c) => ({
            id: generateId("comment"),
            authorEmail: c.authorName ?? c.author ?? c.by ?? "Unknown",
            authorName: c.authorName ?? c.author ?? c.by ?? "Unknown",
            message: c.message ?? c.comment ?? c.text ?? "",
            createdAt: c.createdAt ?? new Date().toISOString(),
          })),
        }
      })
    },
    [users, authUser],
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
      const selfScoped = role !== "it"
      const remote = selfScoped ? await getCurrentUserTickets() : await getTickets()
      dispatch({ type: "loaded", tickets: normalize(remote, selfScoped) })
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
