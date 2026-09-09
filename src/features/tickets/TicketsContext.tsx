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
const PAGE_SIZE = 20
const STATUS_BY_NUMBER: Record<number, TicketStatus> = { 0: "open", 1: "claimed", 2: "resolved" }

interface TicketsState {
  tickets: Ticket[]
  status: "idle" | "loading" | "loaded" | "error"
  error: string | null
  pageIndex: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

type TicketsAction =
  | { type: "loading" }
  | {
      type: "loaded"
      tickets: Ticket[]
      pageIndex: number
      totalPages: number
      hasPreviousPage: boolean
      hasNextPage: boolean
    }
  | { type: "error"; error: string }

function reducer(state: TicketsState, action: TicketsAction): TicketsState {
  switch (action.type) {
    case "loading":
      return { ...state, status: "loading", error: null }
    case "loaded":
      return {
        tickets: action.tickets,
        status: "loaded",
        error: null,
        pageIndex: action.pageIndex,
        totalPages: action.totalPages,
        hasPreviousPage: action.hasPreviousPage,
        hasNextPage: action.hasNextPage,
      }
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
  pageIndex: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
  goToPage: (page: number) => Promise<void>
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
  const [state, dispatch] = React.useReducer(reducer, undefined, () => {
    const persisted = loadState<Partial<TicketsState>>(STORAGE_KEY, {})
    return {
      tickets: persisted.tickets ?? [],
      status: persisted.status ?? "idle",
      error: persisted.error ?? null,
      pageIndex: persisted.pageIndex ?? 1,
      totalPages: persisted.totalPages ?? 1,
      hasPreviousPage: persisted.hasPreviousPage ?? false,
      hasNextPage: persisted.hasNextPage ?? false,
    }
  })
  const pageRef = React.useRef(1)

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

  const refresh = React.useCallback(async (requestedPage = pageRef.current) => {
    if (authStatus !== "authenticated") return

    pageRef.current = requestedPage
    dispatch({ type: "loading" })
    try {
      const response = role === "it"
        ? await getTickets(requestedPage, PAGE_SIZE)
        : await getCurrentUserTickets(requestedPage, PAGE_SIZE)
      dispatch({
        type: "loaded",
        tickets: normalize(response.item),
        pageIndex: response.pageIndex,
        totalPages: response.totalPages,
        hasPreviousPage: response.hasPreviousPage,
        hasNextPage: response.hasNextPage,
      })
    } catch (err) {
      dispatch({ type: "error", error: getErrorMessage(err) })
    }
  }, [authStatus, normalize, role])

  React.useEffect(() => {
    pageRef.current = 1
    refresh()
  }, [refresh])

  const goToPage = React.useCallback(
    async (page: number) => {
      const nextPage = Math.max(1, Math.min(page, stateRef.current.totalPages))
      if (nextPage === pageRef.current && stateRef.current.status === "loaded") return
      await refresh(nextPage)
    },
    [refresh],
  )

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
      await updateTicketStatus(id, 2)
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
    () => ({ ...state, refresh, goToPage, createTicket, claimTicket, resolveTicket, addComment }),
    [state, refresh, goToPage, createTicket, claimTicket, resolveTicket, addComment],
  )

  return <TicketsContext.Provider value={value}>{children}</TicketsContext.Provider>
}

export function useTickets() {
  const ctx = React.useContext(TicketsContext)
  if (!ctx) throw new Error("useTickets must be used within TicketsProvider")
  return ctx
}
