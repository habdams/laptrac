import { Box, HStack, Stack, Text } from "@chakra-ui/react"
import { StatusBadge, laptopStatusTone } from "../../components/common/StatusBadge"
import { formatDate, formatTime } from "../../lib/dates"
import { normalizeLaptopStatus, type LaptopHistoryEntry } from "./types"

export function LaptopHistoryTimeline({ entries }: { entries: LaptopHistoryEntry[] }) {
  const history = [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  if (history.length === 0) {
    return (
      <Text fontSize="sm" color="fg.muted">
        No history yet.
      </Text>
    )
  }

  return (
    <Stack gap="0" position="relative" pl="5">
      <Box position="absolute" left="5px" top="3" bottom="3" w="1px" bg="border" />
      {history.map((entry) => {
        const status = normalizeLaptopStatus(entry.status)
        return (
          <Box key={entry.id} position="relative" pb="4">
            <Box
              position="absolute"
              left="-20px"
              top="3"
              w="10px"
              h="10px"
              rounded="full"
              borderWidth="2px"
              borderColor="border.emphasized"
              bg="bg"
              zIndex="1"
            />
            <Stack gap="2" borderWidth="1px" borderColor="border" rounded="md" p="3">
              <HStack justify="space-between" align="start" gap="3">
                <Text fontSize="sm" fontWeight="semibold">
                  {formatDate(entry.createdAt)}
                </Text>
                <Text fontSize="xs" color="fg.muted">
                  {formatTime(entry.createdAt)}
                </Text>
              </HStack>
              <HStack justify="space-between" align="center" gap="3">
                <StatusBadge label={status.replace("-", " ")} tone={laptopStatusTone[status]} />
                <Text fontSize="xs" color="fg.muted" textAlign="right">
                  by {entry.actorName || "Unknown"}
                </Text>
              </HStack>
              <Text fontSize="sm">{entry.note || "No comment"}</Text>
            </Stack>
          </Box>
        )
      })}
    </Stack>
  )
}
