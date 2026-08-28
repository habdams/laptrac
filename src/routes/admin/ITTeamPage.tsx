import * as React from "react"
import { Box, Button, HStack, Input, Stack, Text } from "@chakra-ui/react"
import { LuTrash2 } from "react-icons/lu"
import { Navigate } from "react-router"
import { useRole } from "../../auth/useRole"
import { useITTeam } from "../../features/admin/ITTeamContext"

export function Component() {
  const role = useRole()
  const { allowlist, addEmail, removeEmail } = useITTeam()
  const [email, setEmail] = React.useState("")

  if (role !== "it") {
    return <Navigate to="/tickets" replace />
  }

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    addEmail(email)
    setEmail("")
  }

  return (
    <Box maxW="lg">
      <Text fontSize="2xl" fontWeight="bold" mb="1">
        IT team
      </Text>
      <Text color="fg.muted" fontSize="sm" mb="6">
        Anyone whose email is on this list sees the IT side of LapTrac (claiming tickets, managing inventory).
      </Text>

      <form onSubmit={handleAdd}>
        <HStack mb="6">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" type="email" />
          <Button type="submit" colorPalette="orange">
            Add
          </Button>
        </HStack>
      </form>

      <Stack gap="2">
        {allowlist.map((e) => (
          <HStack key={e} justify="space-between" borderWidth="1px" borderColor="border" rounded="md" px="4" py="2">
            <Text fontSize="sm">{e}</Text>
            <Button size="xs" variant="ghost" colorPalette="red" onClick={() => removeEmail(e)} aria-label={`Remove ${e}`}>
              <LuTrash2 />
            </Button>
          </HStack>
        ))}
        {allowlist.length === 0 && (
          <Text fontSize="sm" color="fg.muted">
            No IT team members yet.
          </Text>
        )}
      </Stack>
    </Box>
  )
}
