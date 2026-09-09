import { apiClient } from "../../lib/apiClient"
import type { AppNotification } from "./types"

export async function getNotifications(): Promise<AppNotification[]> {
  const { data } = await apiClient.get<AppNotification[] | { item: AppNotification[] }>(
    "/users/user-notification",
  )
  return Array.isArray(data) ? data : data.item
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await apiClient.put(`/users/mark-as-read/${notificationId}`)
}
