import { apiClient } from "../../lib/apiClient"

export interface RemoteTicketHistoryEntry {
  ticketID: string
  userLaptopID: string
  ticketHistoryStatus: number
  assignedTo: string | null
  resolvedBy: string | null
  actionBy: string | null
  comment: string | null
  closedAt: string
}

export interface RemoteTicket {
  id: string
  userId: string
  description: string
  comment: string
  ticketHistory: RemoteTicketHistoryEntry[]
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
