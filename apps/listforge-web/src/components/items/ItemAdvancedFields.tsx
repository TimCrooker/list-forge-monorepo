import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Button,
  Badge,
} from '@listforge/ui';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import type { ItemAttribute } from '@listforge/core-types';

interface ItemAdvancedFieldsProps {
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  categoryPath: string;
  onCategoryPathChange: (value: string) => void;
  attributes: ItemAttribute[];
  newAttrKey: string;
  onNewAttrKeyChange: (value: string) => void;
  newAttrValue: string;
  onNewAttrValueChange: (value: string) => void;
  onAddAttribute: () => void;
  onRemoveAttribute: (index: number) => void;
}

/**
 * ItemAdvancedFields - Optional category and attributes form section
 *
 * Collapsible section for category path and custom attributes
 */
export function ItemAdvancedFields({
  showAdvanced,
  onToggleAdvanced,
  categoryPath,
  onCategoryPathChange,
  attributes,
  newAttrKey,
  onNewAttrKeyChange,
  newAttrValue,
  onNewAttrValueChange,
  onAddAttribute,
  onRemoveAttribute,
}: ItemAdvancedFieldsProps) {
  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={onToggleAdvanced}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
            Category & Attributes (Optional)
          </CardTitle>
          {showAdvanced ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      {showAdvanced && (
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="categoryPath">Category Path</Label>
            <Input
              id="categoryPath"
              value={categoryPath}
              onChange={(e) => onCategoryPathChange(e.target.value)}
              placeholder="e.g., Electronics > Cameras > Film Cameras"
            />
            <p className="text-xs text-muted-foreground">
              Separate categories with &gt; symbol
            </p>
          </div>

          <div className="space-y-2">
            <Label>Attributes</Label>
            <div className="space-y-2">
              {attributes.map((attr, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-muted rounded"
                >
                  <Badge variant="outline">{attr.key}</Badge>
                  <span className="text-sm flex-1">{attr.value}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveAttribute(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <div className="flex gap-2">
                <Input
                  value={newAttrKey}
                  onChange={(e) => onNewAttrKeyChange(e.target.value)}
                  placeholder="Key (e.g., Brand)"
                  className="flex-1"
                />
                <Input
                  value={newAttrValue}
                  onChange={(e) => onNewAttrValueChange(e.target.value)}
                  placeholder="Value (e.g., Canon)"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={onAddAttribute}
                  disabled={!newAttrKey.trim() || !newAttrValue.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
