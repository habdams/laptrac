import * as React from "react"
import { generateId } from "../../lib/id"
import { loadState, saveState } from "../../lib/persist"
import type { AppNotification } from "./types"

const STORAGE_KEY = "laptrac.notifications"

type NotificationsAction =
  | { type: "push"; notification: AppNotification }
  | { type: "markRead"; id: string }
  | { type: "markAllRead"; recipientEmail: string }

function reducer(state: AppNotification[], action: NotificationsAction): AppNotification[] {
  switch (action.type) {
    case "push":
      return [action.notification, ...state]
    case "markRead":
      return state.map((n) => (n.id === action.id ? { ...n, read: true } : n))
    case "markAllRead":
      return state.map((n) => (n.recipientEmail === action.recipientEmail ? { ...n, read: true } : n))
  }
}

interface NotificationsContextValue {
  notifications: AppNotification[]
  notify: (recipientEmail: string, message: string) => void
  markRead: (id: string) => void
  markAllRead: (recipientEmail: string) => void
  unreadFor: (email: string) => AppNotification[]
  forRecipient: (email: string) => AppNotification[]
}

const NotificationsContext = React.createContext<NotificationsContextValue | null>(null)

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, dispatch] = React.useReducer(reducer, undefined, () =>
    loadState<AppNotification[]>(STORAGE_KEY, []),
  )

  React.useEffect(() => {
    saveState(STORAGE_KEY, notifications)
  }, [notifications])

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
  const markRead = React.useCallback((id: string) => dispatch({ type: "markRead", id }), [])
  const markAllRead = React.useCallback(
    (recipientEmail: string) => dispatch({ type: "markAllRead", recipientEmail }),
    [],
  )
  const unreadFor = React.useCallback(
    (email: string) => notifications.filter((n) => n.recipientEmail === email && !n.read),
    [notifications],
  )
  const forRecipient = React.useCallback(
    (email: string) => notifications.filter((n) => n.recipientEmail === email),
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
