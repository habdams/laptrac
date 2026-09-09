import { HStack, Separator, Stack, Text } from "@chakra-ui/react"
import {
  DrawerBody,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerRoot,
  DrawerTitle,
} from "../../components/ui/drawer"
import { roleLabel, type User } from "../../features/users/types"
import { laptopHistoryFromRemote, type Laptop } from "../../features/laptops/types"
import { LaptopHistoryTimeline } from "../../features/laptops/LaptopHistoryTimeline"
import { useRole } from "../../auth/useRole"

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
  const role = useRole()
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
                  <Text fontSize="sm">
                    Amount: {laptop.currency ?? "NGN"} {laptop.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Text>
                  {laptop.receiptUrl && (
                    <a href={laptop.receiptUrl} target="_blank" rel="noreferrer">View receipt</a>
                  )}
                  {role === "it" && (
                    <>
                      <Text fontSize="xs" color="fg.muted">History</Text>
                      <LaptopHistoryTimeline entries={laptop.history} />
                    </>
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
                  {role === "it" && (
                    <>
                      <Text fontSize="xs" color="fg.muted">
                        History
                      </Text>
                      <LaptopHistoryTimeline
                        entries={(laptop.laptopHistories ?? []).map(laptopHistoryFromRemote)}
                      />
                    </>
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
