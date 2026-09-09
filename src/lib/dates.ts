import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"

dayjs.extend(utc)

export function formatDate(value: string | Date | null | undefined): string {
  return value ? dayjs.utc(value).format("MMM D, YYYY") : "—"
}

export function formatDateTime(value: string | Date | null | undefined): string {
  return value ? dayjs.utc(value).format("MMM D, YYYY h:mm A") : "—"
}

export function formatTime(value: string | Date | null | undefined): string {
  return value ? dayjs.utc(value).format("h:mm A") : "—"
}
