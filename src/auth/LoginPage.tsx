import { Box, Button, Heading, Stack, Text } from "@chakra-ui/react"
import { Navigate, useNavigate } from "react-router"
import { Avatar } from "../components/ui/avatar"
import { useAuth } from "./AuthContext"
import { mockPersonas } from "./mockPersonas"

export function Component() {
  const { status, login } = useAuth()
  const navigate = useNavigate()

  if (status === "authenticated") {
    return <Navigate to="/tickets" replace />
  }

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="bg.subtle" p="4">
      <Box maxW="sm" w="full" borderWidth="1px" borderColor="border" rounded="xl" p="8" bg="bg.panel">
        <Stack gap="1" mb="6" textAlign="center">
          <Heading size="lg">LapTrac</Heading>
          <Text color="fg.muted" fontSize="sm">
            Sign in with your organization SSO (mocked for this demo)
          </Text>
        </Stack>
        <Stack gap="2">
          {mockPersonas.map((persona) => (
            <Button
              key={persona.sub}
              variant="outline"
              justifyContent="flex-start"
              h="auto"
              py="2"
              onClick={() => {
                login(persona)
                navigate("/tickets")
              }}
            >
              <Avatar name={persona.name} size="sm" mr="3" />
              <Stack gap="0" align="flex-start">
                <Text fontWeight="medium">{persona.name}</Text>
                <Text fontSize="xs" color="fg.muted">
                  {persona.email}
                </Text>
              </Stack>
            </Button>
          ))}
        </Stack>
      </Box>
    </Box>
  )
}
