import * as React from "react"
import { Box, Button, HStack, Input, Spinner, Table, Text } from "@chakra-ui/react"
import { Navigate } from "react-router"
import { useRole } from "../../auth/useRole"
import { SearchToolbar } from "../../components/common/SearchToolbar"
import { toaster } from "../../components/ui/toaster"
import { useMembers } from "../../features/users/MembersContext"
import { useLaptops } from "../../features/laptops/LaptopsContext"
import { getErrorMessage } from "../../lib/errors"
import { roleLabel, type User } from "../../features/users/types"
import { MemberDetailDrawer } from "./MemberDetailDrawer"

export function Component() {
  const role = useRole()
  const {
    users,
    status,
    error,
    pageIndex,
    totalPages,
    hasPreviousPage,
    hasNextPage,
    search,
    setSearch,
    goToPage,
    createMember,
    updateMember,
  } = useMembers()
  const { laptops } = useLaptops()
  const [email, setEmail] = React.useState("")
  const [firstName, setFirstName] = React.useState("")
  const [lastName, setLastName] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null)

  if (role !== "it") return <Navigate to="/tickets" replace />

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault()
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

  const handleRoleToggle = async (event: React.MouseEvent, user: User) => {
    event.stopPropagation()
    try {
      const isIT = user.role === 1
      await updateMember(user.id, isIT ? 0 : 1)
      toaster.create({ type: "success", title: isIT ? "IT access revoked" : "Made IT member" })
    } catch (err) {
      toaster.create({ type: "error", title: "Couldn't update role", description: getErrorMessage(err) })
    }
  }

  return (
    <Box>
      <Box mb="6">
        <Text fontSize="2xl" fontWeight="bold" mb="1">
          Members
        </Text>
        <Text color="fg.muted" fontSize="sm">
          The directory of people who can be assigned laptops and tickets.
        </Text>
      </Box>

      <form onSubmit={handleAdd}>
        <HStack mb="6" wrap="wrap">
          <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" type="email" flex="1" minW="48" />
          <Input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="First name" flex="1" minW="32" />
          <Input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Last name" flex="1" minW="32" />
          <Button type="submit" colorPalette="orange" loading={submitting}>
            Add
          </Button>
        </HStack>
      </form>

      <Box mb="4">
        <SearchToolbar placeholder="Search members..." value={search} onChange={setSearch} />
      </Box>

      {status === "loading" && (
        <HStack py="6" justify="center">
          <Spinner size="sm" />
        </HStack>
      )}
      {status === "error" && <Text color="fg.error" fontSize="sm" mb="4">{error}</Text>}

      {status === "loaded" && (
        <>
          <Box borderWidth="1px" borderColor="border" rounded="xl" overflow="hidden">
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Name</Table.ColumnHeader>
                  <Table.ColumnHeader>Email</Table.ColumnHeader>
                  <Table.ColumnHeader>Role</Table.ColumnHeader>
                  <Table.ColumnHeader>Active</Table.ColumnHeader>
                  <Table.ColumnHeader>Actions</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {users.map((user) => (
                  <Table.Row key={user.id} cursor="pointer" _hover={{ bg: "bg.muted" }} onClick={() => setSelectedUser(user)}>
                    <Table.Cell fontWeight="medium">{user.fullName ?? (`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "—")}</Table.Cell>
                    <Table.Cell>{user.emailAddress ?? "—"}</Table.Cell>
                    <Table.Cell>{roleLabel(user.role)}</Table.Cell>
                    <Table.Cell>{user.isActive ? "Yes" : "No"}</Table.Cell>
                    <Table.Cell>
                      <Button size="xs" variant="ghost" colorPalette={user.role === 1 ? "red" : "orange"} onClick={(event) => handleRoleToggle(event, user)}>
                        {user.role === 1 ? "Revoke IT" : "Make IT"}
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
                {users.length === 0 && (
                  <Table.Row>
                    <Table.Cell colSpan={5}><Text color="fg.muted" fontSize="sm" py="6" textAlign="center">No members found.</Text></Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Root>
          </Box>
          <HStack justify="space-between" mt="4">
            <Text fontSize="sm" color="fg.muted">Page {pageIndex} of {totalPages}</Text>
            <HStack>
              <Button size="sm" variant="outline" disabled={!hasPreviousPage} onClick={() => goToPage(pageIndex - 1)}>Previous</Button>
              <Button size="sm" variant="outline" disabled={!hasNextPage} onClick={() => goToPage(pageIndex + 1)}>Next</Button>
            </HStack>
          </HStack>
        </>
      )}

      <MemberDetailDrawer
        user={selectedUser}
        laptop={selectedUser ? laptops.find((laptop) => laptop.assignedToUserId === selectedUser.id) : undefined}
        open={selectedUser !== null}
        onClose={() => setSelectedUser(null)}
      />
    </Box>
  )
}
