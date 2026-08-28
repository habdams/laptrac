import { Badge, Box, IconButton, Separator, Stack, Text } from "@chakra-ui/react"
import { LuBell } from "react-icons/lu"
import { useAuth } from "../../auth/AuthContext"
import { useNotifications } from "../../features/notifications/NotificationsContext"
import { PopoverBody, PopoverContent, PopoverHeader, PopoverRoot, PopoverTitle, PopoverTrigger } from "../ui/popover"

export function NotificationBell() {
  const { user } = useAuth()
  const { forRecipient, unreadFor, markAllRead } = useNotifications()
  if (!user) return null

  const items = forRecipient(user.email)
  const unread = unreadFor(user.email)

  return (
    <PopoverRoot
      onOpenChange={(e) => {
        if (e.open) markAllRead(user.email)
      }}
    >
      <PopoverTrigger asChild>
        <Box position="relative">
          <IconButton aria-label="Notifications" variant="ghost" size="sm">
            <LuBell />
          </IconButton>
          {unread.length > 0 && (
            <Badge
              colorPalette="orange"
              position="absolute"
              top="-1"
              right="-1"
              rounded="full"
              minW="4"
              px="1"
              fontSize="2xs"
            >
              {unread.length}
            </Badge>
          )}
        </Box>
      </PopoverTrigger>
      <PopoverContent w="sm">
        <PopoverHeader>
          <PopoverTitle>Notifications</PopoverTitle>
        </PopoverHeader>
        <PopoverBody maxH="72" overflowY="auto">
          <Stack gap="3">
            {items.length === 0 && (
              <Text fontSize="sm" color="fg.muted">
                No notifications yet.
              </Text>
            )}
            {items.map((n, i) => (
              <Stack key={n.id} gap="0">
                <Text fontSize="sm">{n.message}</Text>
                <Text fontSize="xs" color="fg.muted">
                  {new Date(n.createdAt).toLocaleString()}
                </Text>
                {i < items.length - 1 && <Separator mt="2" />}
              </Stack>
            ))}
          </Stack>
        </PopoverBody>
      </PopoverContent>
    </PopoverRoot>
  )
}
