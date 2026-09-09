import { apiClient } from "../../lib/apiClient";
import type { CreateUserInput, CurrentUser, User } from "./types";

export interface PaginatedUsers {
  pageIndex: number;
  totalPages: number;
  item: User[];
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

interface CreateUserResponse {
  userId: string | null;
  message: string;
}

async function getUsersPage(
  path: string,
  pageNumber: number,
  pageSize: number,
  search?: string,
) {
  const { data } = await apiClient.get<PaginatedUsers | User[]>(path, {
    params: { pageNumber, pageSize, ...(search ? { search } : {}) },
  });
  if (Array.isArray(data)) {
    return {
      pageIndex: pageNumber,
      totalPages: 1,
      item: data,
      hasPreviousPage: pageNumber > 1,
      hasNextPage: false,
    };
  }
  return data;
}

export function getUsers(pageNumber = 1, pageSize = 10) {
  return getUsersPage("/api/users", pageNumber, pageSize);
}

export function searchUsers(search: string, pageNumber = 1, pageSize = 10) {
  return getUsersPage("/api/users/search", pageNumber, pageSize, search);
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const { data } = await apiClient.get<CurrentUser[]>(
    "/api/users/current-user",
  );
  const current = data[0];
  if (!current) throw new Error("current-user response was empty");
  return current;
}

export async function createUser(
  input: CreateUserInput,
): Promise<CreateUserResponse> {
  const { data } = await apiClient.post<CreateUserResponse>("/api/users", {
    email: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
    middleName: input.middleName ?? null,
    role: input.role ?? 0,
  });
  return data;
}

export async function updateUser(
  userId: string,
  role: number,
): Promise<CreateUserResponse> {
  const { data } = await apiClient.put<CreateUserResponse>(
    `/api/users/${userId}`,
    { role },
  );
  return data;
}
