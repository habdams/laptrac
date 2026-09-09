import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"

dayjs.extend(utc)

function serverTime(value: string | Date) {
  return dayjs.utc(value).add(1, "hour")
}

export function dateValue(value: string | Date | null | undefined): number {
  return value ? serverTime(value).valueOf() : 0
}

export function dateKey(value: string | Date | null | undefined): string {
  return value ? serverTime(value).format("YYYY-MM-DD") : ""
}

export function formatDate(value: string | Date | null | undefined): string {
  return value ? serverTime(value).format("MMM D, YYYY") : "—"
}

export function formatDateTime(value: string | Date | null | undefined): string {
  return value ? serverTime(value).format("MMM D, YYYY h:mm A") : "—"
}

export function formatTime(value: string | Date | null | undefined): string {
  return value ? serverTime(value).format("h:mm A") : "—"
}
