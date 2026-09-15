import * as React from "react";
import { Box, Button, HStack, Table, Text } from "@chakra-ui/react";
import { Navigate, Outlet, useNavigate, useParams } from "react-router";
import { useRole } from "../../auth/useRole";
import { SearchToolbar } from "../../components/common/SearchToolbar";
import { StatCard } from "../../components/common/StatCard";
import {
  StatusBadge,
  laptopStatusTone,
} from "../../components/common/StatusBadge";
import { useLaptops } from "../../features/laptops/LaptopsContext";

export function Component() {
  const role = useRole();
  const {
    laptops,
    metrics,
    pageIndex,
    totalPages,
    hasPreviousPage,
    hasNextPage,
    goToPage,
    search: submittedSearch,
    setSearch: submitSearch,
  } = useLaptops();
  const navigate = useNavigate();
  const params = useParams();
  const [search, setSearch] = React.useState(submittedSearch);

  if (role !== "it") {
    return <Navigate to="/tickets" replace />;
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
        <StatCard
          label="Total"
          value={metrics.total}
          data={[5, 6, 6, 7, 7, metrics.total]}
        />
        <StatCard
          label="Available"
          value={metrics.available}
          data={[2, 2, 3, 2, 3, metrics.available]}
        />
        <StatCard
          label="Assigned"
          value={metrics.assigned}
          data={[3, 3, 4, 4, 4, metrics.assigned]}
        />
        <StatCard
          label="In repair"
          value={metrics.inRepair}
          data={[0, 1, 1, 1, 1, metrics.inRepair]}
        />
      </HStack>

      <Box mb="4">
        <SearchToolbar
          placeholder="Search laptops..."
          value={search}
          onChange={setSearch}
          onSubmit={() => void submitSearch(search)}
          onClear={() => {
            setSearch("")
            void submitSearch("")
          }}
          addLabel="Add new machine"
          onAdd={() => navigate("new")}
        />
      </Box>

      <Box
        borderWidth="1px"
        borderColor="border"
        rounded="xl"
        overflow="hidden"
      >
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Laptop number</Table.ColumnHeader>
              <Table.ColumnHeader>Asset name</Table.ColumnHeader>
              <Table.ColumnHeader>Model</Table.ColumnHeader>
              <Table.ColumnHeader>Department</Table.ColumnHeader>
              <Table.ColumnHeader>Assignee</Table.ColumnHeader>
              <Table.ColumnHeader>Status</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {laptops.map((laptop) => (
              <Table.Row
                key={laptop.id}
                onClick={() => navigate(laptop.id)}
                cursor="pointer"
                colorPalette={params.id === laptop.id ? "brand" : "gray"}
                bg={params.id === laptop.id ? "colorPalette.subtle" : undefined}
                _hover={{ bg: "bg.muted" }}
              >
                <Table.Cell fontWeight="medium">{laptop.laptopNumber || "—"}</Table.Cell>
                <Table.Cell>{laptop.assetName}</Table.Cell>
                <Table.Cell>{laptop.model}</Table.Cell>
                <Table.Cell>{laptop.employeeDepartment || "—"}</Table.Cell>
                <Table.Cell>{laptop.assignedToName ?? "-"}</Table.Cell>
                <Table.Cell>
                  <StatusBadge
                    label={laptop.status.replace("-", " ")}
                    tone={laptopStatusTone[laptop.status]}
                  />

                  {!laptop.assignedToName ? (
                    <StatusBadge label="Unassigned" tone="green" />
                  ) : (
                    <></>
                  )}
                </Table.Cell>
              </Table.Row>
            ))}
            {laptops.length === 0 && (
              <Table.Row>
                <Table.Cell colSpan={6}>
                  <Text
                    color="fg.muted"
                    fontSize="sm"
                    py="6"
                    textAlign="center"
                  >
                    No laptops found.
                  </Text>
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      </Box>

      <HStack justify="space-between" mt="4">
        <Text fontSize="sm" color="fg.muted">
          Page {pageIndex} of {totalPages}
        </Text>
        <HStack>
          <Button
            size="sm"
            variant="outline"
            disabled={!hasPreviousPage}
            onClick={() => void goToPage(pageIndex - 1)}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!hasNextPage}
            onClick={() => void goToPage(pageIndex + 1)}
          >
            Next
          </Button>
        </HStack>
      </HStack>

      <Outlet />
    </Box>
  );
}
