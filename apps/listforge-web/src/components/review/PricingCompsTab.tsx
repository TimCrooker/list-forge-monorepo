import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from '@listforge/ui';
import { ExternalLink, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import type {
  MarketplaceSoldEvidence,
  MarketplaceActiveEvidence,
  ResearchSnapshot,
} from '@listforge/core-types';

interface PricingCompsTabProps {
  soldComps: MarketplaceSoldEvidence[];
  activeComps: MarketplaceActiveEvidence[];
  researchSnapshot: ResearchSnapshot | null;
}

export function PricingCompsTab({
  soldComps,
  activeComps,
  researchSnapshot,
}: PricingCompsTabProps) {
  const formatPrice = (price: number) => `$${price.toFixed(2)}`;
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      {/* Pricing Stats Summary */}
      {researchSnapshot && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Pricing Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {/* Sold Stats */}
              {researchSnapshot.soldPrices && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="text-xs font-medium">
                      Sold ({researchSnapshot.soldComps})
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Median</p>
                      <p className="font-semibold">
                        {formatPrice(researchSnapshot.soldPrices.median)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg</p>
                      <p className="font-medium">
                        {formatPrice(researchSnapshot.soldPrices.avg)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Min</p>
                      <p>{formatPrice(researchSnapshot.soldPrices.min)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Max</p>
                      <p>{formatPrice(researchSnapshot.soldPrices.max)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Active Stats */}
              {researchSnapshot.activePrices && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <TrendingDown className="h-3 w-3 text-blue-600" />
                    <span className="text-xs font-medium">
                      Active ({researchSnapshot.activeComps})
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Median</p>
                      <p className="font-semibold">
                        {formatPrice(researchSnapshot.activePrices.median)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg</p>
                      <p className="font-medium">
                        {formatPrice(researchSnapshot.activePrices.avg)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Min</p>
                      <p>{formatPrice(researchSnapshot.activePrices.min)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Max</p>
                      <p>{formatPrice(researchSnapshot.activePrices.max)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {researchSnapshot.searchedAt && (
              <p className="text-xs text-muted-foreground mt-3 pt-2 border-t">
                Searched {formatDate(researchSnapshot.searchedAt)}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sold Comps */}
      {soldComps.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Sold Listings ({soldComps.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-64 overflow-y-auto">
              {soldComps.map((comp, idx) => (
                <div key={idx} className="p-3 hover:bg-muted/50">
                  <div className="flex gap-3">
                    {/* Thumbnail */}
                    {comp.thumbUrl && (
                      <div className="w-12 h-12 rounded bg-muted flex-shrink-0 overflow-hidden">
                        <img
                          src={comp.thumbUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-medium line-clamp-2">
                          {comp.title}
                        </p>
                        {comp.url && (
                          <a
                            href={comp.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground flex-shrink-0"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-semibold text-green-600">
                          {formatPrice(comp.price)}
                        </span>
                        {comp.condition && (
                          <Badge variant="outline" className="text-xs py-0">
                            {comp.condition}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Sold {formatDate(comp.soldDate)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Comps */}
      {activeComps.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-blue-600" />
              Active Listings ({activeComps.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-64 overflow-y-auto">
              {activeComps.map((comp, idx) => (
                <div key={idx} className="p-3 hover:bg-muted/50">
                  <div className="flex gap-3">
                    {/* Thumbnail */}
                    {comp.thumbUrl && (
                      <div className="w-12 h-12 rounded bg-muted flex-shrink-0 overflow-hidden">
                        <img
                          src={comp.thumbUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-medium line-clamp-2">
                          {comp.title}
                        </p>
                        {comp.url && (
                          <a
                            href={comp.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground flex-shrink-0"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-semibold text-blue-600">
                          {formatPrice(comp.price)}
                        </span>
                        {comp.sellerRating && (
                          <span className="text-xs text-muted-foreground">
                            ★ {comp.sellerRating}%
                          </span>
                        )}
                      </div>
                      {comp.timeLeft && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {comp.timeLeft}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {soldComps.length === 0 && activeComps.length === 0 && !researchSnapshot && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No comparable listings found</p>
              <p className="text-xs mt-1">
                Comps are gathered during AI processing
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
