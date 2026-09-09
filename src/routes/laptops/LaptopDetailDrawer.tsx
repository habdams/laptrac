import * as React from "react"
import { Button, HStack, NativeSelect, Stack } from "@chakra-ui/react"
import { Navigate, useNavigate, useParams } from "react-router"
import { useAuth } from "../../auth/AuthContext"
import { getErrorMessage } from "../../lib/errors"
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
import { LaptopDetailContent } from "../../features/laptops/LaptopDetailContent"
import { useLaptops } from "../../features/laptops/LaptopsContext"
import { useNotifications } from "../../features/notifications/NotificationsContext"
import { useMembers } from "../../features/users/MembersContext"

export function Component() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { laptops, assignLaptop, unassignLaptop, setLaptopStatus } = useLaptops()
  const { notify } = useNotifications()
  const { users } = useMembers()
  const [assignee, setAssignee] = React.useState("")

  const laptop = laptops.find((l) => l.id === id)
  const close = () => navigate("/laptops")

  if (!laptop) {
    return <Navigate to="/laptops" replace />
  }

  const handleAssign = async () => {
    try {
      const member = users.find((u) => u.id === assignee)
      if (!member || !user || !member.emailAddress) return
      const name = member.fullName ?? member.emailAddress
      await assignLaptop(laptop.id, { id: member.id, email: member.emailAddress, name }, user.name)
      notify(member.emailAddress, `${laptop.assetName} ${laptop.model} has been assigned to you`)
      toaster.create({ type: "success", title: "Laptop assigned" })
      setAssignee("")
    } catch (err) {
      toaster.create({ type: "error", title: "Couldn't assign laptop", description: getErrorMessage(err) })
    }
  }

  const handleUnassign = async () => {
    try {
      if (!user) return
      const assignedToEmail = laptop.assignedToEmail
      await unassignLaptop(laptop.id, user.name)
      if (assignedToEmail) {
        notify(assignedToEmail, `${laptop.assetName} ${laptop.model} has been unassigned from you`)
      }
      toaster.create({ type: "success", title: "Laptop unassigned" })
    } catch (err) {
      toaster.create({ type: "error", title: "Couldn't unassign laptop", description: getErrorMessage(err) })
    }
  }

  const handleRepair = async () => {
    try {
      if (!user) return
      await setLaptopStatus(laptop.id, "in-repair", "Sent for repair", user.name)
      toaster.create({ type: "success", title: "Laptop sent for repair" })
    } catch (err) {
      toaster.create({ type: "error", title: "Couldn't send laptop for repair", description: getErrorMessage(err) })
    }
  }

  const handleRetire = async () => {
    try {
      if (!user) return
      await setLaptopStatus(laptop.id, "retired", "Retired", user.name)
      toaster.create({ type: "success", title: "Laptop retired" })
    } catch (err) {
      toaster.create({ type: "error", title: "Couldn't retire laptop", description: getErrorMessage(err) })
    }
  }

  const availableMembers = users.filter((u) => u.emailAddress !== laptop.assignedToEmail)

  return (
    <DrawerRoot open onOpenChange={(e) => !e.open && close()} size="md">
      <DrawerContent>
        <DrawerCloseTrigger />
        <DrawerHeader>
          <DrawerTitle>
            {laptop.assetName} {laptop.model}
          </DrawerTitle>
        </DrawerHeader>
        <DrawerBody>
          <LaptopDetailContent laptop={laptop} />
        </DrawerBody>
        <DrawerFooter>
          <Stack w="full" gap="3">
            <HStack>
              <NativeSelect.Root size="sm" flex="1">
                <NativeSelect.Field value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                  <option value="">Assign to...</option>
                  {availableMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName ?? m.emailAddress ?? m.id}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
              <Button size="sm" colorPalette="orange" disabled={!assignee} onClick={handleAssign}>
                Assign
              </Button>
            </HStack>
            <HStack>
              {laptop.assignedToEmail && (
                <Button size="sm" variant="outline" onClick={handleUnassign}>
                  Unassign
                </Button>
              )}
              {laptop.status !== "in-repair" && laptop.status !== "retired" && (
                <Button size="sm" variant="outline" onClick={handleRepair}>
                  Send for repair
                </Button>
              )}
              {laptop.status !== "retired" && (
                <Button size="sm" variant="outline" onClick={handleRetire}>
                  Retire
                </Button>
              )}
            </HStack>
          </Stack>
        </DrawerFooter>
      </DrawerContent>
    </DrawerRoot>
  )
}
