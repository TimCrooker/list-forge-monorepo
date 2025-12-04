import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select'

export interface FilterBooleanSelectProps {
  id: string
  value?: boolean
  placeholder?: string
  allLabel?: string
  trueLabel?: string
  falseLabel?: string
  onChange: (value: boolean | undefined) => void
  disabled?: boolean
  className?: string
}

export function FilterBooleanSelect({
  id,
  value,
  placeholder = 'Status',
  allLabel = 'All Statuses',
  trueLabel = 'Active',
  falseLabel = 'Inactive',
  onChange,
  disabled = false,
  className,
}: FilterBooleanSelectProps) {
  const handleValueChange = (selectedValue: string) => {
    if (selectedValue === '__all__') {
      onChange(undefined)
    } else if (selectedValue === 'true') {
      onChange(true)
    } else {
      onChange(false)
    }
  }

  const currentValue = value === undefined ? '__all__' : value ? 'true' : 'false'

  return (
    <Select value={currentValue} onValueChange={handleValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">{allLabel}</SelectItem>
        <SelectItem value="true">{trueLabel}</SelectItem>
        <SelectItem value="false">{falseLabel}</SelectItem>
      </SelectContent>
    </Select>
  )
}
