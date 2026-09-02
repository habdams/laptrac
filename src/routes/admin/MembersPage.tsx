import * as React from "react"
import { Box, Button, HStack, Input, Spinner, Table, Text } from "@chakra-ui/react"
import { Navigate } from "react-router"
import { useRole } from "../../auth/useRole"
import { toaster } from "../../components/ui/toaster"
import { useMembers } from "../../features/users/MembersContext"
import { getErrorMessage } from "../../lib/errors"
import { roleLabel, type User } from "../../features/users/types"

export function Component() {
  const role = useRole()
  const { users, status, error, createMember, updateMember } = useMembers()
  const [email, setEmail] = React.useState("")
  const [firstName, setFirstName] = React.useState("")
  const [lastName, setLastName] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)

  if (role !== "it") {
    return <Navigate to="/tickets" replace />
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !firstName.trim() || !lastName.trim()) return
    setSubmitting(true)
    try {
      await createMember({ email: email.trim(), firstName: firstName.trim(), lastName: lastName.trim() })
      toaster.create({ type: "success", title: "Member added" })
      setEmail("")
      setFirstName("")
      setLastName("")
    } catch (err) {
      toaster.create({ type: "error", title: "Couldn't add member", description: getErrorMessage(err) })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box maxW="3xl">
      <Text fontSize="2xl" fontWeight="bold" mb="1">
        Members
      </Text>
      <Text color="fg.muted" fontSize="sm" mb="6">
        The directory of people who can be assigned laptops and tickets, backed by the real user API.
      </Text>

      <form onSubmit={handleAdd}>
        <HStack mb="6" wrap="wrap">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" type="email" flex="1" minW="48" />
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" flex="1" minW="32" />
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" flex="1" minW="32" />
          <Button type="submit" colorPalette="orange" loading={submitting}>
            Add
          </Button>
        </HStack>
      </form>

      {status === "loading" && (
        <HStack py="6" justify="center">
          <Spinner size="sm" />
        </HStack>
      )}

      {status === "error" && (
        <Text color="fg.error" fontSize="sm" mb="4">
          {error}
        </Text>
      )}

      {status === "loaded" && (
        <Box borderWidth="1px" borderColor="border" rounded="xl" overflow="hidden">
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Name</Table.ColumnHeader>
                <Table.ColumnHeader>Email</Table.ColumnHeader>
                <Table.ColumnHeader>Roles</Table.ColumnHeader>
                <Table.ColumnHeader>Active</Table.ColumnHeader>
                <Table.ColumnHeader></Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {users.map((u) => (
                <MemberRow
                  key={u.id}
                  user={u}
                  editing={editingId === u.id}
                  onEdit={() => setEditingId(u.id)}
                  onCancel={() => setEditingId(null)}
                  onSave={async (input) => {
                    try {
                      await updateMember(u.id, input)
                      toaster.create({ type: "success", title: "Member updated" })
                      setEditingId(null)
                    } catch (err) {
                      toaster.create({ type: "error", title: "Couldn't update member", description: getErrorMessage(err) })
                    }
                  }}
                  onToggleRole={async () => {
                    try {
                      const role = u.roles.includes(1) ? u.roles.filter((r) => r !== 1) : [...u.roles, 1]
                      await updateMember(u.id, {
                        email: u.emailAddress ?? "",
                        firstName: u.firstName ?? "",
                        lastName: u.lastName ?? "",
                        role,
                      })
                      toaster.create({ type: "success", title: u.roles.includes(1) ? "IT access revoked" : "Made IT member" })
                    } catch (err) {
                      toaster.create({ type: "error", title: "Couldn't update role", description: getErrorMessage(err) })
                    }
                  }}
                />
              ))}
              {users.length === 0 && (
                <Table.Row>
                  <Table.Cell colSpan={5}>
                    <Text color="fg.muted" fontSize="sm" py="6" textAlign="center">
                      No members yet.
                    </Text>
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Root>
        </Box>
      )}
    </Box>
  )
}

function MemberRow({
  user,
  editing,
  onEdit,
  onCancel,
  onSave,
  onToggleRole,
}: {
  user: User
  editing: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: (input: { email: string; firstName: string; lastName: string }) => Promise<void>
  onToggleRole: () => Promise<void>
}) {
  const [email, setEmail] = React.useState(user.emailAddress ?? "")
  const [firstName, setFirstName] = React.useState(user.firstName ?? "")
  const [lastName, setLastName] = React.useState(user.lastName ?? "")
  const [saving, setSaving] = React.useState(false)
  const [togglingRole, setTogglingRole] = React.useState(false)
  const isIT = user.roles.includes(1)

  if (editing) {
    return (
      <Table.Row>
        <Table.Cell>
          <HStack>
            <Input size="sm" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
            <Input size="sm" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
          </HStack>
        </Table.Cell>
        <Table.Cell>
          <Input size="sm" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
        </Table.Cell>
        <Table.Cell>{user.roles.map(roleLabel).join(", ") || "—"}</Table.Cell>
        <Table.Cell>{user.isActive ? "Yes" : "No"}</Table.Cell>
        <Table.Cell>
          <HStack justify="flex-end">
            <Button size="xs" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              size="xs"
              colorPalette="orange"
              loading={saving}
              onClick={async () => {
                setSaving(true)
                await onSave({ email: email.trim(), firstName: firstName.trim(), lastName: lastName.trim() })
                setSaving(false)
              }}
            >
              Save
            </Button>
          </HStack>
        </Table.Cell>
      </Table.Row>
    )
  }

  return (
    <Table.Row>
      <Table.Cell fontWeight="medium">{user.fullName ?? (`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "—")}</Table.Cell>
      <Table.Cell>{user.emailAddress ?? "—"}</Table.Cell>
      <Table.Cell>{user.roles.map(roleLabel).join(", ") || "—"}</Table.Cell>
      <Table.Cell>{user.isActive ? "Yes" : "No"}</Table.Cell>
      <Table.Cell>
        <HStack justify="flex-end">
          <Button
            size="xs"
            variant="ghost"
            colorPalette={isIT ? "red" : "orange"}
            loading={togglingRole}
            onClick={async () => {
              setTogglingRole(true)
              await onToggleRole()
              setTogglingRole(false)
            }}
          >
            {isIT ? "Revoke IT" : "Make IT"}
          </Button>
          <Button size="xs" variant="ghost" onClick={onEdit}>
            Edit
          </Button>
        </HStack>
      </Table.Cell>
    </Table.Row>
  )
}
