import dayjs from "dayjs"

export function formatDate(value: string | Date | null | undefined): string {
  return value ? dayjs(value).format("MMM D, YYYY") : "—"
}

export function formatDateTime(value: string | Date | null | undefined): string {
  return value ? dayjs(value).format("MMM D, YYYY h:mm A") : "—"
}

export function formatTime(value: string | Date | null | undefined): string {
  return value ? dayjs(value).format("h:mm A") : "—"
}
