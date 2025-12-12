import { useState, useCallback } from 'react';
import { useUpdateItemMutation } from '@listforge/api-rtk';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Input,
  Textarea,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Button,
  Switch,
  Separator,
  cn,
} from '@listforge/ui';
import {
  Package,
  DollarSign,
  Truck,
  MapPin,
  StickyNote,
  FolderTree,
  Tags,
  Loader2,
  Plus,
  X,
  Sparkles,
  User,
  Download,
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import type { ItemDto, UpdateItemRequest } from '@listforge/api-types';
import type {
  ItemCondition,
  ShippingType,
  PricingStrategy,
  ItemAttribute,
} from '@listforge/core-types';

interface ItemEditTabProps {
  item: ItemDto;
}

const CONDITION_OPTIONS: { value: ItemCondition; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'used_like_new', label: 'Used - Like New' },
  { value: 'used_very_good', label: 'Used - Very Good' },
  { value: 'used_good', label: 'Used - Good' },
  { value: 'used_acceptable', label: 'Used - Acceptable' },
];

const SHIPPING_TYPE_OPTIONS: { value: ShippingType; label: string }[] = [
  { value: 'flat', label: 'Flat Rate' },
  { value: 'calculated', label: 'Calculated' },
  { value: 'free', label: 'Free Shipping' },
  { value: 'local_pickup', label: 'Local Pickup Only' },
];

const PRICING_STRATEGY_OPTIONS: { value: PricingStrategy; label: string }[] = [
  { value: 'aggressive', label: 'Aggressive (Fast Sale)' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'premium', label: 'Premium (Max Price)' },
];

const SOURCE_ICONS = {
  ai: Sparkles,
  user: User,
  imported: Download,
};

const SOURCE_COLORS = {
  ai: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  user: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  imported: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

export function ItemEditTab({ item }: ItemEditTabProps) {
  const [updateItem, { isLoading: isSaving }] = useUpdateItemMutation();

  // Track which field is currently being saved
  const [savingField, setSavingField] = useState<string | null>(null);

  // New attribute form state
  const [newAttrKey, setNewAttrKey] = useState('');
  const [newAttrValue, setNewAttrValue] = useState('');

  // New tag input state
  const [newTag, setNewTag] = useState('');

  // Auto-save handler that wraps the mutation
  const handleFieldSave = useCallback(
    async (fieldName: string, data: UpdateItemRequest) => {
      setSavingField(fieldName);
      try {
        await updateItem({ id: item.id, data }).unwrap();
        showSuccess('Saved');
      } catch (error) {
        console.error(`Failed to save ${fieldName}:`, error);
        showError(`Failed to save ${fieldName}`);
      } finally {
        setSavingField(null);
      }
    },
    [updateItem, item.id]
  );

  // Handle attribute operations
  const handleAddAttribute = async () => {
    if (!newAttrKey.trim() || !newAttrValue.trim()) return;

    const newAttribute: ItemAttribute = {
      key: newAttrKey.trim(),
      value: newAttrValue.trim(),
      source: 'user',
    };

    const updatedAttributes = [...(item.attributes || []), newAttribute];
    await handleFieldSave('attributes', { attributes: updatedAttributes });
    setNewAttrKey('');
    setNewAttrValue('');
  };

  const handleRemoveAttribute = async (index: number) => {
    const updatedAttributes = (item.attributes || []).filter((_, i) => i !== index);
    await handleFieldSave('attributes', { attributes: updatedAttributes });
  };

  const handleUpdateAttribute = async (
    index: number,
    key: string,
    value: string
  ) => {
    const updatedAttributes = (item.attributes || []).map((attr, i) =>
      i === index ? { ...attr, key, value, source: 'user' as const } : attr
    );
    await handleFieldSave('attributes', { attributes: updatedAttributes });
  };

  // Handle tag operations
  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    const updatedTags = [...(item.tags || []), newTag.trim()];
    await handleFieldSave('tags', { tags: updatedTags });
    setNewTag('');
  };

  const handleRemoveTag = async (index: number) => {
    const updatedTags = item.tags.filter((_, i) => i !== index);
    await handleFieldSave('tags', { tags: updatedTags });
  };

  // Field indicator component
  const SavingIndicator = ({ field }: { field: string }) =>
    savingField === field ? (
      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
    ) : null;

  return (
    <div className="space-y-6 pb-8">
      {/* Basic Info Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Basic Information
          </CardTitle>
          <CardDescription>
            Core listing details like title, description, and condition
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="title">Title *</Label>
              <SavingIndicator field="title" />
            </div>
            <Input
              id="title"
              defaultValue={item.title || ''}
              placeholder="Enter item title..."
              maxLength={80}
              onBlur={(e) => {
                if (e.target.value !== (item.title || '')) {
                  handleFieldSave('title', { title: e.target.value || undefined });
                }
              }}
            />
            <p className="text-xs text-muted-foreground text-right">
              {(item.title || '').length}/80 characters
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="subtitle">Subtitle</Label>
              <SavingIndicator field="subtitle" />
            </div>
            <Input
              id="subtitle"
              defaultValue={item.subtitle || ''}
              placeholder="Optional subtitle..."
              maxLength={55}
              onBlur={(e) => {
                if (e.target.value !== (item.subtitle || '')) {
                  handleFieldSave('subtitle', {
                    subtitle: e.target.value || undefined,
                  });
                }
              }}
            />
            <p className="text-xs text-muted-foreground text-right">
              {(item.subtitle || '').length}/55 characters
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Description</Label>
              <SavingIndicator field="description" />
            </div>
            <Textarea
              id="description"
              defaultValue={item.description || ''}
              placeholder="Describe the item in detail..."
              rows={6}
              className="resize-y"
              onBlur={(e) => {
                if (e.target.value !== (item.description || '')) {
                  handleFieldSave('description', {
                    description: e.target.value || undefined,
                  });
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="condition">Condition</Label>
              <SavingIndicator field="condition" />
            </div>
            <Select
              value={item.condition || ''}
              onValueChange={(value) => {
                if (value !== item.condition) {
                  handleFieldSave('condition', {
                    condition: value as ItemCondition,
                  });
                }
              }}
            >
              <SelectTrigger id="condition">
                <SelectValue placeholder="Select condition..." />
              </SelectTrigger>
              <SelectContent>
                {CONDITION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Category Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            Category
          </CardTitle>
          <CardDescription>
            Marketplace category classification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="categoryPath">Category Path</Label>
              <SavingIndicator field="categoryPath" />
            </div>
            <Input
              id="categoryPath"
              defaultValue={item.categoryPath?.join(' > ') || ''}
              placeholder="Electronics > Computers > Laptops"
              onBlur={(e) => {
                const newPath = e.target.value
                  ? e.target.value.split('>').map((s) => s.trim())
                  : undefined;
                const oldPath = item.categoryPath?.join(' > ') || '';
                if (e.target.value !== oldPath) {
                  handleFieldSave('categoryPath', { categoryPath: newPath });
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Separate categories with {'>'}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="categoryId">Category ID</Label>
              <SavingIndicator field="categoryId" />
            </div>
            <Input
              id="categoryId"
              defaultValue={item.categoryId || ''}
              placeholder="Marketplace category ID (optional)"
              onBlur={(e) => {
                if (e.target.value !== (item.categoryId || '')) {
                  handleFieldSave('categoryId', {
                    categoryId: e.target.value || undefined,
                  });
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Attributes Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5" />
            Attributes
          </CardTitle>
          <CardDescription>
            Item specifics like brand, model, size, color, etc.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing attributes list */}
          {item.attributes && item.attributes.length > 0 ? (
            <div className="space-y-2">
              {item.attributes.map((attr, index) => {
                const SourceIcon = SOURCE_ICONS[attr.source];
                return (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 rounded-md border bg-card"
                  >
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Input
                        defaultValue={attr.key}
                        placeholder="Attribute name"
                        className="h-8 text-sm"
                        onBlur={(e) => {
                          if (e.target.value !== attr.key) {
                            handleUpdateAttribute(
                              index,
                              e.target.value,
                              attr.value
                            );
                          }
                        }}
                      />
                      <Input
                        defaultValue={attr.value}
                        placeholder="Value"
                        className="h-8 text-sm"
                        onBlur={(e) => {
                          if (e.target.value !== attr.value) {
                            handleUpdateAttribute(
                              index,
                              attr.key,
                              e.target.value
                            );
                          }
                        }}
                      />
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn('text-xs gap-1', SOURCE_COLORS[attr.source])}
                    >
                      <SourceIcon className="h-3 w-3" />
                      {attr.source}
                    </Badge>
                    {attr.confidence !== undefined && (
                      <Badge variant="outline" className="text-xs">
                        {Math.round(attr.confidence * 100)}%
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveAttribute(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No attributes yet. Add some below.
            </p>
          )}

          {/* Add new attribute */}
          <Separator />
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor="newAttrKey" className="text-xs">
                Attribute Name
              </Label>
              <Input
                id="newAttrKey"
                value={newAttrKey}
                onChange={(e) => setNewAttrKey(e.target.value)}
                placeholder="e.g., Brand"
                className="h-9"
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label htmlFor="newAttrValue" className="text-xs">
                Value
              </Label>
              <Input
                id="newAttrValue"
                value={newAttrValue}
                onChange={(e) => setNewAttrValue(e.target.value)}
                placeholder="e.g., Nike"
                className="h-9"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddAttribute();
                  }
                }}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddAttribute}
              disabled={!newAttrKey.trim() || !newAttrValue.trim() || isSaving}
              className="h-9"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pricing
          </CardTitle>
          <CardDescription>
            Price, strategy, and cost information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="defaultPrice">List Price</Label>
                <SavingIndicator field="defaultPrice" />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="defaultPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={item.defaultPrice?.toString() || ''}
                  placeholder="0.00"
                  className="pl-7"
                  onBlur={(e) => {
                    const newPrice = e.target.value
                      ? parseFloat(e.target.value)
                      : undefined;
                    if (newPrice !== item.defaultPrice) {
                      handleFieldSave('defaultPrice', { defaultPrice: newPrice });
                    }
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="quantity">Quantity</Label>
                <SavingIndicator field="quantity" />
              </div>
              <Input
                id="quantity"
                type="number"
                min="1"
                defaultValue={item.quantity?.toString() || '1'}
                onBlur={(e) => {
                  const newQty = parseInt(e.target.value) || 1;
                  if (newQty !== item.quantity) {
                    handleFieldSave('quantity', { quantity: newQty });
                  }
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="priceMin">Price Floor</Label>
                <SavingIndicator field="priceMin" />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="priceMin"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={item.priceMin?.toString() || ''}
                  placeholder="Minimum price"
                  className="pl-7"
                  onBlur={(e) => {
                    const newPrice = e.target.value
                      ? parseFloat(e.target.value)
                      : undefined;
                    if (newPrice !== item.priceMin) {
                      handleFieldSave('priceMin', { priceMin: newPrice });
                    }
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="priceMax">Price Ceiling</Label>
                <SavingIndicator field="priceMax" />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="priceMax"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={item.priceMax?.toString() || ''}
                  placeholder="Maximum price"
                  className="pl-7"
                  onBlur={(e) => {
                    const newPrice = e.target.value
                      ? parseFloat(e.target.value)
                      : undefined;
                    if (newPrice !== item.priceMax) {
                      handleFieldSave('priceMax', { priceMax: newPrice });
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="pricingStrategy">Pricing Strategy</Label>
                <SavingIndicator field="pricingStrategy" />
              </div>
              <Select
                value={item.pricingStrategy || ''}
                onValueChange={(value) => {
                  if (value !== item.pricingStrategy) {
                    handleFieldSave('pricingStrategy', {
                      pricingStrategy: value as PricingStrategy,
                    });
                  }
                }}
              >
                <SelectTrigger id="pricingStrategy">
                  <SelectValue placeholder="Select strategy..." />
                </SelectTrigger>
                <SelectContent>
                  {PRICING_STRATEGY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="costBasis">Cost Basis</Label>
                <SavingIndicator field="costBasis" />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="costBasis"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={item.costBasis?.toString() || ''}
                  placeholder="What you paid"
                  className="pl-7"
                  onBlur={(e) => {
                    const newCost = e.target.value
                      ? parseFloat(e.target.value)
                      : undefined;
                    if (newCost !== item.costBasis) {
                      handleFieldSave('costBasis', { costBasis: newCost });
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipping
          </CardTitle>
          <CardDescription>
            Shipping method and package details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="shippingType">Shipping Type</Label>
                <SavingIndicator field="shippingType" />
              </div>
              <Select
                value={item.shippingType || ''}
                onValueChange={(value) => {
                  if (value !== item.shippingType) {
                    handleFieldSave('shippingType', {
                      shippingType: value as ShippingType,
                    });
                  }
                }}
              >
                <SelectTrigger id="shippingType">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {SHIPPING_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {item.shippingType === 'flat' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="flatRateAmount">Flat Rate Amount</Label>
                  <SavingIndicator field="flatRateAmount" />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="flatRateAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={item.flatRateAmount?.toString() || ''}
                    placeholder="0.00"
                    className="pl-7"
                    onBlur={(e) => {
                      const newAmount = e.target.value
                        ? parseFloat(e.target.value)
                        : undefined;
                      if (newAmount !== item.flatRateAmount) {
                        handleFieldSave('flatRateAmount', {
                          flatRateAmount: newAmount,
                        });
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="weight">Weight (lbs)</Label>
                <SavingIndicator field="weight" />
              </div>
              <Input
                id="weight"
                type="number"
                step="0.1"
                min="0"
                defaultValue={item.weight?.toString() || ''}
                placeholder="Package weight"
                onBlur={(e) => {
                  const newWeight = e.target.value
                    ? parseFloat(e.target.value)
                    : undefined;
                  if (newWeight !== item.weight) {
                    handleFieldSave('weight', { weight: newWeight });
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="dimensions">Dimensions</Label>
                <SavingIndicator field="dimensions" />
              </div>
              <Input
                id="dimensions"
                defaultValue={item.dimensions || ''}
                placeholder="L x W x H (inches)"
                onBlur={(e) => {
                  if (e.target.value !== (item.dimensions || '')) {
                    handleFieldSave('dimensions', {
                      dimensions: e.target.value || undefined,
                    });
                  }
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-md border">
            <div>
              <Label htmlFor="domesticOnly" className="font-medium">
                Domestic Shipping Only
              </Label>
              <p className="text-xs text-muted-foreground">
                Restrict shipping to domestic addresses only
              </p>
            </div>
            <Switch
              id="domesticOnly"
              checked={item.domesticOnly}
              onCheckedChange={(checked) => {
                if (checked !== item.domesticOnly) {
                  handleFieldSave('domesticOnly', { domesticOnly: checked });
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Inventory Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Inventory
          </CardTitle>
          <CardDescription>
            Storage location and organization tags
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="location">Storage Location</Label>
              <SavingIndicator field="location" />
            </div>
            <Input
              id="location"
              defaultValue={item.location || ''}
              placeholder="e.g., Shelf A3, Bin 12"
              onBlur={(e) => {
                if (e.target.value !== (item.location || '')) {
                  handleFieldSave('location', {
                    location: e.target.value || undefined,
                  });
                }
              }}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {item.tags && item.tags.length > 0 ? (
                item.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="gap-1 pr-1"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(index)}
                      className="ml-1 rounded-full hover:bg-muted p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No tags</p>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag..."
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button
                variant="outline"
                onClick={handleAddTag}
                disabled={!newTag.trim() || isSaving}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StickyNote className="h-5 w-5" />
            Notes & Hints
          </CardTitle>
          <CardDescription>
            User-provided hints and notes for AI processing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="userTitleHint">Title Hint</Label>
              <SavingIndicator field="userTitleHint" />
            </div>
            <Input
              id="userTitleHint"
              defaultValue={item.userTitleHint || ''}
              placeholder="What is this item?"
              onBlur={(e) => {
                if (e.target.value !== (item.userTitleHint || '')) {
                  handleFieldSave('userTitleHint', {
                    userTitleHint: e.target.value || undefined,
                  });
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Help the AI understand what this item is
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="userDescriptionHint">Description Hint</Label>
              <SavingIndicator field="userDescriptionHint" />
            </div>
            <Textarea
              id="userDescriptionHint"
              defaultValue={item.userDescriptionHint || ''}
              placeholder="Additional details about the item..."
              rows={3}
              onBlur={(e) => {
                if (e.target.value !== (item.userDescriptionHint || '')) {
                  handleFieldSave('userDescriptionHint', {
                    userDescriptionHint: e.target.value || undefined,
                  });
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="userNotes">Private Notes</Label>
              <SavingIndicator field="userNotes" />
            </div>
            <Textarea
              id="userNotes"
              defaultValue={item.userNotes || ''}
              placeholder="Internal notes (not published)..."
              rows={3}
              onBlur={(e) => {
                if (e.target.value !== (item.userNotes || '')) {
                  handleFieldSave('userNotes', {
                    userNotes: e.target.value || undefined,
                  });
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              These notes are not included in marketplace listings
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
