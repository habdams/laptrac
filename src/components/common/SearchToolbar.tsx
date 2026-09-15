import { Button, HStack, Input, InputGroup } from "@chakra-ui/react"
import { LuPlus, LuSearch, LuX } from "react-icons/lu"

interface SearchToolbarProps {
  placeholder: string
  value: string
  onChange: (value: string) => void
  onSubmit?: () => void
  onClear?: () => void
  addLabel?: string
  onAdd?: () => void
}

export function SearchToolbar({
  placeholder,
  value,
  onChange,
  onSubmit,
  onClear,
  addLabel,
  onAdd,
}: SearchToolbarProps) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit?.()
      }}
      style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", width: "100%" }}
    >
      <HStack gap="2">
        <InputGroup maxW="sm" startElement={<LuSearch />}>
          <Input placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
        </InputGroup>
        <Button type="submit" variant="outline">
          <LuSearch /> Search
        </Button>
        {value.length > 0 && (
          <Button type="button" variant="ghost" onClick={onClear}>
            <LuX /> Clear search
          </Button>
        )}
      </HStack>
      {onAdd && (
        <Button type="button" colorPalette="brand" onClick={onAdd}>
          <LuPlus /> {addLabel}
        </Button>
      )}
    </form>
  )
}
