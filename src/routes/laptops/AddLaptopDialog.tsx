import * as React from "react"
import { Button, Field, Input, Stack } from "@chakra-ui/react"
import { useNavigate } from "react-router"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "../../components/ui/dialog"
import { toaster } from "../../components/ui/toaster"
import { useLaptops } from "../../features/laptops/LaptopsContext"

export function Component() {
  const navigate = useNavigate()
  const { addLaptop } = useLaptops()
  const [brand, setBrand] = React.useState("")
  const [model, setModel] = React.useState("")
  const [os, setOs] = React.useState("")
  const [serialNumber, setSerialNumber] = React.useState("")

  const close = () => navigate("/laptops")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!brand.trim() || !model.trim() || !serialNumber.trim()) return
    const laptop = addLaptop({
      brand: brand.trim(),
      model: model.trim(),
      os: os.trim() || "Unknown",
      serialNumber: serialNumber.trim(),
    })
    toaster.create({ type: "success", title: "Machine added to inventory" })
    navigate(`/laptops/${laptop.id}`)
  }

  return (
    <DialogRoot open onOpenChange={(e) => !e.open && close()}>
      <DialogContent>
        <DialogCloseTrigger />
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add new machine</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Stack gap="4">
              <Field.Root required>
                <Field.Label>Brand</Field.Label>
                <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Apple" />
              </Field.Root>
              <Field.Root required>
                <Field.Label>Model</Field.Label>
                <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. MacBook Pro 14" />
              </Field.Root>
              <Field.Root>
                <Field.Label>Operating system</Field.Label>
                <Input value={os} onChange={(e) => setOs(e.target.value)} placeholder="e.g. macOS Sonoma" />
              </Field.Root>
              <Field.Root required>
                <Field.Label>Serial number</Field.Label>
                <Input
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="e.g. LT-2026-0001"
                />
              </Field.Root>
            </Stack>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" type="button" onClick={close}>
              Cancel
            </Button>
            <Button colorPalette="orange" type="submit">
              Add machine
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}
