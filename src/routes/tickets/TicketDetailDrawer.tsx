import * as React from "react"
import { Box, Button, HStack, Separator, Stack, Text, Textarea } from "@chakra-ui/react"
import { Navigate, useNavigate, useParams } from "react-router"
import { useAuth } from "../../auth/AuthContext"
import { useRole } from "../../auth/useRole"
import { StatusBadge, ticketStatusTone } from "../../components/common/StatusBadge"
import {
  DrawerBody,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerRoot,
  DrawerTitle,
} from "../../components/ui/drawer"
import { toaster } from "../../components/ui/toaster"
import { useLaptops } from "../../features/laptops/LaptopsContext"
import { useNotifications } from "../../features/notifications/NotificationsContext"
import { useTickets } from "../../features/tickets/TicketsContext"

export function Component() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const role = useRole()
  const { tickets, claimTicket, resolveTicket, addComment } = useTickets()
  const { laptops } = useLaptops()
  const { notify } = useNotifications()
  const [comment, setComment] = React.useState("")

  const ticket = tickets.find((t) => t.id === id)
  const close = () => navigate("/tickets")

  if (!ticket) {
    return <Navigate to="/tickets" replace />
  }

  const laptop = laptops.find((l) => l.id === ticket.laptopId)
  const canManage = role === "it"

  const handleClaim = () => {
    if (!user) return
    claimTicket(ticket.id, { email: user.email, name: user.name })
    notify(ticket.raisedByEmail, `${user.name} claimed your ticket: "${ticket.title}"`)
    toaster.create({ type: "info", title: "Ticket claimed", description: "Employee notified by email." })
  }

  const handleResolve = () => {
    if (!user) return
    resolveTicket(ticket.id)
    notify(ticket.raisedByEmail, `Your ticket "${ticket.title}" was resolved by ${user.name}`)
    toaster.create({ type: "success", title: "Ticket resolved", description: "Employee notified by email." })
  }

  const handleComment = () => {
    if (!user || !comment.trim()) return
    addComment(ticket.id, { authorEmail: user.email, authorName: user.name, message: comment.trim() })
    const recipient = user.email === ticket.raisedByEmail ? ticket.assignedToEmail : ticket.raisedByEmail
    if (recipient) notify(recipient, `${user.name} commented on "${ticket.title}"`)
    setComment("")
  }

  return (
    <DrawerRoot open onOpenChange={(e) => !e.open && close()} size="md">
      <DrawerContent>
        <DrawerCloseTrigger />
        <DrawerHeader>
          <Stack gap="1">
            <DrawerTitle>{ticket.title}</DrawerTitle>
            <StatusBadge label={ticket.status} tone={ticketStatusTone[ticket.status]} />
          </Stack>
        </DrawerHeader>
        <DrawerBody>
          <Stack gap="4">
            <Text fontSize="sm">{ticket.summary}</Text>
            <HStack gap="6" wrap="wrap">
              <Stack gap="0">
                <Text fontSize="xs" color="fg.muted">
                  Laptop
                </Text>
                <Text fontSize="sm">{laptop ? `${laptop.brand} ${laptop.model}` : "—"}</Text>
              </Stack>
              <Stack gap="0">
                <Text fontSize="xs" color="fg.muted">
                  Raised by
                </Text>
                <Text fontSize="sm">{ticket.raisedByName}</Text>
              </Stack>
              <Stack gap="0">
                <Text fontSize="xs" color="fg.muted">
                  Assignee
                </Text>
                <Text fontSize="sm">{ticket.assignedToName ?? "Unclaimed"}</Text>
              </Stack>
            </HStack>

            {canManage && ticket.status !== "resolved" && (
              <HStack>
                {ticket.status === "open" && (
                  <Button size="sm" colorPalette="orange" onClick={handleClaim}>
                    Claim ticket
                  </Button>
                )}
                {ticket.status === "claimed" && (
                  <Button size="sm" colorPalette="green" onClick={handleResolve}>
                    Resolve ticket
                  </Button>
                )}
              </HStack>
            )}

            <Separator />

            <Stack gap="2">
              <Text fontSize="sm" fontWeight="semibold">
                IT team comments
              </Text>
              {ticket.comments.length === 0 && (
                <Text fontSize="sm" color="fg.muted">
                  No comments yet.
                </Text>
              )}
              {ticket.comments.map((c) => (
                <Box key={c.id} borderWidth="1px" borderColor="border" rounded="md" p="3">
                  <HStack justify="space-between">
                    <Text fontSize="sm" fontWeight="medium">
                      {c.authorName}
                    </Text>
                    <Text fontSize="xs" color="fg.muted">
                      {new Date(c.createdAt).toLocaleString()}
                    </Text>
                  </HStack>
                  <Text fontSize="sm" mt="1">
                    {c.message}
                  </Text>
                </Box>
              ))}
            </Stack>
          </Stack>
        </DrawerBody>
        <DrawerFooter>
          <HStack w="full" gap="2">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              size="sm"
              rows={1}
            />
            <Button size="sm" colorPalette="orange" onClick={handleComment}>
              Send
            </Button>
          </HStack>
        </DrawerFooter>
      </DrawerContent>
    </DrawerRoot>
  )
}
