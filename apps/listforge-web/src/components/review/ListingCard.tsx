import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@listforge/ui';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  DollarSign,
  Tag,
  FileText,
  List,
  TrendingUp,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import type { ListingDraftDto, UpdateListingDraftRequest } from '@listforge/api-types';
import type { ComponentStatus } from '@listforge/core-types';
import { InlineEditField } from './InlineEditField';
import { ComponentFlagToggle } from './ComponentFlagToggle';

interface ListingCardProps {
  draft: ListingDraftDto;
  onRerunAi?: () => void;
  isRerunningAi?: boolean;
  onUpdate?: (data: UpdateListingDraftRequest) => Promise<void>;
}

export function ListingCard({ draft, onRerunAi, isRerunningAi, onUpdate }: ListingCardProps) {
  const [rerunDialogOpen, setRerunDialogOpen] = useState(false);

  const handleRerunAi = () => {
    setRerunDialogOpen(false);
    onRerunAi?.();
  };

  const isAiProcessing =
    draft.ingestionStatus === 'ai_queued' || draft.ingestionStatus === 'ai_running';

  // Create update handlers for each field
  const handleUpdateField = async (field: keyof UpdateListingDraftRequest, value: string | number | null) => {
    if (!onUpdate) return;
    await onUpdate({ [field]: value } as UpdateListingDraftRequest);
  };

  const getStatusIcon = (status: ComponentStatus) => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'needs_review':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'flagged':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: ComponentStatus) => {
    switch (status) {
      case 'ok':
        return 'OK';
      case 'needs_review':
        return 'Needs Review';
      case 'flagged':
        return 'Flagged';
      default:
        return status;
    }
  };

  const primaryImage = draft.media.find((m) => m.isPrimary) || draft.media[0];

  return (
    <div className="space-y-6">
      {/* Primary Image */}
      {primaryImage && (
        <div className="aspect-video rounded-lg overflow-hidden bg-muted">
          <img
            src={primaryImage.url}
            alt={draft.title || 'Item photo'}
            className="w-full h-full object-contain"
          />
        </div>
      )}

      {/* Image Gallery (if multiple) */}
      {draft.media.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {draft.media.map((media, index) => (
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
        {onUpdate ? (
          <InlineEditField
            value={draft.title || draft.userTitleHint || ''}
            onSave={(val) => handleUpdateField('title', val)}
            type="text"
            placeholder="Enter title"
            emptyText="Untitled Item"
            displayClassName="text-xl font-bold"
          />
        ) : (
          <h2 className="text-xl font-bold">
            {draft.title || draft.userTitleHint || 'Untitled Item'}
          </h2>
        )}
        {draft.subtitle && (
          <p className="text-muted-foreground mt-1">{draft.subtitle}</p>
        )}
        <div className="flex items-center gap-4 mt-3">
          {onUpdate ? (
            <InlineEditField
              value={draft.suggestedPrice}
              onSave={(val) => handleUpdateField('suggestedPrice', val)}
              type="price"
              placeholder="0.00"
              emptyText="No price"
              displayClassName="text-2xl font-bold text-primary"
            />
          ) : draft.suggestedPrice ? (
            <span className="text-2xl font-bold text-primary">
              ${draft.suggestedPrice.toFixed(2)}
            </span>
          ) : null}
          {draft.condition && (
            <Badge variant="secondary">{draft.condition}</Badge>
          )}
          {draft.aiConfidenceScore !== null && (
            <Badge variant="outline">
              {(draft.aiConfidenceScore * 100).toFixed(0)}% confidence
            </Badge>
          )}
        </div>

        {/* Research Snapshot Chip */}
        {draft.researchSnapshot && (
          <div className="mt-3">
            <Badge
              variant="secondary"
              className="gap-1.5 text-xs py-1 px-2"
            >
              <TrendingUp className="h-3 w-3" />
              {draft.researchSnapshot.soldComps + draft.researchSnapshot.activeComps} comps
              {draft.researchSnapshot.soldPrices && (
                <span className="text-muted-foreground ml-1">
                  · ${draft.researchSnapshot.soldPrices.min.toFixed(0)}–$
                  {draft.researchSnapshot.soldPrices.max.toFixed(0)} range
                </span>
              )}
            </Badge>
          </div>
        )}

        {/* Re-run AI Button */}
        {onRerunAi && (
          <div className="mt-4">
            <AlertDialog open={rerunDialogOpen} onOpenChange={setRerunDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isAiProcessing || isRerunningAi}
                >
                  {isRerunningAi || isAiProcessing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  {isAiProcessing ? 'AI Processing...' : 'Re-run AI'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Re-run AI Analysis?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will re-process the item photos and generate new AI
                    suggestions for title, description, pricing, and category.
                    Any manual edits you've made will be preserved and AI will
                    suggest updates alongside them.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRerunAi}>
                    Re-run AI
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {/* Component Status Indicators */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Component Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Title</span>
              <div className="ml-auto">
                {onUpdate ? (
                  <ComponentFlagToggle
                    status={draft.titleStatus}
                    onStatusChange={(status) => handleUpdateField('titleStatus', status as unknown as string)}
                  />
                ) : (
                  <div className="flex items-center gap-1">
                    {getStatusIcon(draft.titleStatus)}
                    <span className="text-xs text-muted-foreground">
                      {getStatusLabel(draft.titleStatus)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Description</span>
              <div className="ml-auto">
                {onUpdate ? (
                  <ComponentFlagToggle
                    status={draft.descriptionStatus}
                    onStatusChange={(status) => handleUpdateField('descriptionStatus', status as unknown as string)}
                  />
                ) : (
                  <div className="flex items-center gap-1">
                    {getStatusIcon(draft.descriptionStatus)}
                    <span className="text-xs text-muted-foreground">
                      {getStatusLabel(draft.descriptionStatus)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Category</span>
              <div className="ml-auto">
                {onUpdate ? (
                  <ComponentFlagToggle
                    status={draft.categoryStatus}
                    onStatusChange={(status) => handleUpdateField('categoryStatus', status as unknown as string)}
                  />
                ) : (
                  <div className="flex items-center gap-1">
                    {getStatusIcon(draft.categoryStatus)}
                    <span className="text-xs text-muted-foreground">
                      {getStatusLabel(draft.categoryStatus)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Pricing</span>
              <div className="ml-auto">
                {onUpdate ? (
                  <ComponentFlagToggle
                    status={draft.pricingStatus}
                    onStatusChange={(status) => handleUpdateField('pricingStatus', status as unknown as string)}
                  />
                ) : (
                  <div className="flex items-center gap-1">
                    {getStatusIcon(draft.pricingStatus)}
                    <span className="text-xs text-muted-foreground">
                      {getStatusLabel(draft.pricingStatus)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <List className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Attributes</span>
              <div className="ml-auto">
                {onUpdate ? (
                  <ComponentFlagToggle
                    status={draft.attributesStatus}
                    onStatusChange={(status) => handleUpdateField('attributesStatus', status as unknown as string)}
                  />
                ) : (
                  <div className="flex items-center gap-1">
                    {getStatusIcon(draft.attributesStatus)}
                    <span className="text-xs text-muted-foreground">
                      {getStatusLabel(draft.attributesStatus)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Description</CardTitle>
        </CardHeader>
        <CardContent>
          {onUpdate ? (
            <InlineEditField
              value={draft.description}
              onSave={(val) => handleUpdateField('description', val)}
              type="textarea"
              placeholder="Enter description"
              emptyText="No description"
              displayClassName="text-sm"
            />
          ) : draft.description ? (
            <p className="text-sm whitespace-pre-wrap line-clamp-6">
              {draft.description}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">No description</p>
          )}
        </CardContent>
      </Card>

      {/* Category & Attributes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {draft.categoryPath && draft.categoryPath.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Category</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{draft.categoryPath.join(' > ')}</p>
            </CardContent>
          </Card>
        )}

        {draft.attributes && draft.attributes.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Key Attributes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {draft.attributes.slice(0, 5).map((attr, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{attr.key}</span>
                    <span>{attr.value}</span>
                  </div>
                ))}
                {draft.attributes.length > 5 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    +{draft.attributes.length - 5} more attributes
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pricing Details */}
      {(draft.priceMin || draft.priceMax) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Pricing Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {draft.priceMin && (
                <div>
                  <p className="text-xs text-muted-foreground">Min</p>
                  <p className="font-medium">${draft.priceMin.toFixed(2)}</p>
                </div>
              )}
              {draft.suggestedPrice && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Suggested</p>
                  <p className="font-bold text-primary">
                    ${draft.suggestedPrice.toFixed(2)}
                  </p>
                </div>
              )}
              {draft.priceMax && (
                <div>
                  <p className="text-xs text-muted-foreground">Max</p>
                  <p className="font-medium">${draft.priceMax.toFixed(2)}</p>
                </div>
              )}
              {draft.pricingStrategy && (
                <Badge variant="outline" className="ml-auto">
                  {draft.pricingStrategy}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Notes */}
      {(draft.userTitleHint || draft.userDescriptionHint || draft.userNotes) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">User Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {draft.userTitleHint && (
              <div>
                <p className="text-xs text-muted-foreground">What is this?</p>
                <p className="text-sm">{draft.userTitleHint}</p>
              </div>
            )}
            {draft.userDescriptionHint && (
              <div>
                <p className="text-xs text-muted-foreground">Details</p>
                <p className="text-sm">{draft.userDescriptionHint}</p>
              </div>
            )}
            {draft.userNotes && (
              <div>
                <p className="text-xs text-muted-foreground">Notes</p>
                <p className="text-sm">{draft.userNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
