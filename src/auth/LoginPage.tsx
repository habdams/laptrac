import { Box, Button, Heading, Stack, Text } from "@chakra-ui/react"
import { Navigate } from "react-router"
import { useAuth } from "./AuthContext"

export function Component() {
  const { status, login } = useAuth()

  if (status === "authenticated") {
    return <Navigate to="/tickets" replace />
  }

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="bg.subtle" p="4">
      <Box maxW="sm" w="full" borderWidth="1px" borderColor="border" rounded="xl" p="8" bg="bg.panel" textAlign="center">
        <Stack gap="1" mb="6">
          <Heading size="lg">LapTrac</Heading>
          <Text color="fg.muted" fontSize="sm">
            Sign in with your organization SSO
          </Text>
        </Stack>
        <Button colorPalette="orange" w="full" loading={status === "loading"} onClick={() => login()}>
          Sign in
        </Button>
      </Box>
    </Box>
  )
}
