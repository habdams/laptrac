import { useAuth } from "./AuthContext"

export type Role = "it" | "employee"

export function useRole(): Role {
  const { user } = useAuth()
  return user?.role ?? "employee"
}
