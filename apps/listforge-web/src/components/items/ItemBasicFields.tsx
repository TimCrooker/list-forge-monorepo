import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@listforge/ui';

// Condition options from ItemCondition type
const CONDITION_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'used_like_new', label: 'Used - Like New' },
  { value: 'used_very_good', label: 'Used - Very Good' },
  { value: 'used_good', label: 'Used - Good' },
  { value: 'used_acceptable', label: 'Used - Acceptable' },
] as const;

interface ItemBasicFieldsProps {
  title: string;
  onTitleChange: (value: string) => void;
  subtitle: string;
  onSubtitleChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  condition: string;
  onConditionChange: (value: string) => void;
}

/**
 * ItemBasicFields - Core item details form section
 *
 * Handles title, subtitle, description, and condition fields
 */
export function ItemBasicFields({
  title,
  onTitleChange,
  subtitle,
  onSubtitleChange,
  description,
  onDescriptionChange,
  condition,
  onConditionChange,
}: ItemBasicFieldsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Item Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">
            Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="e.g., Vintage Canon AE-1 Camera"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subtitle">Subtitle (Optional)</Label>
          <Input
            id="subtitle"
            value={subtitle}
            onChange={(e) => onSubtitleChange(e.target.value)}
            placeholder="Additional title details"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">
            Description <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Describe the item's features, condition, and any defects..."
            rows={6}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="condition">
            Condition <span className="text-destructive">*</span>
          </Label>
          <Select value={condition} onValueChange={onConditionChange}>
            <SelectTrigger id="condition">
              <SelectValue placeholder="Select condition" />
            </SelectTrigger>
            <SelectContent>
              {CONDITION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
