import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@listforge/ui';

interface ItemPricingFieldsProps {
  defaultPrice: string;
  onDefaultPriceChange: (value: string) => void;
  quantity: string;
  onQuantityChange: (value: string) => void;
  location: string;
  onLocationChange: (value: string) => void;
  costBasis: string;
  onCostBasisChange: (value: string) => void;
}

/**
 * ItemPricingFields - Pricing and inventory form section
 *
 * Handles price, quantity, storage location, and cost basis fields
 */
export function ItemPricingFields({
  defaultPrice,
  onDefaultPriceChange,
  quantity,
  onQuantityChange,
  location,
  onLocationChange,
  costBasis,
  onCostBasisChange,
}: ItemPricingFieldsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pricing & Inventory</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="defaultPrice">Price (USD)</Label>
            <Input
              id="defaultPrice"
              type="number"
              step="0.01"
              min="0"
              value={defaultPrice}
              onChange={(e) => onDefaultPriceChange(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => onQuantityChange(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="location">Storage Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => onLocationChange(e.target.value)}
              placeholder="e.g., Shelf A-12, Bin 5"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="costBasis">Cost Basis (USD)</Label>
            <Input
              id="costBasis"
              type="number"
              step="0.01"
              min="0"
              value={costBasis}
              onChange={(e) => onCostBasisChange(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
