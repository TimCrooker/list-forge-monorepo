import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
  EmptyState,
} from '@listforge/ui';
import { FolderTree, ChevronRight, Info, ExternalLink } from 'lucide-react';
import type { MarketplaceCategory } from '@listforge/core-types';
import { ConfidenceBadge, MarketplaceBadge } from '@/components/common';

interface CategoryPathCardProps {
  marketplaceCategory: MarketplaceCategory | null | undefined;
}

export function CategoryPathCard({ marketplaceCategory }: CategoryPathCardProps) {
  if (!marketplaceCategory) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FolderTree className="h-4 w-4" />
            Marketplace Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={FolderTree}
            title="No category detected"
            description="Category will be detected during research"
            size="sm"
          />
        </CardContent>
      </Card>
    );
  }

  const { categoryPath, categoryId, confidence, marketplace, conditionId } = marketplaceCategory;

  // Build eBay category URL
  const ebayUrl = marketplace === 'ebay'
    ? `https://www.ebay.com/b/${categoryId}`
    : undefined;

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <FolderTree className="h-4 w-4" />
              Marketplace Category
            </CardTitle>
            <div className="flex items-center gap-2">
              <MarketplaceBadge marketplace={marketplace} />
              <ConfidenceBadge confidence={confidence} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Category Path Breadcrumb */}
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center flex-wrap gap-1 text-sm">
              {categoryPath.map((segment, index) => (
                <span key={index} className="flex items-center">
                  {index > 0 && (
                    <ChevronRight className="h-3 w-3 text-muted-foreground mx-1" />
                  )}
                  <span
                    className={
                      index === categoryPath.length - 1
                        ? 'font-medium text-foreground'
                        : 'text-muted-foreground'
                    }
                  >
                    {segment}
                  </span>
                </span>
              ))}
            </div>

            {/* Category metadata */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-muted">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <Tooltip>
                  <TooltipTrigger className="flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    <span>ID: {categoryId}</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>eBay Category ID used for listing</p>
                  </TooltipContent>
                </Tooltip>

                {conditionId && (
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1">
                      <span>Condition: {conditionId}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>eBay Condition ID for this category</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>

              {ebayUrl && (
                <a
                  href={ebayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  View on eBay
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
