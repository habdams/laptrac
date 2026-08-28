import { Box, Flex } from "@chakra-ui/react"
import type { ReactNode } from "react"
import { Sidebar } from "./Sidebar"

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <Flex minH="100vh" bg="bg.subtle">
      <Sidebar />
      <Box as="main" flex="1" p="6" minW="0">
        {children}
      </Box>
    </Flex>
  )
}
