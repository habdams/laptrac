export type LaptopStatus = "available" | "assigned" | "in-repair" | "retired"

export interface LaptopHistoryEntry {
  id: string
  type: "assigned" | "unassigned" | "repair" | "note"
  note: string
  actorName: string
  createdAt: string
}

export interface Laptop {
  id: string
  brand: string
  model: string
  os: string
  serialNumber: string
  status: LaptopStatus
  assignedToEmail: string | null
  assignedToName: string | null
  history: LaptopHistoryEntry[]
}
