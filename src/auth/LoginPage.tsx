import { Box, Button, Flex, Image, Stack, Text } from "@chakra-ui/react"
import { Navigate } from "react-router"
import logoFullWhite from "../assets/logo-full-white.svg"
import { useAuth } from "./AuthContext"

const CENTER = { x: 360, y: 230 }

const SIGNAL_DOTS = [
  { x: 150, y: 120, r: 2.4, dur: 2.6, delay: 0 },
  { x: 486, y: 96, r: 1.8, dur: 3.1, delay: 0.7 },
  { x: 524, y: 336, r: 2.2, dur: 2.4, delay: 1.4 },
  { x: 198, y: 416, r: 2, dur: 2.9, delay: 0.3 },
  { x: 86, y: 292, r: 1.6, dur: 3.4, delay: 1.9 },
  { x: 432, y: 470, r: 2.4, dur: 2.7, delay: 1.0 },
  { x: 552, y: 196, r: 1.8, dur: 3.2, delay: 2.2 },
  { x: 258, y: 54, r: 2, dur: 2.5, delay: 1.6 },
]

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
          <circle cx={CENTER.x} cy={CENTER.y} r="120" stroke="#BB243E" strokeOpacity="0.55" strokeDasharray="3 7" />
          <circle cx={CENTER.x} cy={CENTER.y} r="190" stroke="#BB243E" strokeOpacity="0.32" strokeDasharray="2 10" />
          <circle cx={CENTER.x} cy={CENTER.y} r="260" stroke="#ffffff" strokeOpacity="0.07" />
          <line x1="0" y1={CENTER.y} x2="600" y2={CENTER.y} stroke="#ffffff" strokeOpacity="0.07" />
          <line x1={CENTER.x} y1="0" x2={CENTER.x} y2="600" stroke="#ffffff" strokeOpacity="0.07" />

          {SIGNAL_DOTS.map((dot, i) => (
            <g key={i}>
              <line
                x1={dot.x}
                y1={dot.y}
                x2={CENTER.x}
                y2={CENTER.y}
                stroke="#BB243E"
                strokeOpacity="0.12"
                strokeWidth="1"
              />
              <circle cx={dot.x} cy={dot.y} r={dot.r} fill="#BB243E" fillOpacity="0.85" />
              <circle cx={dot.x} cy={dot.y} r={dot.r} fill="none" stroke="#BB243E" strokeWidth="1.2">
                <animate
                  attributeName="r"
                  values={`${dot.r};${dot.r + 14}`}
                  dur={`${dot.dur}s`}
                  begin={`${dot.delay}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.8;0"
                  dur={`${dot.dur}s`}
                  begin={`${dot.delay}s`}
                  repeatCount="indefinite"
                />
              </circle>
              <circle r="2.2" fill="#BB243E">
                <animateMotion
                  path={`M ${dot.x} ${dot.y} L ${CENTER.x} ${CENTER.y}`}
                  dur={`${dot.dur}s`}
                  begin={`${dot.delay}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0;1;1;0"
                  keyTimes="0;0.15;0.75;1"
                  dur={`${dot.dur}s`}
                  begin={`${dot.delay}s`}
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          ))}

          <circle cx={CENTER.x} cy={CENTER.y} r="14" fill="none" stroke="#BB243E" strokeWidth="1.2" strokeOpacity="0.6">
            <animate attributeName="r" values="6;22" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx={CENTER.x} cy={CENTER.y} r="6" fill="#BB243E">
            <animate attributeName="r" values="6;7.5;6" dur="1.6s" repeatCount="indefinite" />
          </circle>
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
