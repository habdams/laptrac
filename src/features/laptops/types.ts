export type LaptopStatus =
  | "available"
  | "unassigned"
  | "assigned"
  | "in-repair"
  | "retired";

export function normalizeLaptopStatus(status: LaptopStatus | number | string | null | undefined): LaptopStatus {
  if (typeof status === "number") {
    return (
      { 0: "available", 1: "unassigned", 2: "assigned", 3: "in-repair", 4: "retired" } as Record<number, LaptopStatus>
    )[status] ?? "unassigned";
  }

  if (status === "available" || status === "unassigned" || status === "assigned" || status === "in-repair" || status === "retired") {
    return status;
  }

  return "assigned";
}

export interface LaptopHistoryEntry {
  id: string;
  type: "assigned" | "unassigned" | "repair" | "note";
  note: string;
  actorName: string;
  createdAt: string;
}

// UserLaptopCondition values are undocumented in the API spec — placeholder labels until backend confirms.
export const CONDITION_LABELS: Record<number, string> = {};

export function conditionLabel(condition: number): string {
  return CONDITION_LABELS[condition] ?? `Condition ${condition}`;
}

export interface Laptop {
  /** = the owning user's userID — the backend has no separate laptop id, and it's confirmed one laptop per user. */
  id: string;
  assetName: string;
  model: string;
  comment: string;
  assetLocation: string;
  employeeDepartment: string;
  condition: number;
  price: number;
  estimationUsefulLifeYear: string;
  depreciationEstimationDate: string;
  warrantyExpirationDate: string;
  purchaseYear: string;

  // Local-only fields: no backend support yet (no assign/unassign/status/history endpoints).
  // Persisted to localStorage as an overlay on top of whatever the API returns.
  status: LaptopStatus;
  assignedToEmail: string | null;
  assignedToName: string | null;
  history: LaptopHistoryEntry[];
}
