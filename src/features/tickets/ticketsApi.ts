import { apiClient } from "../../lib/apiClient"

// Item shape for the `comments` array below is unconfirmed with backend — read defensively
// with fallback field names wherever this is consumed (see TicketsContext.normalize()).
export interface RemoteTicketComment {
  message?: string
  comment?: string
  text?: string
  authorName?: string
  author?: string
  by?: string
  createdAt?: string
}

// Flat shape confirmed live 2026-09-07 — replaces an older nested-`ticketHistory` contract
// with no backend deprecation notice or doc update (see POST_DEMO_TODO.md). `userId` and
// `description` are gone entirely; `assignedTo` is now a display name, not a user id.
export interface RemoteTicket {
  id: string
  userLaptopID: string | null
  comment: string
  assignedTo: string | null
  ticketStatus: number | null
  comments: RemoteTicketComment[]
}

interface PaginatedListOfTicket {
  pageIndex: number
  totalPages: number
  item: RemoteTicket[]
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export async function getTickets(pageNumber = 1, pageSize = 100): Promise<RemoteTicket[]> {
  const { data } = await apiClient.get<PaginatedListOfTicket>("/api/tickets", {
    params: { pageNumber, pageSize },
  })
  return data.item
}

export async function getCurrentUserTickets(pageNumber = 1, pageSize = 100): Promise<RemoteTicket[]> {
  const { data } = await apiClient.get<PaginatedListOfTicket>("/api/tickets/current-user", {
    params: { pageNumber, pageSize },
  })
  return data.item
}

export async function getTicket(ticketId: string): Promise<RemoteTicket> {
  const { data } = await apiClient.get<RemoteTicket>(`/api/tickets/${ticketId}`)
  return data
}

export async function createTicket(description: string, comment: string): Promise<string> {
  // The create-ticket response reuses the same "Response" schema as laptop-create in the API
  // spec, so the new ticket id comes back (oddly) under the `laptopId` key.
  const { data } = await apiClient.post<{ laptopId: string }>("/api/tickets/create", { description, comment })
  return data.laptopId
}
