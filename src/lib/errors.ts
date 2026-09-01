import axios from "axios"

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data
    if (typeof data === "string" && data.trim()) return data
    if (data && typeof data === "object" && "message" in data && typeof data.message === "string") {
      return data.message
    }
    if (err.response) return `${err.response.status} ${err.response.statusText}`
    return err.message
  }
  if (err instanceof Error) return err.message
  return "Something went wrong"
}
