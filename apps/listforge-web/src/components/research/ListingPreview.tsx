import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Textarea,
  Label,
  cn,
} from '@listforge/ui';
import {
  FileText,
  Tag,
  DollarSign,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Info,
  Edit2,
  ExternalLink,
  Package,
  Truck,
} from 'lucide-react';
import type { MarketplaceListingPayload } from '@listforge/core-types';
import { ListingStatusBadge } from './ListingStatusBadge';
import { useState } from 'react';

interface ListingPreviewProps {
  listing: MarketplaceListingPayload;
  onEditTitle?: (newTitle: string) => void;
  onEditDescription?: (newDescription: string) => void;
  disabled?: boolean;
}

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

function ValidationItem({
  valid,
  label,
  issues,
}: {
  valid: boolean;
  label: string;
  issues?: string[];
}) {
  return (
    <div className="flex items-start gap-2">
      {valid ? (
        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
      ) : (
        <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
      )}
      <div>
        <span className={cn('text-sm', valid ? 'text-foreground' : 'text-amber-600')}>
          {label}
        </span>
        {issues && issues.length > 0 && (
          <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
            {issues.map((issue, i) => (
              <li key={i} className="flex items-center gap-1">
                <Info className="h-3 w-3" />
                {issue}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function AttributesList({ attributes }: { attributes: Record<string, string | number> }) {
  const entries = Object.entries(attributes);
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">No attributes set</p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {entries.slice(0, 10).map(([key, value]) => (
        <div key={key} className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{key}:</span>
          <span className="font-medium truncate">{String(value)}</span>
        </div>
      ))}
      {entries.length > 10 && (
        <p className="text-xs text-muted-foreground col-span-2">
          + {entries.length - 10} more attributes
        </p>
      )}
    </div>
  );
}

function BulletPoints({ points }: { points: string[] }) {
  if (points.length === 0) {
    return null;
  }

  return (
    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
      {points.map((point, i) => (
        <li key={i}>{point}</li>
      ))}
    </ul>
  );
}

export function ListingPreview({
  listing,
  onEditTitle,
  onEditDescription,
  disabled = false,
}: ListingPreviewProps) {
  const [activeTab, setActiveTab] = useState('preview');
  const [isEditTitleOpen, setIsEditTitleOpen] = useState(false);
  const [isEditDescriptionOpen, setIsEditDescriptionOpen] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [editDescriptionValue, setEditDescriptionValue] = useState('');
  const { payload, validation, status, statusReason, missingRequired, confidence } = listing;

  const handleOpenEditTitle = () => {
    setEditTitleValue(payload.title);
    setIsEditTitleOpen(true);
  };

  const handleSaveTitle = () => {
    if (editTitleValue && editTitleValue !== payload.title && onEditTitle) {
      onEditTitle(editTitleValue);
    }
    setIsEditTitleOpen(false);
  };

  const handleOpenEditDescription = () => {
    setEditDescriptionValue(payload.description);
    setIsEditDescriptionOpen(true);
  };

  const handleSaveDescription = () => {
    if (editDescriptionValue && editDescriptionValue !== payload.description && onEditDescription) {
      onEditDescription(editDescriptionValue);
    }
    setIsEditDescriptionOpen(false);
  };

  const marketplaceLabel = listing.marketplace === 'ebay' ? 'eBay' : 'Amazon';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {marketplaceLabel} Listing Preview
          </CardTitle>
          <ListingStatusBadge status={status} confidence={confidence} />
        </div>
        {statusReason && (
          <p className="text-xs text-muted-foreground mt-1">{statusReason}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="validation">
              Validation
              {!validation.overallValid && (
                <span className="ml-1 h-2 w-2 rounded-full bg-amber-500" />
              )}
            </TabsTrigger>
          </TabsList>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-4 mt-4">
            {/* Title */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-muted-foreground">Title</label>
                <span className="text-xs text-muted-foreground">
                  {payload.title.length}/80 chars
                </span>
              </div>
              <div className="group relative">
                <p className="text-lg font-semibold leading-tight pr-8">{payload.title}</p>
                {onEditTitle && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleOpenEditTitle}
                    disabled={disabled}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* Price and Condition */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-2xl font-bold text-green-600">
                  {formatPrice(payload.price, payload.currency)}
                </span>
              </div>
              <Badge variant="secondary">
                {getConditionLabel(payload.conditionId)}
              </Badge>
            </div>

            <Separator />

            {/* Photos */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  {payload.photos.length} Photos
                </span>
              </div>
              {payload.photos.length > 0 ? (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {payload.photos.slice(0, 5).map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Product ${i + 1}`}
                      className="h-16 w-16 object-cover rounded-lg border"
                    />
                  ))}
                  {payload.photos.length > 5 && (
                    <div className="h-16 w-16 flex items-center justify-center bg-muted rounded-lg text-sm text-muted-foreground">
                      +{payload.photos.length - 5}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No photos attached</p>
              )}
            </div>

            <Separator />

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">Description</span>
                {onEditDescription && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleOpenEditDescription}
                    disabled={disabled}
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
              <div className="prose prose-sm max-w-none">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">
                  {payload.description}
                </p>
              </div>
              {payload.bulletPoints.length > 0 && (
                <div className="mt-3">
                  <span className="text-xs font-medium text-muted-foreground">Key Features</span>
                  <BulletPoints points={payload.bulletPoints} />
                </div>
              )}
            </div>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4 mt-4">
            {/* Category */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Category</span>
              </div>
              {payload.categoryId ? (
                <Badge variant="outline" className="text-xs">
                  Category ID: {payload.categoryId}
                </Badge>
              ) : (
                <p className="text-sm text-muted-foreground italic">No category set</p>
              )}
            </div>

            <Separator />

            {/* Attributes */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  Item Specifics ({Object.keys(payload.attributes).length})
                </span>
              </div>
              <AttributesList attributes={payload.attributes} />
            </div>

            <Separator />

            {/* Shipping */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Shipping</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={payload.shipping.freeShipping ? 'default' : 'secondary'}>
                  {payload.shipping.freeShipping
                    ? 'Free Shipping'
                    : payload.shipping.type === 'calculated'
                      ? 'Calculated'
                      : payload.shipping.cost
                        ? formatPrice(payload.shipping.cost, payload.currency)
                        : 'Flat Rate'}
                </Badge>
                {payload.shipping.handlingTime && (
                  <span className="text-xs text-muted-foreground">
                    {payload.shipping.handlingTime} day handling
                  </span>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Validation Tab */}
          <TabsContent value="validation" className="space-y-4 mt-4">
            <div className="space-y-3">
              <ValidationItem
                valid={validation.titleValid}
                label="Title"
                issues={validation.titleIssues}
              />
              <ValidationItem
                valid={validation.descriptionValid}
                label="Description"
                issues={validation.descriptionIssues}
              />
              <ValidationItem valid={validation.categoryValid} label="Category" />
              <ValidationItem valid={validation.conditionMapped} label="Condition" />
              <ValidationItem valid={validation.priceSet} label="Price" />
              <ValidationItem
                valid={validation.photosValid}
                label={`Photos (${validation.photoCount})`}
                issues={!validation.photosValid ? ['At least 1 photo required'] : undefined}
              />
              <ValidationItem
                valid={validation.attributesComplete}
                label="Required Attributes"
                issues={
                  validation.missingAttributes.length > 0
                    ? [`Missing: ${validation.missingAttributes.join(', ')}`]
                    : undefined
                }
              />
            </div>

            {missingRequired.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 mt-4">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-1">
                  Missing Required Fields
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-500">
                  {missingRequired.join(', ')}
                </p>
              </div>
            )}

            {validation.overallValid && (
              <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <p className="text-sm text-green-700 dark:text-green-400">
                  All validation checks passed
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Action Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Confidence: {Math.round(confidence * 100)}%</span>
            <span>|</span>
            <span>Generated: {new Date(listing.generatedAt).toLocaleTimeString()}</span>
          </div>
          {listing.ready && (
            <Button size="sm" className="gap-1">
              <ExternalLink className="h-3 w-3" />
              Preview on {marketplaceLabel}
            </Button>
          )}
        </div>

        {/* Edit Title Dialog */}
        <Dialog open={isEditTitleOpen} onOpenChange={setIsEditTitleOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Title</DialogTitle>
              <DialogDescription>
                Update the listing title. Maximum 80 characters recommended.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editTitleValue}
                  onChange={(e) => setEditTitleValue(e.target.value)}
                  maxLength={80}
                  placeholder="Enter title..."
                />
                <p className="text-xs text-muted-foreground text-right">
                  {editTitleValue.length}/80 characters
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditTitleOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTitle}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Description Dialog */}
        <Dialog open={isEditDescriptionOpen} onOpenChange={setIsEditDescriptionOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Description</DialogTitle>
              <DialogDescription>
                Update the listing description.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editDescriptionValue}
                  onChange={(e) => setEditDescriptionValue(e.target.value)}
                  rows={10}
                  placeholder="Enter description..."
                  className="resize-y"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDescriptionOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveDescription}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// Helper function to get condition label from eBay condition ID
function getConditionLabel(conditionId: string): string {
  const labels: Record<string, string> = {
    '1000': 'New',
    '1500': 'New (Other)',
    '2000': 'Certified Refurbished',
    '2500': 'Seller Refurbished',
    '3000': 'Used',
    '4000': 'Very Good',
    '5000': 'Good',
    '6000': 'Acceptable',
    '7000': 'For Parts',
  };
  return labels[conditionId] || 'Used';
}





