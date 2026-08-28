import { Tag } from "../ui/tag"

export type StatusTone = "gray" | "blue" | "orange" | "green" | "red"

export function StatusBadge({ label, tone }: { label: string; tone: StatusTone }) {
  return (
    <Tag
      colorPalette={tone}
      variant="outline"
      size="sm"
      textTransform="uppercase"
      letterSpacing="wide"
      fontWeight="semibold"
    >
      {label}
    </Tag>
  )
}

export const ticketStatusTone: Record<string, StatusTone> = {
  open: "blue",
  claimed: "orange",
  resolved: "green",
}

export const laptopStatusTone: Record<string, StatusTone> = {
  available: "green",
  assigned: "blue",
  "in-repair": "orange",
  retired: "gray",
}
