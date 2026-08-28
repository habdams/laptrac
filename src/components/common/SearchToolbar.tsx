import { Button, HStack, Input, InputGroup } from "@chakra-ui/react"
import { LuPlus, LuSearch } from "react-icons/lu"

interface SearchToolbarProps {
  placeholder: string
  value: string
  onChange: (value: string) => void
  addLabel?: string
  onAdd?: () => void
}

export function SearchToolbar({ placeholder, value, onChange, addLabel, onAdd }: SearchToolbarProps) {
  return (
    <HStack justify="space-between" gap="3">
      <InputGroup maxW="sm" startElement={<LuSearch />}>
        <Input placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
      </InputGroup>
      {onAdd && (
        <Button colorPalette="orange" onClick={onAdd}>
          <LuPlus /> {addLabel}
        </Button>
      )}
    </HStack>
  )
}
