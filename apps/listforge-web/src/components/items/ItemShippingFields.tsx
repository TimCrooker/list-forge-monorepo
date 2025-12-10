import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
} from '@listforge/ui';

// Shipping type options
const SHIPPING_TYPE_OPTIONS = [
  { value: 'flat', label: 'Flat Rate' },
  { value: 'calculated', label: 'Calculated' },
  { value: 'local_pickup', label: 'Local Pickup Only' },
] as const;

interface ItemShippingFieldsProps {
  shippingType: string;
  onShippingTypeChange: (value: string) => void;
  flatRateAmount: string;
  onFlatRateAmountChange: (value: string) => void;
  domesticOnly: boolean;
  onDomesticOnlyChange: (value: boolean) => void;
}

/**
 * ItemShippingFields - Shipping configuration form section
 *
 * Handles shipping type, flat rate amount, and domestic only checkbox
 */
export function ItemShippingFields({
  shippingType,
  onShippingTypeChange,
  flatRateAmount,
  onFlatRateAmountChange,
  domesticOnly,
  onDomesticOnlyChange,
}: ItemShippingFieldsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipping</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="shippingType">Shipping Type</Label>
          <Select value={shippingType} onValueChange={onShippingTypeChange}>
            <SelectTrigger id="shippingType">
              <SelectValue placeholder="Select shipping type" />
            </SelectTrigger>
            <SelectContent>
              {SHIPPING_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {shippingType === 'flat' && (
          <div className="space-y-2">
            <Label htmlFor="flatRateAmount">Flat Rate Amount (USD)</Label>
            <Input
              id="flatRateAmount"
              type="number"
              step="0.01"
              min="0"
              value={flatRateAmount}
              onChange={(e) => onFlatRateAmountChange(e.target.value)}
              placeholder="0.00"
              required={shippingType === 'flat'}
            />
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Checkbox
            id="domesticOnly"
            checked={domesticOnly}
            onCheckedChange={(checked) => onDomesticOnlyChange(checked as boolean)}
          />
          <Label htmlFor="domesticOnly" className="cursor-pointer">
            Domestic shipping only
          </Label>
        </div>
      </CardContent>
    </Card>
  );
}
