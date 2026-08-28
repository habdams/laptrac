import * as React from "react"
import { Button, HStack, NativeSelect, Stack } from "@chakra-ui/react"
import { Navigate, useNavigate, useParams } from "react-router"
import { useAuth } from "../../auth/AuthContext"
import { mockPersonas } from "../../auth/mockPersonas"
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

export function Component() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { laptops, assignLaptop, unassignLaptop, setLaptopStatus } = useLaptops()
  const { notify } = useNotifications()
  const [assignee, setAssignee] = React.useState("")

  const laptop = laptops.find((l) => l.id === id)
  const close = () => navigate("/laptops")

  if (!laptop) {
    return <Navigate to="/laptops" replace />
  }

  const handleAssign = () => {
    const persona = mockPersonas.find((p) => p.email === assignee)
    if (!persona || !user) return
    assignLaptop(laptop.id, { email: persona.email, name: persona.name }, user.name)
    notify(persona.email, `${laptop.brand} ${laptop.model} (${laptop.serialNumber}) has been assigned to you`)
    toaster.create({ type: "success", title: "Laptop assigned" })
    setAssignee("")
  }

  const handleUnassign = () => {
    if (!user) return
    if (laptop.assignedToEmail) {
      notify(laptop.assignedToEmail, `${laptop.brand} ${laptop.model} has been unassigned from you`)
    }
    unassignLaptop(laptop.id, user.name)
  }

  const handleRepair = () => {
    if (!user) return
    setLaptopStatus(laptop.id, "in-repair", "Sent for repair", user.name)
  }

  const availablePersonas = mockPersonas.filter((p) => p.email !== laptop.assignedToEmail)

  return (
    <DrawerRoot open onOpenChange={(e) => !e.open && close()} size="md">
      <DrawerContent>
        <DrawerCloseTrigger />
        <DrawerHeader>
          <DrawerTitle>
            {laptop.brand} {laptop.model}
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
                  {availablePersonas.map((p) => (
                    <option key={p.email} value={p.email}>
                      {p.name}
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
            </HStack>
          </Stack>
        </DrawerFooter>
      </DrawerContent>
    </DrawerRoot>
  )
}
