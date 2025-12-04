import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select'

export interface FilterSelectOption {
  value: string
  label: string
}

export interface FilterSelectProps {
  id: string
  value?: string
  options: string[] | FilterSelectOption[]
  placeholder?: string
  allLabel?: string
  onChange: (value: string | undefined) => void
  disabled?: boolean
  className?: string
}

export function FilterSelect({
  id,
  value,
  options,
  placeholder = 'Select...',
  allLabel = 'All',
  onChange,
  disabled = false,
  className,
}: FilterSelectProps) {
  const normalizedOptions: FilterSelectOption[] = options.map(option =>
    typeof option === 'string' ? { value: option, label: option } : option,
  )

  const handleValueChange = (selectedValue: string) => {
    if (selectedValue === '__all__') {
      onChange(undefined)
    } else {
      onChange(selectedValue)
    }
  }

  return (
    <Select value={value || '__all__'} onValueChange={handleValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">{allLabel}</SelectItem>
        {normalizedOptions.map(option => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
