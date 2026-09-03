import { apiClient } from "../../lib/apiClient"

export interface RemoteUserLaptop {
  userID: string
  assetName: string
  model: string
  comment: string
  assetLocation: string
  employeeDepartment: string
  condition: number
  price: number
  estimationUsefulLifeYear: string | null
  depreciationEstimationDate: string | null
  warrantyExpirationDate: string | null
  purchaseYear: string | null
}

interface PaginatedListOfUserLaptop {
  pageIndex: number
  totalPages: number
  item: RemoteUserLaptop[]
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface CreateLaptopInput {
  assetName: string
  model: string
  comment: string
  assetLocation: string
  employeeDepartment: string
  condition: number
  price: number
  estimationUsefulLifeYear: string
  depreciationEstimationDate: string
  warrantyExpirationDate: string
  purchaseYear: string
}

export async function getLaptops(pageNumber = 1, pageSize = 100): Promise<RemoteUserLaptop[]> {
  const { data } = await apiClient.get<PaginatedListOfUserLaptop>("/api/laptops", {
    params: { pageNumber, pageSize },
  })
  return data.item
}

export async function getCurrentUserLaptops(pageNumber = 1, pageSize = 100): Promise<RemoteUserLaptop[]> {
  const { data } = await apiClient.get<PaginatedListOfUserLaptop>("/api/laptops/current-user", {
    params: { pageNumber, pageSize },
  })
  return data.item
}

export async function createLaptop(userID: string, input: CreateLaptopInput): Promise<string> {
  const { data } = await apiClient.post<{ laptopId: string }>(`/api/laptops/create/${userID}`, input)
  return data.laptopId
}
