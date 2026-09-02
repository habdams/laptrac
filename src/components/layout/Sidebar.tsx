import { Box, Button, HStack, Separator, Stack, Text, VStack } from "@chakra-ui/react"
import type { ReactNode } from "react"
import { LuLaptop, LuLogOut, LuTicket, LuUsers } from "react-icons/lu"
import { Link as RouterLink, useLocation } from "react-router"
import { useAuth } from "../../auth/AuthContext"
import { useRole } from "../../auth/useRole"
import { ColorModeButton } from "../ui/color-mode"
import { MyLaptopCard } from "./MyLaptopCard"
import { NotificationBell } from "./NotificationBell"
import { ProfileCard } from "./ProfileCard"

export function Sidebar() {
  const { logout } = useAuth()
  const role = useRole()

  return (
    <Box
      as="nav"
      w="72"
      flexShrink="0"
      borderRightWidth="1px"
      borderColor="border"
      h="100vh"
      position="sticky"
      top="0"
      p="4"
      overflowY="auto"
    >
      <VStack align="stretch" gap="4" h="full">
        <HStack justify="space-between">
          <Text fontSize="lg" fontWeight="bold">
            LapTrac
          </Text>
          <NotificationBell />
        </HStack>

        <ProfileCard />
        <MyLaptopCard />

        <Separator />

        <Stack gap="1">
          <SidebarLink to="/tickets" icon={<LuTicket />} label="Tickets" />
          {role === "it" && <SidebarLink to="/laptops" icon={<LuLaptop />} label="Laptops" />}
          {role === "it" && <SidebarLink to="/admin/members" icon={<LuUsers />} label="Members" />}
        </Stack>

        <Box flex="1" />

        <Separator />

        <HStack justify="space-between">
          <ColorModeButton />
          <Button variant="ghost" size="sm" onClick={logout}>
            <LuLogOut /> Sign out
          </Button>
        </HStack>
      </VStack>
    </Box>
  )
}

function SidebarLink({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  const location = useLocation()
  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`)

  return (
    <HStack
      asChild
      colorPalette={isActive ? "orange" : "gray"}
      gap="2"
      px="3"
      py="2"
      rounded="md"
      fontSize="sm"
      fontWeight="medium"
      color={isActive ? "colorPalette.fg" : "fg.muted"}
      bg={isActive ? "colorPalette.subtle" : "transparent"}
      _hover={{ bg: isActive ? "colorPalette.subtle" : "bg.muted" }}
    >
      <RouterLink to={to}>
        {icon}
        <Text>{label}</Text>
      </RouterLink>
    </HStack>
  )
}
