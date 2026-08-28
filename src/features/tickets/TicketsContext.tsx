import * as React from "react"
import { generateId } from "../../lib/id"
import { loadState, saveState } from "../../lib/persist"
import { mockTickets } from "./mockTickets"
import type { Ticket, TicketComment, TicketStatus } from "./types"

const STORAGE_KEY = "laptrac.tickets"

type TicketsAction =
  | { type: "create"; ticket: Ticket }
  | { type: "claim"; id: string; assigneeEmail: string; assigneeName: string }
  | { type: "resolve"; id: string }
  | { type: "comment"; id: string; comment: TicketComment }

function reducer(state: Ticket[], action: TicketsAction): Ticket[] {
  switch (action.type) {
    case "create":
      return [action.ticket, ...state]
    case "claim":
      return state.map((t) =>
        t.id === action.id
          ? {
              ...t,
              status: "claimed" as TicketStatus,
              assignedToEmail: action.assigneeEmail,
              assignedToName: action.assigneeName,
            }
          : t,
      )
    case "resolve":
      return state.map((t) => (t.id === action.id ? { ...t, status: "resolved" as TicketStatus } : t))
    case "comment":
      return state.map((t) => (t.id === action.id ? { ...t, comments: [...t.comments, action.comment] } : t))
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
  createTicket: (input: CreateTicketInput) => Ticket
  claimTicket: (id: string, assignee: { email: string; name: string }) => void
  resolveTicket: (id: string) => void
  addComment: (id: string, comment: { authorEmail: string; authorName: string; message: string }) => void
}

const TicketsContext = React.createContext<TicketsContextValue | null>(null)

export function TicketsProvider({ children }: { children: React.ReactNode }) {
  const [tickets, dispatch] = React.useReducer(reducer, undefined, () =>
    loadState<Ticket[]>(STORAGE_KEY, mockTickets),
  )

  React.useEffect(() => {
    saveState(STORAGE_KEY, tickets)
  }, [tickets])

  const createTicket = React.useCallback((input: CreateTicketInput) => {
    const ticket: Ticket = {
      id: generateId("ticket"),
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
  }, [])

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
    () => ({ tickets, createTicket, claimTicket, resolveTicket, addComment }),
    [tickets, createTicket, claimTicket, resolveTicket, addComment],
  )

  return <TicketsContext.Provider value={value}>{children}</TicketsContext.Provider>
}

export function useTickets() {
  const ctx = React.useContext(TicketsContext)
  if (!ctx) throw new Error("useTickets must be used within TicketsProvider")
  return ctx
}
