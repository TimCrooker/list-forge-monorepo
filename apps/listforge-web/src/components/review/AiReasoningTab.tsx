import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@listforge/ui';
import {
  Brain,
  DollarSign,
  Tag,
  FileText,
  Truck,
  Eye,
  Info,
} from 'lucide-react';
import type { SummaryEvidence, SummaryKind } from '@listforge/core-types';

interface AiReasoningTabProps {
  summaries: SummaryEvidence[];
}

const SUMMARY_CONFIG: Record<
  SummaryKind,
  { label: string; icon: React.ReactNode; color: string }
> = {
  pricing_overview: {
    label: 'Pricing Rationale',
    icon: <DollarSign className="h-4 w-4" />,
    color: 'text-green-600',
  },
  condition_overview: {
    label: 'Condition Assessment',
    icon: <Eye className="h-4 w-4" />,
    color: 'text-blue-600',
  },
  category_justification: {
    label: 'Category Selection',
    icon: <Tag className="h-4 w-4" />,
    color: 'text-purple-600',
  },
  title_rationale: {
    label: 'Title Generation',
    icon: <FileText className="h-4 w-4" />,
    color: 'text-orange-600',
  },
  description_rationale: {
    label: 'Description Generation',
    icon: <FileText className="h-4 w-4" />,
    color: 'text-orange-500',
  },
  shipping_recommendation: {
    label: 'Shipping Suggestion',
    icon: <Truck className="h-4 w-4" />,
    color: 'text-cyan-600',
  },
};

export function AiReasoningTab({ summaries }: AiReasoningTabProps) {
  // Group summaries by kind
  const summaryMap = new Map<SummaryKind, SummaryEvidence[]>();
  for (const summary of summaries) {
    const existing = summaryMap.get(summary.kind) || [];
    summaryMap.set(summary.kind, [...existing, summary]);
  }

  // Order by importance
  const orderedKinds: SummaryKind[] = [
    'pricing_overview',
    'category_justification',
    'condition_overview',
    'title_rationale',
    'description_rationale',
    'shipping_recommendation',
  ];

  const renderSummaryData = (data: Record<string, unknown> | undefined) => {
    if (!data || Object.keys(data).length === 0) return null;

    return (
      <div className="mt-3 pt-3 border-t">
        <p className="text-xs text-muted-foreground mb-2">Additional Data</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(data).map(([key, value]) => {
            if (value === null || value === undefined) return null;
            const displayValue =
              typeof value === 'number'
                ? key.toLowerCase().includes('price') ||
                  key.toLowerCase().includes('median')
                  ? `$${value.toFixed(2)}`
                  : value.toFixed(2)
                : String(value);

            return (
              <div key={key}>
                <p className="text-muted-foreground capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                <p className="font-medium">{displayValue}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (summaries.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No AI reasoning available</p>
            <p className="text-xs mt-1">
              Reasoning summaries are generated during AI processing
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Decision Rationale
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            {summaries.length} reasoning{summaries.length !== 1 ? 's' : ''} documented
          </p>
        </CardContent>
      </Card>

      {/* Summary Accordions */}
      <Accordion type="multiple" className="space-y-2">
        {orderedKinds.map((kind) => {
          const kindSummaries = summaryMap.get(kind);
          if (!kindSummaries || kindSummaries.length === 0) return null;

          const config = SUMMARY_CONFIG[kind];

          return (
            <AccordionItem
              key={kind}
              value={kind}
              className="border rounded-lg px-4"
            >
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-2">
                  <span className={config.color}>{config.icon}</span>
                  <span className="text-sm font-medium">{config.label}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                {kindSummaries.map((summary, idx) => (
                  <div key={idx} className={idx > 0 ? 'mt-4 pt-4 border-t' : ''}>
                    <p className="text-sm whitespace-pre-wrap">{summary.text}</p>
                    {renderSummaryData(summary.data)}
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Info Note */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              This reasoning was generated by AI to explain how decisions were made.
              Review the evidence to verify accuracy before approving.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
