import * as React from "react"
import { Center, Spinner, Stack, Text } from "@chakra-ui/react"
import { useNavigate } from "react-router"
import { userManager } from "../../auth/oidcConfig"

export function Component() {
  const navigate = useNavigate()
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    userManager
      .signinRedirectCallback()
      .then(() => navigate("/tickets", { replace: true }))
      .catch((err: Error) => setError(err.message))
  }, [navigate])

  return (
    <Center minH="100vh">
      <Stack align="center" gap="3">
        {error ? (
          <Text color="fg.error">Sign-in failed: {error}</Text>
        ) : (
          <>
            <Spinner />
            <Text color="fg.muted" fontSize="sm">
              Signing you in...
            </Text>
          </>
        )}
      </Stack>
    </Center>
  )
}
