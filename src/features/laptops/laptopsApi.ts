import { apiClient } from "../../lib/apiClient";
import type { RemoteLaptopHistory } from "./types";

export interface RemoteUserLaptop {
  id: string;
  userId: string | null;
  assetName: string;
  model: string;
  comment: string;
  assetLocation: string;
  employeeDepartment: string;
  condition?: number;
  assignedToName: string;
  assignedToEmail: string;
  status: string | number | null;
  price: number;
  currency?: string | null;
  receiptUrl?: string | null;
  receipt?: string | null;
  estimationUsefulLifeYear: string | null;
  depreciationEstimationDate: string | null;
  warrantyExpirationDate: string | null;
  purchaseYear: string | null;
  laptopHistories?: RemoteLaptopHistory[];
}

export interface PaginatedListOfUserLaptop {
  pageIndex: number;
  totalPages: number;
  item: RemoteUserLaptop[];
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface CreateLaptopInput {
  assetName: string;
  model: string;
  comment: string;
  assetLocation: string;
  employeeDepartment: string;
  price: number;
  currency: string;
  receipt?: File | null;
  estimationUsefulLifeYear: string;
  depreciationEstimationDate: string;
  warrantyExpirationDate: string;
  purchaseYear: string;
}

export interface UpdateLaptopInput {
  userID: string | null;
  status: number;
  comment: string | null;
}

export async function getLaptops(
  pageNumber = 1,
  pageSize = 20,
): Promise<PaginatedListOfUserLaptop> {
  const { data } = await apiClient.get<PaginatedListOfUserLaptop>(
    "/api/laptops",
    {
      params: { pageNumber, pageSize },
    },
  );
  return data;
}

export async function getCurrentUserLaptops(
  pageNumber = 1,
  pageSize = 20,
): Promise<PaginatedListOfUserLaptop> {
  const { data } = await apiClient.get<PaginatedListOfUserLaptop>(
    "/api/laptops/current-user",
    { params: { pageNumber, pageSize } },
  );
  return data;
}

export async function createLaptop(
  input: CreateLaptopInput,
): Promise<string> {
  const { receipt, ...laptopData } = input;
  const formData = new FormData();

  Object.entries(laptopData).forEach(([key, value]) => {
    formData.append(key, String(value));
  });

  if (receipt) {
    formData.append("receipt", receipt);
  }

  const { data } = await apiClient.post<{ laptopId: string }>(
    "/api/laptops/create",
    formData,
  );
  return data.laptopId;
}

export async function updateLaptop(
  laptopId: string,
  input: UpdateLaptopInput,
): Promise<void> {
  await apiClient.put(`/api/laptops/update/${laptopId}`, input);
}
