import { useITTeam } from "../features/admin/ITTeamContext"
import { useAuth } from "./AuthContext"

export type Role = "it" | "employee"

export function useRole(): Role {
  const { user } = useAuth()
  const { isITMember } = useITTeam()
  return isITMember(user?.email) ? "it" : "employee"
}
