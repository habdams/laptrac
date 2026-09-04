import { Badge, HStack, Separator, Stack, Text } from "@chakra-ui/react"
import { StatusBadge, laptopStatusTone } from "../../components/common/StatusBadge"
import { conditionLabel, type LaptopHistoryEntry, type LaptopStatus } from "./types"

interface LaptopDetailContentLaptop {
  assetName: string
  model: string
  assetLocation: string
  employeeDepartment: string
  price: number
  condition?: number
  status?: LaptopStatus
  assignedToName?: string | null
  history?: LaptopHistoryEntry[]
}

export function LaptopDetailContent({ laptop }: { laptop: LaptopDetailContentLaptop }) {
  const status = laptop.status ?? "assigned"
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
        <Stack gap="0">
          <Text fontSize="xs" color="fg.muted">
            Condition
          </Text>
          <Text fontSize="sm">{laptop.condition !== undefined ? conditionLabel(laptop.condition) : "—"}</Text>
        </Stack>
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

      <Separator />

      <Stack gap="2">
        <Text fontSize="sm" fontWeight="semibold">
          History
        </Text>
        {history.length === 0 && (
          <Text fontSize="sm" color="fg.muted">
            No history yet.
          </Text>
        )}
        {history.map((entry) => (
          <Stack key={entry.id} gap="0" borderWidth="1px" borderColor="border" rounded="md" p="3">
            <HStack justify="space-between">
              <Badge colorPalette="gray" variant="subtle" textTransform="capitalize">
                {entry.type}
              </Badge>
              <Text fontSize="xs" color="fg.muted">
                {new Date(entry.createdAt).toLocaleDateString()}
              </Text>
            </HStack>
            <Text fontSize="sm" mt="1">
              {entry.note}
            </Text>
            <Text fontSize="xs" color="fg.muted">
              by {entry.actorName}
            </Text>
          </Stack>
        ))}
      </Stack>
    </Stack>
  )
}
