import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from '@listforge/ui';
import {
  DollarSign,
  Tag,
  FileText,
  List,
  Package,
} from 'lucide-react';
import type { ItemDto } from '@listforge/api-types';

interface ListingCardProps {
  draft: ItemDto;
  onRerunAi?: () => void;
  isRerunningAi?: boolean;
  onUpdate?: (data: any) => Promise<void>;
}

export function ListingCard({ draft: item }: ListingCardProps) {
  const primaryImage = item.media.find((m) => m.isPrimary) || item.media[0];

  return (
    <div className="space-y-6">
      {/* Primary Image */}
      {primaryImage && (
        <div className="aspect-video rounded-lg overflow-hidden bg-muted">
          <img
            src={primaryImage.url}
            alt={item.title || 'Item photo'}
            className="w-full h-full object-contain"
          />
        </div>
      )}

      {/* Image Gallery (if multiple) */}
      {item.media.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {item.media.map((media, index) => (
            <div
              key={media.id}
              className={`w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-muted ${
                media.isPrimary ? 'ring-2 ring-primary' : ''
              }`}
            >
              <img
                src={media.url}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Title & Price */}
      <div>
          <h2 className="text-xl font-bold">
          {item.title || 'Untitled Item'}
          </h2>
        {item.subtitle && (
          <p className="text-muted-foreground mt-1">{item.subtitle}</p>
        )}
        <div className="flex items-center gap-4 mt-3">
          {item.defaultPrice ? (
            <span className="text-2xl font-bold text-primary">
              ${item.defaultPrice.toFixed(2)}
            </span>
          ) : (
            <span className="text-lg text-muted-foreground">No price set</span>
          )}
          {item.condition && (
            <Badge variant="secondary">{item.condition}</Badge>
          )}
          {item.aiConfidenceScore !== null && (
            <Badge variant="outline">
              {(item.aiConfidenceScore * 100).toFixed(0)}% confidence
            </Badge>
          )}
        </div>
      </div>

      {/* Description */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm">Description</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {item.description ? (
            <p className="text-sm whitespace-pre-wrap line-clamp-6">
              {item.description}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">No description</p>
          )}
        </CardContent>
      </Card>

      {/* Category & Attributes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {item.categoryPath && item.categoryPath.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm">Category</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{item.categoryPath.join(' > ')}</p>
            </CardContent>
          </Card>
        )}

        {item.attributes && item.attributes.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <List className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm">Key Attributes</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {item.attributes.slice(0, 5).map((attr, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{attr.key}</span>
                    <span>{attr.value}</span>
                  </div>
                ))}
                {item.attributes.length > 5 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    +{item.attributes.length - 5} more attributes
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pricing Details */}
      {(item.priceMin || item.priceMax) && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm">Pricing Range</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {item.priceMin && (
                <div>
                  <p className="text-xs text-muted-foreground">Min</p>
                  <p className="font-medium">${item.priceMin.toFixed(2)}</p>
                </div>
              )}
              {item.defaultPrice && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Default</p>
                  <p className="font-bold text-primary">
                    ${item.defaultPrice.toFixed(2)}
                  </p>
                </div>
              )}
              {item.priceMax && (
                <div>
                  <p className="text-xs text-muted-foreground">Max</p>
                  <p className="font-medium">${item.priceMax.toFixed(2)}</p>
                </div>
              )}
              {item.pricingStrategy && (
                <Badge variant="outline" className="ml-auto">
                  {item.pricingStrategy}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory Details */}
      {(item.quantity > 1 || item.location || item.costBasis) && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm">Inventory</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {item.quantity > 1 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantity</span>
                  <span>{item.quantity}</span>
                </div>
              )}
              {item.location && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location</span>
                  <span>{item.location}</span>
                </div>
              )}
              {item.costBasis && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cost Basis</span>
                  <span>${item.costBasis.toFixed(2)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Notes */}
      {(item.userTitleHint || item.userDescriptionHint || item.userNotes) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">User Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {item.userTitleHint && (
              <div>
                <p className="text-xs text-muted-foreground">What is this?</p>
                <p className="text-sm">{item.userTitleHint}</p>
              </div>
            )}
            {item.userDescriptionHint && (
              <div>
                <p className="text-xs text-muted-foreground">Details</p>
                <p className="text-sm">{item.userDescriptionHint}</p>
              </div>
            )}
            {item.userNotes && (
              <div>
                <p className="text-xs text-muted-foreground">Notes</p>
                <p className="text-sm">{item.userNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
