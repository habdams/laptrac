import * as React from "react"
import { Box, HStack, Table, Text } from "@chakra-ui/react"
import { Navigate, Outlet, useNavigate, useParams } from "react-router"
import { useRole } from "../../auth/useRole"
import { SearchToolbar } from "../../components/common/SearchToolbar"
import { StatCard } from "../../components/common/StatCard"
import { StatusBadge, laptopStatusTone } from "../../components/common/StatusBadge"
import { useLaptops } from "../../features/laptops/LaptopsContext"

export function Component() {
  const role = useRole()
  const { laptops } = useLaptops()
  const navigate = useNavigate()
  const params = useParams()
  const [search, setSearch] = React.useState("")

  if (role !== "it") {
    return <Navigate to="/tickets" replace />
  }

  const filtered = laptops.filter((l) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      l.assetName.toLowerCase().includes(q) ||
      l.model.toLowerCase().includes(q) ||
      (l.assignedToName ?? "").toLowerCase().includes(q)
    )
  })

  const counts = {
    available: laptops.filter((l) => l.status === "available").length,
    assigned: laptops.filter((l) => l.status === "assigned").length,
    inRepair: laptops.filter((l) => l.status === "in-repair").length,
  }

  return (
    <Box>
      <Box mb="6">
        <Text fontSize="2xl" fontWeight="bold">
          Laptops
        </Text>
        <Text color="fg.muted" fontSize="sm">
          {laptops.length} in inventory
        </Text>
      </Box>

      <HStack gap="4" mb="6" wrap="wrap">
        <StatCard label="Total" value={laptops.length} data={[5, 6, 6, 7, 7, laptops.length]} />
        <StatCard label="Available" value={counts.available} data={[2, 2, 3, 2, 3, counts.available]} />
        <StatCard label="Assigned" value={counts.assigned} data={[3, 3, 4, 4, 4, counts.assigned]} />
        <StatCard label="In repair" value={counts.inRepair} data={[0, 1, 1, 1, 1, counts.inRepair]} />
      </HStack>

      <Box mb="4">
        <SearchToolbar
          placeholder="Search laptops..."
          value={search}
          onChange={setSearch}
          addLabel="Add new machine"
          onAdd={() => navigate("new")}
        />
      </Box>

      <Box borderWidth="1px" borderColor="border" rounded="xl" overflow="hidden">
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Asset name</Table.ColumnHeader>
              <Table.ColumnHeader>Model</Table.ColumnHeader>
              <Table.ColumnHeader>Department</Table.ColumnHeader>
              <Table.ColumnHeader>Assignee</Table.ColumnHeader>
              <Table.ColumnHeader>Status</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filtered.map((laptop) => (
              <Table.Row
                key={laptop.id}
                onClick={() => navigate(laptop.id)}
                cursor="pointer"
                colorPalette={params.id === laptop.id ? "orange" : "gray"}
                bg={params.id === laptop.id ? "colorPalette.subtle" : undefined}
                _hover={{ bg: "bg.muted" }}
              >
                <Table.Cell fontWeight="medium">{laptop.assetName}</Table.Cell>
                <Table.Cell>{laptop.model}</Table.Cell>
                <Table.Cell>{laptop.employeeDepartment || "—"}</Table.Cell>
                <Table.Cell>{laptop.assignedToName ?? "Unassigned"}</Table.Cell>
                <Table.Cell>
                  <StatusBadge label={laptop.status.replace("-", " ")} tone={laptopStatusTone[laptop.status]} />
                </Table.Cell>
              </Table.Row>
            ))}
            {filtered.length === 0 && (
              <Table.Row>
                <Table.Cell colSpan={5}>
                  <Text color="fg.muted" fontSize="sm" py="6" textAlign="center">
                    No laptops found.
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
