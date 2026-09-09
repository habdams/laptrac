import * as React from "react"
import { generateId } from "../../lib/id"
import { dateValue } from "../../lib/dates"
import { getErrorMessage } from "../../lib/errors"
import { useAuth } from "../../auth/AuthContext"
import { toaster } from "../../components/ui/toaster"
import { getNotifications, markNotificationAsRead } from "./notificationsApi"
import type { AppNotification } from "./types"

const POLL_INTERVAL_MS = 30_000

type NotificationsAction =
  | { type: "push"; notification: AppNotification }
  | { type: "markRead"; id: string }
  | { type: "markAllRead"; recipientEmail: string }
  | { type: "replace"; notifications: AppNotification[] }

function reducer(state: AppNotification[], action: NotificationsAction): AppNotification[] {
  switch (action.type) {
    case "push":
      return [action.notification, ...state]
    case "markRead":
      return state.map((n) => (n.id === action.id ? { ...n, read: true } : n))
    case "markAllRead":
      return state.map((n) => (n.recipientEmail === action.recipientEmail ? { ...n, read: true } : n))
    case "replace": {
      const localOnly = state.filter((local) => local.id.startsWith("notif-") && !action.notifications.some((remote) => remote.id === local.id))
      return [...action.notifications, ...localOnly]
    }
  }
}

interface NotificationsContextValue {
  notifications: AppNotification[]
  notify: (recipientEmail: string, message: string) => void
  markRead: (id: string) => Promise<void>
  markAllRead: (recipientEmail: string) => void
  unreadFor: (email: string) => AppNotification[]
  forRecipient: (email: string) => AppNotification[]
}

const NotificationsContext = React.createContext<NotificationsContextValue | null>(null)

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [notifications, dispatch] = React.useReducer(reducer, [])
  const email = user?.email ?? null

  const refresh = React.useCallback(async () => {
    if (!email) {
      dispatch({ type: "replace", notifications: [] })
      return
    }

    try {
      const remoteNotifications = await getNotifications()
      dispatch({
        type: "replace",
        notifications: remoteNotifications.filter((notification) => notification.recipientEmail === email),
      })
    } catch (error) {
      toaster.create({
        type: "error",
        title: "Couldn't load notifications",
        description: getErrorMessage(error),
      })
    }
  }, [email])

  React.useEffect(() => {
    void refresh()
    if (!email) return

    const intervalId = window.setInterval(() => {
      void refresh()
    }, POLL_INTERVAL_MS)

    return () => window.clearInterval(intervalId)
  }, [email, refresh])

  const notify = React.useCallback(
    (recipientEmail: string, message: string) =>
      dispatch({
        type: "push",
        notification: {
          id: generateId("notif"),
          recipientEmail,
          message,
          read: false,
          createdAt: new Date().toISOString(),
        },
      }),
    [],
  )
  const markRead = React.useCallback(async (id: string) => {
    dispatch({ type: "markRead", id })
    try {
      await markNotificationAsRead(id)
    } catch (error) {
      toaster.create({
        type: "error",
        title: "Couldn't mark notification as read",
        description: getErrorMessage(error),
      })
      await refresh()
    }
  }, [refresh])
  const markAllRead = React.useCallback(
    (recipientEmail: string) => dispatch({ type: "markAllRead", recipientEmail }),
    [],
  )
  const unreadFor = React.useCallback(
    (email: string) => notifications.filter((n) => n.recipientEmail === email && !n.read),
    [notifications],
  )
  const forRecipient = React.useCallback(
    (email: string) =>
      notifications
        .filter((n) => n.recipientEmail === email)
        .sort((a, b) => dateValue(b.createdAt) - dateValue(a.createdAt)),
    [notifications],
  )

  const value = React.useMemo(
    () => ({ notifications, notify, markRead, markAllRead, unreadFor, forRecipient }),
    [notifications, notify, markRead, markAllRead, unreadFor, forRecipient],
  )

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export function useNotifications() {
  const ctx = React.useContext(NotificationsContext)
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider")
  return ctx
}
