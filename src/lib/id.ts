export function generateId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}
