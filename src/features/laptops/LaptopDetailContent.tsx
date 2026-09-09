import { HStack, Separator, Stack, Text } from "@chakra-ui/react"
import { useRole } from "../../auth/useRole"
import { StatusBadge, laptopStatusTone } from "../../components/common/StatusBadge"
import { LaptopHistoryTimeline } from "./LaptopHistoryTimeline"
import type { LaptopHistoryEntry, LaptopStatus } from "./types"

interface LaptopDetailContentLaptop {
  assetName: string
  model: string
  assetLocation: string
  employeeDepartment: string
  price: number
  condition?: number//
  status?: LaptopStatus
  assignedToName?: string | null
  history?: LaptopHistoryEntry[]
}

export function LaptopDetailContent({ laptop }: { laptop: LaptopDetailContentLaptop }) {
  const role = useRole()
  const status = laptop.status ?? "unassigned"
  const history = laptop.history ?? []
  return (
    <Stack gap="4">
      <Stack gap="1">
        <Text fontSize="xs" color="fg.muted" textTransform="uppercase" letterSpacing="wide">
          Asset name
        </Text>
        <Text fontSize="lg" fontWeight="semibold">
          {laptop.assetName}
        </Text>
      </Stack>

      <HStack gap="6" wrap="wrap">
        <Stack gap="0">
          <Text fontSize="xs" color="fg.muted">
            Model
          </Text>
          <Text fontSize="sm">{laptop.model}</Text>
        </Stack>
        {/* <Stack gap="0">
          <Text fontSize="xs" color="fg.muted">
            Condition
          </Text>
          <Text fontSize="sm">{laptop.condition !== undefined ? conditionLabel(laptop.condition) : "—"}</Text>
        </Stack> */}
        <Stack gap="0">
          <Text fontSize="xs" color="fg.muted">
            Status
          </Text>
          <StatusBadge label={status.replace("-", " ")} tone={laptopStatusTone[status]} />
        </Stack>
      </HStack>

      <HStack gap="6" wrap="wrap">
        <Stack gap="0">
          <Text fontSize="xs" color="fg.muted">
            Location
          </Text>
          <Text fontSize="sm">{laptop.assetLocation || "—"}</Text>
        </Stack>
        <Stack gap="0">
          <Text fontSize="xs" color="fg.muted">
            Department
          </Text>
          <Text fontSize="sm">{laptop.employeeDepartment || "—"}</Text>
        </Stack>
        <Stack gap="0">
          <Text fontSize="xs" color="fg.muted">
            Price
          </Text>
          <Text fontSize="sm">{laptop.price ? `$${laptop.price.toLocaleString()}` : "—"}</Text>
        </Stack>
      </HStack>

      <Stack gap="0">
        <Text fontSize="xs" color="fg.muted">
          Assigned to
        </Text>
        <Text fontSize="sm">{laptop.assignedToName ?? "Unassigned"}</Text>
      </Stack>

      {role === "it" && (
        <>
          <Separator />
          <Stack gap="2">
            <Text fontSize="sm" fontWeight="semibold">
              History
            </Text>
            <LaptopHistoryTimeline entries={history} />
          </Stack>
        </>
      )}
    </Stack>
  )
}
