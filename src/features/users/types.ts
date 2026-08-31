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
