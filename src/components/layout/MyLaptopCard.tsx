import * as React from "react"
import { Box, HStack, Text, VStack } from "@chakra-ui/react"
import { useAuth } from "../../auth/AuthContext"
import { LaptopDetailContent } from "../../features/laptops/LaptopDetailContent"
import { StatusBadge, laptopStatusTone } from "../common/StatusBadge"
import { DrawerBody, DrawerCloseTrigger, DrawerContent, DrawerHeader, DrawerRoot, DrawerTitle } from "../ui/drawer"

export function MyLaptopCard() {
  const { user } = useAuth()
  const [open, setOpen] = React.useState(false)

  if (!user?.laptop) return null
  const myLaptop = user.laptop

  const status = myLaptop.status ?? "assigned"

  return (
    <>
      <Box
        as="button"
        onClick={() => setOpen(true)}
        borderWidth="1px"
        borderColor="border"
        rounded="lg"
        p="3"
        textAlign="left"
        w="full"
        _hover={{ borderColor: "orange.focusRing" }}
      >
        <Text fontSize="xs" color="fg.muted" textTransform="uppercase" letterSpacing="wide">
          My laptop
        </Text>
        <HStack justify="space-between" mt="1" gap="2">
          <VStack align="flex-start" gap="0" minW="0">
            <Text fontSize="sm" fontWeight="medium" truncate>
              {myLaptop.assetName}
            </Text>
            <Text fontSize="xs" color="fg.muted" truncate>
              {myLaptop.model}
            </Text>
          </VStack>
          <StatusBadge label={status.replace("-", " ")} tone={laptopStatusTone[status]} />
        </HStack>
      </Box>
      <DrawerRoot open={open} onOpenChange={(e) => setOpen(e.open)} size="md">
        <DrawerContent>
          <DrawerCloseTrigger />
          <DrawerHeader>
            <DrawerTitle>My laptop</DrawerTitle>
          </DrawerHeader>
          <DrawerBody>
            <LaptopDetailContent laptop={{ ...myLaptop, assignedToName: myLaptop.assignedToName ?? user.name }} />
          </DrawerBody>
        </DrawerContent>
      </DrawerRoot>
    </>
  )
}
