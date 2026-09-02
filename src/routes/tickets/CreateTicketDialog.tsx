import * as React from "react"
import { Button, Field, Input, NativeSelect, Stack, Textarea } from "@chakra-ui/react"
import { useNavigate } from "react-router"
import { useAuth } from "../../auth/AuthContext"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "../../components/ui/dialog"
import { toaster } from "../../components/ui/toaster"
import { useITTeam } from "../../features/admin/ITTeamContext"
import { useLaptops } from "../../features/laptops/LaptopsContext"
import { useNotifications } from "../../features/notifications/NotificationsContext"
import { useTickets } from "../../features/tickets/TicketsContext"
import { getErrorMessage } from "../../lib/errors"

export function Component() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { laptops } = useLaptops()
  const { createTicket } = useTickets()
  const { notify } = useNotifications()
  const { allowlist } = useITTeam()

  const myLaptops = laptops.filter((l) => l.assignedToEmail === user?.email)

  const [title, setTitle] = React.useState("")
  const [summary, setSummary] = React.useState("")
  const [laptopId, setLaptopId] = React.useState(myLaptops[0]?.id ?? "")
  const [submitting, setSubmitting] = React.useState(false)

  const close = () => navigate("/tickets")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !title.trim() || !summary.trim()) return

    setSubmitting(true)
    try {
      const ticket = await createTicket({
        title: title.trim(),
        summary: summary.trim(),
        laptopId: laptopId || null,
        raisedByEmail: user.email,
        raisedByName: user.name,
      })

      allowlist.forEach((email) => notify(email, `${user.name} raised a new ticket: "${ticket.title}"`))
      toaster.create({ type: "success", title: "Ticket submitted", description: "IT has been notified by email." })
      navigate(`/tickets/${ticket.id}`)
    } catch (err) {
      toaster.create({ type: "error", title: "Couldn't submit ticket", description: getErrorMessage(err) })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DialogRoot open onOpenChange={(e) => !e.open && close()}>
      <DialogContent>
        <DialogCloseTrigger />
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create new ticket</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Stack gap="4">
              <Field.Root required>
                <Field.Label>Summary</Field.Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Trackpad not clicking"
                />
              </Field.Root>
              <Field.Root required>
                <Field.Label>Details</Field.Label>
                <Textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Describe the issue..."
                  rows={4}
                />
              </Field.Root>
              {myLaptops.length > 0 && (
                <Field.Root>
                  <Field.Label>Laptop</Field.Label>
                  <NativeSelect.Root>
                    <NativeSelect.Field value={laptopId} onChange={(e) => setLaptopId(e.target.value)}>
                      {myLaptops.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.assetName} {l.model}
                        </option>
                      ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                </Field.Root>
              )}
            </Stack>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={close} type="button">
              Cancel
            </Button>
            <Button colorPalette="orange" type="submit" loading={submitting}>
              Submit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}
