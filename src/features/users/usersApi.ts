import { apiClient } from "../../lib/apiClient";
import type {
  CreateUserInput,
  CurrentUser,
  UpdateUserInput,
  User,
} from "./types";

interface CreateUserResponse {
  userId: string | null;
  message: string;
}

export async function getUsers(): Promise<User[]> {
  const { data } = await apiClient.get<User[]>("/api/users");
  return data;
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
  input: UpdateUserInput,
): Promise<CreateUserResponse> {
  const { data } = await apiClient.put<CreateUserResponse>(
    `/api/users/user/${userId}`,
    {
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      middleName: input.middleName ?? null,
      role: input.role ?? 0,
    },
  );
  return data;
}
