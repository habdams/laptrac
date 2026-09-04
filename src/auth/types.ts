import type { CurrentUserLaptop } from "../features/users/types"

export interface AuthUser {
  id: string
  email: string
  name: string
  role: "it" | "employee"
  laptop: CurrentUserLaptop | null
}

export type AuthState =
  | { status: "anonymous"; user: null }
  | { status: "authenticated"; user: AuthUser }
