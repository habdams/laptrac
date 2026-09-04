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
import { useNotifications } from "../../features/notifications/NotificationsContext"
import { useTickets } from "../../features/tickets/TicketsContext"
import { useMembers } from "../../features/users/MembersContext"
import { getErrorMessage } from "../../lib/errors"

export function Component() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { createTicket } = useTickets()
  const { notify } = useNotifications()
  const { users } = useMembers()

  // The signed-in user's own laptop, sourced from /api/users/current-user — not the full
  // /api/laptops inventory, which is IT-only and never fetched for non-IT users.
  const myLaptop = user?.laptop ?? null

  const [title, setTitle] = React.useState("")
  const [summary, setSummary] = React.useState("")
  const [laptopId, setLaptopId] = React.useState(myLaptop && user ? user.id : "")
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

      // `users` is only populated for IT (see MembersContext) — for an employee-filed ticket
      // this is an empty array, so the fan-out below is a no-op until the backend exposes a
      // narrower "IT members" endpoint that doesn't require the full directory.
      users
        .filter((u) => u.roles === 1 && u.emailAddress)
        .forEach((u) => notify(u.emailAddress!, `${user.name} raised a new ticket: "${ticket.title}"`))
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
              {myLaptop && user && (
                <Field.Root>
                  <Field.Label>Laptop</Field.Label>
                  <NativeSelect.Root>
                    <NativeSelect.Field value={laptopId} onChange={(e) => setLaptopId(e.target.value)}>
                      <option value={user.id}>
                        {myLaptop.assetName} {myLaptop.model}
                      </option>
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
