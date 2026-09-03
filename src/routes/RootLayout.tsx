import { Navigate, Outlet } from "react-router"
import { useAuth } from "../auth/AuthContext"
import { AppShell } from "../components/layout/AppShell"

export function Component() {
  const { status } = useAuth()

  if (status !== "authenticated") {
    return <Navigate to="/login" replace />
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
