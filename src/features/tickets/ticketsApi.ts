import { apiClient } from "../../lib/apiClient";

export interface RemoteTicketComment {
  id: string;
  ticketId: string | null;
  authorName: string;
  authorEmail: string;
  message: string;
  createdAt: string;
}

export interface RemoteTicket {
  userLaptopID: string | null;
  id: string;
  ownerId: string;
  ownerName: string;
  comment: string;
  assignedTo: string | null;
  assignedToEmail: string;
  ticketStatus: number | null;
  ticketNumber: string;
  comments: RemoteTicketComment[];
}

export interface PaginatedListOfTicket {
  pageIndex: number;
  totalPages: number;
  item: RemoteTicket[];
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export async function getTickets(
  pageNumber = 1,
  pageSize = 20,
): Promise<PaginatedListOfTicket> {
  const { data } = await apiClient.get<PaginatedListOfTicket>("/api/tickets", {
    params: { pageNumber, pageSize },
  });
  return data;
}

export async function getCurrentUserTickets(
  pageNumber = 1,
  pageSize = 20,
): Promise<PaginatedListOfTicket> {
  const { data } = await apiClient.get<PaginatedListOfTicket>(
    "/api/tickets/current-user",
    {
      params: { pageNumber, pageSize },
    },
  );
  return data;
}

export async function getTicket(ticketId: string): Promise<RemoteTicket> {
  const { data } = await apiClient.get<RemoteTicket>(
    `/api/tickets/${ticketId}`,
  );
  return data;
}

export async function createTicket(
  description: string,
  comment: string,
): Promise<string> {
  const { data } = await apiClient.post<{ ticketId: string }>(
    "/api/tickets/create",
    { description, comment },
  );
  return data.ticketId;
}

export async function addTicketComment(
  ticketId: string,
  message: string,
): Promise<string> {
  const { data } = await apiClient.post<{ commentId: string }>(
    `/api/tickets/${ticketId}/add-comment`,
    { message },
  );
  return data.commentId;
}

export async function updateTicketStatus(
  ticketId: string,
  ticketHistoryStatus: number,
  comment?: string,
): Promise<string> {
  const { data } = await apiClient.put<{ ticketId: string }>(
    `/api/tickets/${ticketId}/claim-resolve`,
    {
      ticketHistoryStatus,
      comment: comment ?? null,
    },
  );
  return data.ticketId;
}
