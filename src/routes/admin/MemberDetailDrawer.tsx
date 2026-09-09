import { Badge, HStack, Separator, Stack, Text } from "@chakra-ui/react"
import {
  DrawerBody,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerRoot,
  DrawerTitle,
} from "../../components/ui/drawer"
import { roleLabel, type User } from "../../features/users/types"
import type { Laptop } from "../../features/laptops/types"

export function MemberDetailDrawer({
  user,
  laptop,
  open,
  onClose,
}: {
  user: User | null
  laptop?: Laptop
  open: boolean
  onClose: () => void
}) {
  if (!user) return null
  const laptops = user.userLaptops ?? []

  return (
    <DrawerRoot open={open} onOpenChange={(event) => !event.open && onClose()} size="md">
      <DrawerContent>
        <DrawerCloseTrigger />
        <DrawerHeader>
          <DrawerTitle>{user.fullName ?? "Member details"}</DrawerTitle>
        </DrawerHeader>
        <DrawerBody>
          <Stack gap="5">
            <Stack gap="1">
              <Text fontSize="xs" color="fg.muted" textTransform="uppercase">
                Email
              </Text>
              <Text>{user.emailAddress ?? "—"}</Text>
            </Stack>
            <HStack gap="8">
              <Stack gap="1">
                <Text fontSize="xs" color="fg.muted" textTransform="uppercase">
                  Role
                </Text>
                <Text>{roleLabel(user.role)}</Text>
              </Stack>
              <Stack gap="1">
                <Text fontSize="xs" color="fg.muted" textTransform="uppercase">
                  Status
                </Text>
                <Text>{user.isActive ? "Active" : "Inactive"}</Text>
              </Stack>
            </HStack>

            <Separator />

            <Stack gap="3">
              <Text fontSize="sm" fontWeight="semibold">
                Laptop details
              </Text>
              {laptops.length === 0 && (
                <Text fontSize="sm" color="fg.muted">
                  {laptop ? "Laptop details loaded from inventory." : "No laptop details available."}
                </Text>
              )}
              {laptops.length === 0 && laptop && (
                <Stack gap="1" borderWidth="1px" borderColor="border" rounded="md" p="3">
                  <Text fontWeight="medium">{laptop.assetName} {laptop.model}</Text>
                  <Text fontSize="sm" color="fg.muted">
                    {laptop.assetLocation || "Location unavailable"} · {laptop.employeeDepartment || "Department unavailable"}
                  </Text>
                  <Text fontSize="sm">{laptop.comment || "No laptop comment."}</Text>
                  <Text fontSize="xs" color="fg.muted">History</Text>
                  {laptop.history.length === 0 ? (
                    <Text fontSize="sm" color="fg.muted">No history yet.</Text>
                  ) : (
                    laptop.history.map((entry) => (
                      <HStack key={entry.id} justify="space-between">
                        <Badge variant="subtle">{entry.type}</Badge>
                        <Text fontSize="xs" color="fg.muted">{entry.note}</Text>
                      </HStack>
                    ))
                  )}
                </Stack>
              )}
              {laptops.map((laptop) => (
                <Stack key={laptop.id} gap="1" borderWidth="1px" borderColor="border" rounded="md" p="3">
                  <Text fontWeight="medium">
                    {laptop.assetName} {laptop.model}
                  </Text>
                  <Text fontSize="sm" color="fg.muted">
                    {laptop.assetLocation || "Location unavailable"} · {laptop.employeeDepartment || "Department unavailable"}
                  </Text>
                  <Text fontSize="sm">{laptop.comment || "No laptop comment."}</Text>
                  <Text fontSize="xs" color="fg.muted">
                    History
                  </Text>
                  {(laptop.laptopHistories ?? []).length === 0 ? (
                    <Text fontSize="sm" color="fg.muted">
                      No history yet.
                    </Text>
                  ) : (
                    laptop.laptopHistories?.map((entry) => (
                      <HStack key={entry.id} justify="space-between">
                        <Badge variant="subtle">{entry.type}</Badge>
                        <Text fontSize="xs" color="fg.muted">
                          {entry.note}
                        </Text>
                      </HStack>
                    ))
                  )}
                </Stack>
              ))}
            </Stack>
          </Stack>
        </DrawerBody>
      </DrawerContent>
    </DrawerRoot>
  )
}
