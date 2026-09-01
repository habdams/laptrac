import * as React from "react"
import { Box, HStack, Table, Tabs, Text } from "@chakra-ui/react"
import { Outlet, useNavigate, useParams } from "react-router"
import { useAuth } from "../../auth/AuthContext"
import { useRole } from "../../auth/useRole"
import { SearchToolbar } from "../../components/common/SearchToolbar"
import { StatCard } from "../../components/common/StatCard"
import { StatusBadge, ticketStatusTone } from "../../components/common/StatusBadge"
import { useLaptops } from "../../features/laptops/LaptopsContext"
import { useTickets } from "../../features/tickets/TicketsContext"

export function Component() {
  const { user } = useAuth()
  const role = useRole()
  const { tickets } = useTickets()
  const { laptops } = useLaptops()
  const navigate = useNavigate()
  const params = useParams()
  const [tab, setTab] = React.useState("all")
  const [search, setSearch] = React.useState("")

  const scoped = role === "it" ? tickets : tickets.filter((t) => t.raisedByEmail === user?.email)

  const filtered = scoped.filter((t) => {
    if (tab === "open" && t.status !== "open") return false
    if (tab === "claimed" && t.status !== "claimed") return false
    if (tab === "resolved" && t.status !== "resolved") return false
    if (tab === "mine" && t.assignedToEmail !== user?.email) return false
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const counts = {
    open: scoped.filter((t) => t.status === "open").length,
    claimed: scoped.filter((t) => t.status === "claimed").length,
    resolved: scoped.filter((t) => t.status === "resolved").length,
  }

  const laptopLabel = (laptopId: string | null) => {
    const laptop = laptops.find((l) => l.id === laptopId)
    return laptop ? `${laptop.assetName} ${laptop.model}` : "—"
  }

  return (
    <Box>
      <Box mb="6">
        <Text fontSize="2xl" fontWeight="bold">
          Tickets
        </Text>
        <Text color="fg.muted" fontSize="sm">
          {scoped.length} total
        </Text>
      </Box>

      <HStack gap="4" mb="6" wrap="wrap">
        <StatCard label="Open" value={counts.open} data={[2, 3, 2, 4, 3, counts.open]} />
        <StatCard label="Claimed" value={counts.claimed} data={[1, 2, 1, 2, 3, counts.claimed]} />
        <StatCard label="Resolved" value={counts.resolved} data={[3, 4, 5, 4, 6, counts.resolved]} />
        <StatCard label="Total" value={scoped.length} data={[4, 6, 5, 7, 6, scoped.length]} />
      </HStack>

      <Tabs.Root value={tab} onValueChange={(e) => setTab(e.value)} mb="4" colorPalette="orange">
        <Tabs.List>
          <Tabs.Trigger value="all">All</Tabs.Trigger>
          <Tabs.Trigger value="open">Open</Tabs.Trigger>
          <Tabs.Trigger value="claimed">Claimed</Tabs.Trigger>
          <Tabs.Trigger value="resolved">Resolved</Tabs.Trigger>
          {role === "it" && <Tabs.Trigger value="mine">Assigned to me</Tabs.Trigger>}
        </Tabs.List>
      </Tabs.Root>

      <Box mb="4">
        <SearchToolbar
          placeholder="Search tickets..."
          value={search}
          onChange={setSearch}
          addLabel="New ticket"
          onAdd={() => navigate("new")}
        />
      </Box>

      <Box borderWidth="1px" borderColor="border" rounded="xl" overflow="hidden">
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Ticket</Table.ColumnHeader>
              <Table.ColumnHeader>Laptop</Table.ColumnHeader>
              <Table.ColumnHeader>Status</Table.ColumnHeader>
              <Table.ColumnHeader>Raised by</Table.ColumnHeader>
              <Table.ColumnHeader>Assignee</Table.ColumnHeader>
              <Table.ColumnHeader>Created</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filtered.map((ticket) => (
              <Table.Row
                key={ticket.id}
                onClick={() => navigate(ticket.id)}
                cursor="pointer"
                colorPalette={params.id === ticket.id ? "orange" : "gray"}
                bg={params.id === ticket.id ? "colorPalette.subtle" : undefined}
                _hover={{ bg: "bg.muted" }}
              >
                <Table.Cell fontWeight="medium">{ticket.title}</Table.Cell>
                <Table.Cell>{laptopLabel(ticket.laptopId)}</Table.Cell>
                <Table.Cell>
                  <StatusBadge label={ticket.status} tone={ticketStatusTone[ticket.status]} />
                </Table.Cell>
                <Table.Cell>{ticket.raisedByName}</Table.Cell>
                <Table.Cell>{ticket.assignedToName ?? "Unclaimed"}</Table.Cell>
                <Table.Cell>{new Date(ticket.createdAt).toLocaleDateString()}</Table.Cell>
              </Table.Row>
            ))}
            {filtered.length === 0 && (
              <Table.Row>
                <Table.Cell colSpan={6}>
                  <Text color="fg.muted" fontSize="sm" py="6" textAlign="center">
                    No tickets found.
                  </Text>
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      </Box>

      <Outlet />
    </Box>
  )
}
