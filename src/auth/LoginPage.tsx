import { Box, Button, Flex, Image, Stack, Text } from "@chakra-ui/react"
import { Navigate } from "react-router"
import logoFullWhite from "../assets/logo-full-white.svg"
import { useAuth } from "./AuthContext"

export function Component() {
  const { status, login } = useAuth()

  if (status === "authenticated") {
    return <Navigate to="/tickets" replace />
  }

  return (
    <Flex minH="100vh" bg="#0B0B0D">
      <Flex
        direction="column"
        justify="space-between"
        w={{ base: "100%", md: "440px" }}
        flexShrink={0}
        px={{ base: "6", md: "12" }}
        py={{ base: "10", md: "14" }}
        borderRightWidth={{ md: "1px" }}
        borderColor="whiteAlpha.100"
      >
        <Image src={logoFullWhite} alt="LapTrac" h="12" fit="contain" alignSelf="flex-start" />

        <Stack gap="8" maxW="360px">
          <Stack gap="3">
            <Text fontSize={{ base: "3xl", md: "4xl" }} fontWeight="bold" color="white" lineHeight="1.15" letterSpacing="-0.02em">
              Every laptop tracked. Every ticket handled.
            </Text>
            <Text color="whiteAlpha.600" fontSize="sm">
              Sign in with your organization's identity provider to view tickets, laptops, and handoffs in one place.
            </Text>
          </Stack>

          <Stack gap="3">
            <Button colorPalette="brand" size="lg" w="full" loading={status === "loading"} onClick={() => login()}>
              Sign in
            </Button>
            <Text color="whiteAlpha.400" fontSize="xs" textAlign="center">
              Secured by single sign-on. No separate LapTrac password required.
            </Text>
          </Stack>
        </Stack>

        <Text color="whiteAlpha.400" fontSize="xs">
          &copy; {new Date().getFullYear()} LapTrac
        </Text>
      </Flex>

      <Box position="relative" flex="1" overflow="hidden" display={{ base: "none", md: "block" }}>
        <Box
          position="absolute"
          inset="0"
          style={{
            background: "radial-gradient(circle at 62% 38%, rgba(187,36,62,0.45), rgba(11,11,13,0) 58%)",
          }}
        />
        <Box
          position="absolute"
          inset="0"
          opacity="0.12"
          style={{
            backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />
        <svg
          viewBox="0 0 600 600"
          fill="none"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        >
          <circle cx="360" cy="230" r="120" stroke="#BB243E" strokeOpacity="0.55" strokeDasharray="3 7" />
          <circle cx="360" cy="230" r="190" stroke="#BB243E" strokeOpacity="0.32" strokeDasharray="2 10" />
          <circle cx="360" cy="230" r="260" stroke="#ffffff" strokeOpacity="0.07" />
          <line x1="0" y1="230" x2="600" y2="230" stroke="#ffffff" strokeOpacity="0.07" />
          <line x1="360" y1="0" x2="360" y2="600" stroke="#ffffff" strokeOpacity="0.07" />
          <circle cx="360" cy="230" r="4" fill="#BB243E" />
        </svg>
        <Stack position="absolute" bottom="10" left="10" gap="0.5" fontFamily="mono" fontSize="xs" color="whiteAlpha.600">
          <Text>asset://laptop-142</Text>
          <Text>status: tracked</Text>
          <Text>uptime: 99.9%</Text>
        </Stack>
      </Box>
    </Flex>
  )
}
