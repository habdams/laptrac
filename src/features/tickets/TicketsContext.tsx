import * as React from "react"
import { useAuth } from "../../auth/AuthContext"
import { useRole } from "../../auth/useRole"
import { getErrorMessage } from "../../lib/errors"
import { loadState, saveState } from "../../lib/persist"
import { useMembers } from "../users/MembersContext"
import {
  addTicketComment,
  createTicket as createTicketApi,
  getCurrentUserTickets,
  getTickets,
  updateTicketStatus,
  type RemoteTicket,
} from "./ticketsApi"
import type { Ticket, TicketStatus } from "./types"

const STORAGE_KEY = "laptrac.tickets"
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

function reducer(state: TicketsState, action: TicketsAction): TicketsState {
  switch (action.type) {
    case "loading":
      return { ...state, status: "loading", error: null }
    case "loaded":
      return { tickets: action.tickets, status: "loaded", error: null }
    case "error":
      return { ...state, status: "error", error: action.error }
  }
}

interface CreateTicketInput {
  title: string
  summary: string
}

interface TicketsContextValue {
  tickets: Ticket[]
  status: TicketsState["status"]
  error: string | null
  refresh: () => Promise<void>
  createTicket: (input: CreateTicketInput) => Promise<string>
  claimTicket: (id: string) => Promise<void>
  resolveTicket: (id: string) => Promise<void>
  addComment: (id: string, message: string) => Promise<void>
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

  const normalize = React.useCallback(
    (remote: RemoteTicket[]): Ticket[] => {
      const existingById = new Map(stateRef.current.tickets.map((ticket) => [ticket.id, ticket]))

      return remote.map((ticket) => {
        const existing = existingById.get(ticket.id)
        const owner = users.find((user) => user.id === ticket.ownerId)
        const isCurrentUserOwner = ticket.ownerId === authUser?.id
        const assignee = ticket.assignedTo
          ? users.find(
              (user) =>
                user.id === ticket.assignedTo ||
                user.fullName === ticket.assignedTo ||
                user.emailAddress === ticket.assignedTo,
            )
          : undefined

        return {
          id: ticket.id,
          ownerId: ticket.ownerId,
          title: ticket.comment,
          summary: ticket.comment,
          status: STATUS_BY_NUMBER[ticket.ticketStatus ?? 0] ?? "open",
          laptopId: ticket.userLaptopID,
          raisedByEmail: owner?.emailAddress ?? (isCurrentUserOwner ? authUser?.email : null) ?? "Unknown employee",
          raisedByName: ticket.ownerName || owner?.fullName || (isCurrentUserOwner ? authUser?.name : null) || "Unknown employee",
          assignedToEmail: assignee?.emailAddress ?? null,
          assignedToName: ticket.assignedTo ?? assignee?.fullName ?? null,
          createdAt: existing?.createdAt ?? new Date().toISOString(),
          comments: ticket.comments.map((comment) => ({
            id: comment.id,
            authorEmail: comment.authorEmail,
            authorName: comment.authorName,
            message: comment.message,
            createdAt: comment.createdAt,
          })),
        }
      })
    },
    [authUser, users],
  )

  const refresh = React.useCallback(async () => {
    if (authStatus !== "authenticated") return

    dispatch({ type: "loading" })
    try {
      const remote = role === "it" ? await getTickets() : await getCurrentUserTickets()
      dispatch({ type: "loaded", tickets: normalize(remote) })
    } catch (err) {
      dispatch({ type: "error", error: getErrorMessage(err) })
    }
  }, [authStatus, normalize, role])

  React.useEffect(() => {
    refresh()
  }, [refresh])

  const createTicket = React.useCallback(
    async (input: CreateTicketInput) => {
      const ticketId = await createTicketApi(input.title, input.summary)
      await refresh()
      return ticketId
    },
    [refresh],
  )

  const claimTicket = React.useCallback(
    async (id: string) => {
      await updateTicketStatus(id, 1)
      await refresh()
    },
    [refresh],
  )

  const resolveTicket = React.useCallback(
    async (id: string) => {
      await updateTicketStatus(id, 3)
      await refresh()
    },
    [refresh],
  )

  const addComment = React.useCallback(
    async (id: string, message: string) => {
      await addTicketComment(id, message)
      await refresh()
    },
    [refresh],
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
