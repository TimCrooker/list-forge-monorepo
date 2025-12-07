import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useCreateManualItemMutation } from '@listforge/api-rtk';
import {
  Button,
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
  Checkbox,
  Badge,
} from '@listforge/ui';
import {
  Upload,
  ArrowLeft,
  Loader2,
  X,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Package,
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@listforge/ui';
import type { ItemAttribute } from '@listforge/core-types';

export const Route = createFileRoute('/_authenticated/items/new')({
  component: NewItemPage,
});

// Condition options from ItemCondition type
const CONDITION_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'used_like_new', label: 'Used - Like New' },
  { value: 'used_very_good', label: 'Used - Very Good' },
  { value: 'used_good', label: 'Used - Good' },
  { value: 'used_acceptable', label: 'Used - Acceptable' },
] as const;

// Shipping type options
const SHIPPING_TYPE_OPTIONS = [
  { value: 'flat', label: 'Flat Rate' },
  { value: 'calculated', label: 'Calculated' },
  { value: 'local_pickup', label: 'Local Pickup Only' },
] as const;

function NewItemPage() {
  const navigate = useNavigate();
  const [createItem, { isLoading }] = useCreateManualItemMutation();

  // Photo state
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Core details
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState('');

  // Pricing & inventory
  const [defaultPrice, setDefaultPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [location, setLocation] = useState('');
  const [costBasis, setCostBasis] = useState('');

  // Shipping
  const [shippingType, setShippingType] = useState('');
  const [flatRateAmount, setFlatRateAmount] = useState('');
  const [domesticOnly, setDomesticOnly] = useState(true);

  // Category & attributes
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [categoryPath, setCategoryPath] = useState('');
  const [attributes, setAttributes] = useState<ItemAttribute[]>([]);
  const [newAttrKey, setNewAttrKey] = useState('');
  const [newAttrValue, setNewAttrValue] = useState('');

  // Form validation state
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Photo upload handlers
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
    const newPreviews = acceptedFiles.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.heic'],
    },
    onDrop,
  });

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newFiles = [...files];
    const newPreviews = [...previews];

    const [draggedFile] = newFiles.splice(draggedIndex, 1);
    const [draggedPreview] = newPreviews.splice(draggedIndex, 1);

    newFiles.splice(index, 0, draggedFile);
    newPreviews.splice(index, 0, draggedPreview);

    setFiles(newFiles);
    setPreviews(newPreviews);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Attribute handlers
  const addAttribute = () => {
    if (!newAttrKey.trim() || !newAttrValue.trim()) return;

    setAttributes([
      ...attributes,
      {
        key: newAttrKey.trim(),
        value: newAttrValue.trim(),
        source: 'user',
      },
    ]);
    setNewAttrKey('');
    setNewAttrValue('');
  };

  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  // Form validation
  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!title.trim()) {
      errors.push('Title is required');
    }
    if (!description.trim()) {
      errors.push('Description is required');
    }
    if (!condition) {
      errors.push('Condition is required');
    }
    if (defaultPrice && parseFloat(defaultPrice) < 0) {
      errors.push('Price must be non-negative');
    }
    if (quantity && parseInt(quantity, 10) < 1) {
      errors.push('Quantity must be at least 1');
    }
    if (shippingType === 'flat' && !flatRateAmount) {
      errors.push('Flat rate amount is required when using flat rate shipping');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showError('Please fix the validation errors');
      return;
    }

    try {
      const formData = new FormData();

      // Add photos
      files.forEach((file) => {
        formData.append('photos', file);
      });

      // Add core fields
      formData.append('title', title.trim());
      if (subtitle.trim()) {
        formData.append('subtitle', subtitle.trim());
      }
      formData.append('description', description.trim());
      formData.append('condition', condition);

      // Add pricing & inventory
      if (defaultPrice) {
        formData.append('defaultPrice', defaultPrice);
      }
      formData.append('quantity', quantity);
      if (location.trim()) {
        formData.append('location', location.trim());
      }
      if (costBasis) {
        formData.append('costBasis', costBasis);
      }

      // Add shipping
      if (shippingType) {
        formData.append('shippingType', shippingType);
      }
      if (shippingType === 'flat' && flatRateAmount) {
        formData.append('flatRateAmount', flatRateAmount);
      }
      formData.append('domesticOnly', String(domesticOnly));

      // Add category
      if (categoryPath.trim()) {
        const pathArray = categoryPath.split('>').map((s) => s.trim());
        formData.append('categoryPath', JSON.stringify(pathArray));
      }

      // Add attributes
      if (attributes.length > 0) {
        formData.append('attributes', JSON.stringify(attributes));
      }

      const result = await createItem(formData).unwrap();

      showSuccess('Item created and added to inventory');
      navigate({ to: '/items/$id', params: { id: result.item.id } });
    } catch (err) {
      console.error('Failed to create item:', err);
      showError('Failed to create item');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/items' })}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Inventory
          </Button>
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Package className="h-8 w-8" />
          Create New Item
        </h1>
        <p className="text-muted-foreground mt-1">
          Manually add an item to your inventory
        </p>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <ul className="list-disc list-inside space-y-1 text-destructive">
              {validationErrors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photos */}
        <Card>
          <CardHeader>
            <CardTitle>Photos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50',
                files.length > 0 && 'p-4'
              )}
            >
              <input {...getInputProps()} />
              {files.length === 0 ? (
                <>
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">
                    {isDragActive ? 'Drop photos here' : 'Drag & drop photos here'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to select files
                  </p>
                </>
              ) : (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Upload className="h-4 w-4" />
                  Add more photos
                </div>
              )}
            </div>

            {previews.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {previews.map((preview, index) => (
                  <div
                    key={index}
                    className={cn(
                      'relative group aspect-square rounded-lg overflow-hidden bg-muted',
                      draggedIndex === index && 'opacity-50'
                    )}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <img
                      src={preview}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1 left-1 p-1 bg-black/50 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                      <GripVertical className="h-3 w-3 text-white" />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-medium rounded">
                        Primary
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Core Details */}
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
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Vintage Canon AE-1 Camera"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle (Optional)</Label>
              <Input
                id="subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
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
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the item's features, condition, and any defects..."
                rows={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="condition">
                Condition <span className="text-destructive">*</span>
              </Label>
              <Select value={condition} onValueChange={setCondition}>
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

        {/* Pricing & Inventory */}
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
                  onChange={(e) => setDefaultPrice(e.target.value)}
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
                  onChange={(e) => setQuantity(e.target.value)}
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
                  onChange={(e) => setLocation(e.target.value)}
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
                  onChange={(e) => setCostBasis(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping */}
        <Card>
          <CardHeader>
            <CardTitle>Shipping</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shippingType">Shipping Type</Label>
              <Select value={shippingType} onValueChange={setShippingType}>
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
                  onChange={(e) => setFlatRateAmount(e.target.value)}
                  placeholder="0.00"
                  required={shippingType === 'flat'}
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="domesticOnly"
                checked={domesticOnly}
                onCheckedChange={(checked) => setDomesticOnly(checked as boolean)}
              />
              <Label htmlFor="domesticOnly" className="cursor-pointer">
                Domestic shipping only
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Category & Attributes (Collapsible) */}
        <Card>
          <CardHeader
            className="cursor-pointer"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
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
                  onChange={(e) => setCategoryPath(e.target.value)}
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
                        onClick={() => removeAttribute(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <div className="flex gap-2">
                    <Input
                      value={newAttrKey}
                      onChange={(e) => setNewAttrKey(e.target.value)}
                      placeholder="Key (e.g., Brand)"
                      className="flex-1"
                    />
                    <Input
                      value={newAttrValue}
                      onChange={(e) => setNewAttrValue(e.target.value)}
                      placeholder="Value (e.g., Canon)"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addAttribute}
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

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ to: '/items' })}
          >
            Cancel
          </Button>
          <Button type="submit" size="lg" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Item'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
