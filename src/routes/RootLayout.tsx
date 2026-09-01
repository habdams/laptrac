import React from "react"
import { Navigate, Outlet } from "react-router"
import { useAuth } from "../auth/AuthContext"
import { AppShell } from "../components/layout/AppShell"
import { setAuthAsReady } from "@/lib/authTracker"

export function Component() {
  const { status } = useAuth()

  React.useEffect(() => {
    if(status != 'loading'){
      setAuthAsReady();
  }
  }, [status])
  

  if (status !== "authenticated") {
    return <Navigate to="/login" replace />
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
