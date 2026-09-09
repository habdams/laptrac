import * as React from "react"
import { Button, Field, HStack, Input, NativeSelect, Stack, Textarea } from "@chakra-ui/react"
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
import { getErrorMessage } from "../../lib/errors"

const CURRENCY_OPTIONS = [ "NGN","USD", "GBP", "EUR"]

export function Component() {
  const navigate = useNavigate()
  const { addLaptop } = useLaptops()
  const [submitting, setSubmitting] = React.useState(false)

  const [assetName, setAssetName] = React.useState("")
  const [model, setModel] = React.useState("")
  const [comment, setComment] = React.useState("")
  const [assetLocation, setAssetLocation] = React.useState("")
  const [employeeDepartment, setEmployeeDepartment] = React.useState("")
  const [price, setPrice] = React.useState("")
  const [currency, setCurrency] = React.useState("USD")
  const [receipt, setReceipt] = React.useState<File | null>(null)
  const [purchaseYear, setPurchaseYear] = React.useState("")
  const [warrantyExpirationDate, setWarrantyExpirationDate] = React.useState("")
  const [depreciationEstimationDate, setDepreciationEstimationDate] = React.useState("")
  const [estimationUsefulLifeYear, setEstimationUsefulLifeYear] = React.useState("")

  const close = () => navigate("/laptops")

  const toIso = (dateValue: string) => (dateValue ? new Date(dateValue).toISOString() : new Date().toISOString())

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assetName.trim() || !model.trim() || !comment.trim()) return
    setSubmitting(true)
    try {
      await addLaptop({
        assetName: assetName.trim(),
        model: model.trim(),
        comment: comment.trim(),
        assetLocation: assetLocation.trim(),
        employeeDepartment: employeeDepartment.trim(),
        price: Number(price) || 0,
        currency,
        receipt,
        estimationUsefulLifeYear: toIso(estimationUsefulLifeYear),
        depreciationEstimationDate: toIso(depreciationEstimationDate),
        warrantyExpirationDate: toIso(warrantyExpirationDate),
        purchaseYear: toIso(purchaseYear),
      })
      toaster.create({ type: "success", title: "Machine added to inventory" })
      navigate("/laptops")
    } catch (err) {
      toaster.create({ type: "error", title: "Couldn't add machine", description: getErrorMessage(err) })
    } finally {
      setSubmitting(false)
    }
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
                <Field.Label>Asset name</Field.Label>
                <Input value={assetName} onChange={(e) => setAssetName(e.target.value)} placeholder="e.g. MacBook Pro 14" />
              </Field.Root>
              <Field.Root required>
                <Field.Label>Model</Field.Label>
                <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. A2779" />
              </Field.Root>
              <Field.Root required>
                <Field.Label>Comment</Field.Label>
                <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder="Notes about this asset" />
              </Field.Root>
              <Field.Root>
                <Field.Label>Location</Field.Label>
                <Input value={assetLocation} onChange={(e) => setAssetLocation(e.target.value)} placeholder="e.g. Lagos office" />
              </Field.Root>
              <Field.Root>
                <Field.Label>Department</Field.Label>
                <Input value={employeeDepartment} onChange={(e) => setEmployeeDepartment(e.target.value)} placeholder="e.g. Engineering" />
              </Field.Root>
              <Field.Root>
                <Field.Label>Amount</Field.Label>
                <HStack>
                  <NativeSelect.Root width="28">
                    <NativeSelect.Field value={currency} onChange={(e) => setCurrency(e.target.value)}>
                      {CURRENCY_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                  <Input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    css={{
                      "&::-webkit-outer-spin-button, &::-webkit-inner-spin-button": {
                        WebkitAppearance: "none",
                        margin: 0,
                      },
                      MozAppearance: "textfield",
                    }}
                  />
                </HStack>
              </Field.Root>
              <Field.Root>
                <Field.Label>Receipt</Field.Label>
                <Input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
                  padding="1"
                />
                <Field.HelperText>Upload an image or document of the purchase receipt.</Field.HelperText>
              </Field.Root>
              <Field.Root>
                <Field.Label>Purchase date</Field.Label>
                <Input value={purchaseYear} onChange={(e) => setPurchaseYear(e.target.value)} type="date" />
              </Field.Root>
              <Field.Root>
                <Field.Label>Warranty expiration</Field.Label>
                <Input value={warrantyExpirationDate} onChange={(e) => setWarrantyExpirationDate(e.target.value)} type="date" />
              </Field.Root>
              <Field.Root>
                <Field.Label>Depreciation estimation date</Field.Label>
                <Input value={depreciationEstimationDate} onChange={(e) => setDepreciationEstimationDate(e.target.value)} type="date" />
              </Field.Root>
              <Field.Root>
                <Field.Label>Estimated useful life (end date)</Field.Label>
                <Input value={estimationUsefulLifeYear} onChange={(e) => setEstimationUsefulLifeYear(e.target.value)} type="date" />
              </Field.Root>
            </Stack>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" type="button" onClick={close}>
              Cancel
            </Button>
            <Button colorPalette="orange" type="submit" loading={submitting}>
              Add machine
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}
