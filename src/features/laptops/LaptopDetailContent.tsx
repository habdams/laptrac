import { Badge, HStack, Separator, Stack, Text } from "@chakra-ui/react"
import { StatusBadge, laptopStatusTone } from "../../components/common/StatusBadge"
import type { Laptop } from "./types"

export function LaptopDetailContent({ laptop }: { laptop: Laptop }) {
  return (
    <Stack gap="4">
      <Stack gap="1">
        <Text fontSize="xs" color="fg.muted" textTransform="uppercase" letterSpacing="wide">
          Serial number
        </Text>
        <Text fontSize="lg" fontWeight="semibold">
          {laptop.serialNumber}
        </Text>
      </Stack>

      <HStack gap="6" wrap="wrap">
        <Stack gap="0">
          <Text fontSize="xs" color="fg.muted">
            Brand
          </Text>
          <Text fontSize="sm">{laptop.brand}</Text>
        </Stack>
        <Stack gap="0">
          <Text fontSize="xs" color="fg.muted">
            Model
          </Text>
          <Text fontSize="sm">{laptop.model}</Text>
        </Stack>
        <Stack gap="0">
          <Text fontSize="xs" color="fg.muted">
            OS
          </Text>
          <Text fontSize="sm">{laptop.os}</Text>
        </Stack>
        <Stack gap="0">
          <Text fontSize="xs" color="fg.muted">
            Status
          </Text>
          <StatusBadge label={laptop.status.replace("-", " ")} tone={laptopStatusTone[laptop.status]} />
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
        {laptop.history.length === 0 && (
          <Text fontSize="sm" color="fg.muted">
            No history yet.
          </Text>
        )}
        {laptop.history.map((entry) => (
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
