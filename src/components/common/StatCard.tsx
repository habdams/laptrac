import { Box, HStack, Stat } from "@chakra-ui/react"
import { Sparkline } from "./Sparkline"

interface StatCardProps {
  label: string
  value: string | number
  data?: number[]
}

export function StatCard({ label, value, data }: StatCardProps) {
  return (
    <Box borderWidth="1px" borderColor="border" rounded="xl" p="4" bg="bg.panel" flex="1" minW="36">
      <Stat.Root>
        <Stat.Label color="fg.muted" fontSize="sm">
          {label}
        </Stat.Label>
        <HStack justify="space-between" align="flex-end" mt="1">
          <Stat.ValueText fontSize="2xl" fontWeight="semibold">
            {value}
          </Stat.ValueText>
          {data && <Sparkline data={data} />}
        </HStack>
      </Stat.Root>
    </Box>
  )
}
