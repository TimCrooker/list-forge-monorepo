import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Card,
  CardContent,
  Skeleton,
} from '@listforge/ui';
import { useGetItemEvidenceQuery } from '@listforge/api-rtk';
import { DollarSign, List, Brain, AlertCircle } from 'lucide-react';
import { PricingCompsTab } from './PricingCompsTab';
import { AttributesTab } from './AttributesTab';
import { AiReasoningTab } from './AiReasoningTab';
import type { ItemDto } from '@listforge/api-types';
import type {
  MarketplaceSoldEvidence,
  MarketplaceActiveEvidence,
  SummaryEvidence,
} from '@listforge/core-types';

interface EvidencePanelProps {
  draftId?: string | null;
  draft?: ItemDto | null;
  itemId?: string | null;
  item?: ItemDto | null;
}

export function EvidencePanel({ draftId, itemId, item }: EvidencePanelProps) {
  // Use either draftId or itemId (draftId for backward compatibility with review page)
  const effectiveItemId = itemId || draftId;

  const { data, isLoading, error } = useGetItemEvidenceQuery(effectiveItemId!, {
    skip: !effectiveItemId,
  });

  // Filter evidence items by type
  const soldComps: MarketplaceSoldEvidence[] = [];
  const activeComps: MarketplaceActiveEvidence[] = [];
  const summaries: SummaryEvidence[] = [];

  if (data?.bundle?.items) {
    for (const item of data.bundle.items) {
      if (item.data.type === 'marketplace_sold') {
        soldComps.push(item.data as MarketplaceSoldEvidence);
      } else if (item.data.type === 'marketplace_active') {
        activeComps.push(item.data as MarketplaceActiveEvidence);
      } else if (item.data.type === 'summary') {
        summaries.push(item.data as SummaryEvidence);
      }
    }
  }

  if (!effectiveItemId) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <p className="text-sm">Select an item to view evidence</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">Failed to load evidence</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasEvidence = data?.bundle && data.bundle.items.length > 0;

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 pt-4 pb-2">
        <h3 className="font-semibold text-sm">Evidence & Research</h3>
        {data?.bundle && (
          <p className="text-xs text-muted-foreground mt-1">
            Generated {new Date(data.bundle.generatedAt).toLocaleDateString()}
          </p>
        )}
      </div>

      <Tabs defaultValue="pricing" className="flex-1 flex flex-col">
        <div className="px-4">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="pricing" className="text-xs gap-1">
              <DollarSign className="h-3 w-3" />
              Comps
            </TabsTrigger>
            <TabsTrigger value="attributes" className="text-xs gap-1">
              <List className="h-3 w-3" />
              Attrs
            </TabsTrigger>
            <TabsTrigger value="reasoning" className="text-xs gap-1">
              <Brain className="h-3 w-3" />
              AI
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="pricing" className="m-0 p-4">
            <PricingCompsTab
              soldComps={soldComps}
              activeComps={activeComps}
              researchSnapshot={null}
            />
          </TabsContent>

          <TabsContent value="attributes" className="m-0 p-4">
            <AttributesTab attributes={item?.attributes ?? []} />
          </TabsContent>

          <TabsContent value="reasoning" className="m-0 p-4">
            <AiReasoningTab summaries={summaries} />
          </TabsContent>
        </div>
      </Tabs>

      {!hasEvidence && (
        <div className="p-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <p className="text-sm">No evidence available yet</p>
                <p className="text-xs mt-1">
                  Evidence is generated during AI processing
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
