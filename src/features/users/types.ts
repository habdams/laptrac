import type { LaptopHistoryEntry, LaptopStatus } from "../laptops/types"

// Role values are undocumented in the API spec — placeholder labels until backend confirms the mapping.
export const ROLE_LABELS: Record<number, string> = {}

export function roleLabel(role: number): string {
  return ROLE_LABELS[role] ?? `Role ${role}`
}

export interface User {
  id: string
  auth0UserId: string | null
  emailAddress: string | null
  firstName: string | null
  lastName: string | null
  middleName: string | null
  fullName: string | null
  isActive: boolean
  lastLogin: string | null
  roles: number[]
}

export interface CreateUserInput {
  email: string
  firstName: string
  lastName: string
  middleName?: string
  role?: number[]
}

export interface UpdateUserInput {
  email: string
  firstName: string
  lastName: string
  middleName?: string
  role?: number[]
}

// Shape returned by GET /api/users/current-user (the caller's own record).
// Distinct from `User` (admin member list): singular `role: number` here vs
// plural `roles: number[]` there. Do not merge these types.
export interface CurrentUserLaptop {
  id: string
  userId: string | null
  assetName: string
  model: string
  comment: string
  assetLocation: string
  employeeDepartment: string
  price: number
  estimationUsefulLifeYear: string | null
  depreciationEstimationDate: string | null
  warrantyExpirationDate: string | null
  purchaseYear: string | null
  // Not in the API yet — backend plans to add these; optional so they pass
  // through once available with no further code changes.
  condition?: number
  status?: LaptopStatus
  assignedToName?: string | null
  history?: LaptopHistoryEntry[]
}

export interface CurrentUser {
  id: string
  auth0UserId: string | null
  emailAddress: string | null
  firstName: string | null
  lastName: string | null
  middleName: string | null
  fullName: string | null
  isActive: boolean
  lastLogin: string | null
  role: number
  userLaptops: CurrentUserLaptop[]
}
