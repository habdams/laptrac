import { Box, HStack, Text, VStack } from "@chakra-ui/react"
import { useAuth } from "../../auth/AuthContext"
import { useRole } from "../../auth/useRole"
import { Avatar } from "../ui/avatar"

export function ProfileCard() {
  const { user } = useAuth()
  const role = useRole()
  if (!user) return null

  return (
    <Box borderWidth="1px" borderColor="border" rounded="lg" p="3">
      <HStack gap="3">
        <Avatar name={user.name} size="sm" colorPalette="orange" />
        <VStack align="flex-start" gap="0" minW="0">
          <Text fontSize="sm" fontWeight="medium" truncate>
            {user.name}
          </Text>
          <Text fontSize="xs" color="fg.muted" truncate>
            {user.email}
          </Text>
        </VStack>
      </HStack>
      <Text mt="2" fontSize="xs" color="fg.muted" textTransform="uppercase" letterSpacing="wide">
        {role === "it" ? "IT team" : "Employee"}
      </Text>
    </Box>
  )
}
