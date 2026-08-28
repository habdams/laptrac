export type TicketStatus = "open" | "claimed" | "resolved"

export interface TicketComment {
  id: string
  authorEmail: string
  authorName: string
  message: string
  createdAt: string
}

export interface Ticket {
  id: string
  title: string
  summary: string
  status: TicketStatus
  laptopId: string | null
  raisedByEmail: string
  raisedByName: string
  assignedToEmail: string | null
  assignedToName: string | null
  createdAt: string
  comments: TicketComment[]
}
