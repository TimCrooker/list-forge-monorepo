import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@listforge/ui';
import { ClipboardList, Check, X, ChevronDown, ChevronUp, AlertCircle, Lightbulb } from 'lucide-react';
import type { FieldCompletion } from '@listforge/core-types';

interface FieldRequirementsCardProps {
  fieldCompletion: FieldCompletion | null | undefined;
}

function FieldStatusIcon({ isFilled }: { isFilled: boolean }) {
  if (isFilled) {
    return (
      <div className="p-1 rounded-full bg-green-100">
        <Check className="h-3 w-3 text-green-600" />
      </div>
    );
  }
  return (
    <div className="p-1 rounded-full bg-red-100">
      <X className="h-3 w-3 text-red-600" />
    </div>
  );
}

function FieldList({
  title,
  filled,
  total,
  missing,
  isRequired,
}: {
  title: string;
  filled: number;
  total: number;
  missing: string[];
  isRequired: boolean;
}) {
  const [isOpen, setIsOpen] = useState(isRequired && missing.length > 0);

  if (total === 0) {
    return null;
  }

  const allFilled = missing.length === 0;
  const statusColor = allFilled
    ? 'text-green-600'
    : isRequired
      ? 'text-red-600'
      : 'text-amber-600';

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
          <div className="flex items-center gap-2">
            {isRequired ? (
              <AlertCircle className={`h-4 w-4 ${allFilled ? 'text-green-600' : 'text-red-600'}`} />
            ) : (
              <Lightbulb className={`h-4 w-4 ${allFilled ? 'text-green-600' : 'text-amber-600'}`} />
            )}
            <span className="text-sm font-medium">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm ${statusColor}`}>
              {filled}/{total}
            </span>
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 space-y-1 pl-4">
          {missing.map((field) => (
            <div
              key={field}
              className="flex items-center gap-2 py-1.5 px-2 text-sm"
            >
              <FieldStatusIcon isFilled={false} />
              <span className="text-muted-foreground">{field}</span>
              {isRequired && (
                <Badge variant="outline" className="text-xs text-red-600 border-red-200">
                  Required
                </Badge>
              )}
            </div>
          ))}
          {/* Show a summary of filled fields */}
          {filled > 0 && (
            <div className="flex items-center gap-2 py-1.5 px-2 text-sm text-green-600">
              <FieldStatusIcon isFilled={true} />
              <span>{filled} field{filled !== 1 ? 's' : ''} filled</span>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function FieldRequirementsCard({ fieldCompletion }: FieldRequirementsCardProps) {
  if (!fieldCompletion) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Field Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No field requirements available</p>
            <p className="text-xs mt-1">Requirements will be detected with category</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { required, recommended } = fieldCompletion;
  const hasAllRequired = required.missing.length === 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Field Requirements
          </CardTitle>
          {hasAllRequired ? (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
              <Check className="h-3 w-3 mr-1" />
              All Required Filled
            </Badge>
          ) : (
            <Badge variant="destructive">
              <X className="h-3 w-3 mr-1" />
              {required.missing.length} Missing
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Required Fields */}
        <FieldList
          title="Required Fields"
          filled={required.filled}
          total={required.total}
          missing={required.missing}
          isRequired={true}
        />

        {/* Recommended Fields */}
        <FieldList
          title="Recommended Fields"
          filled={recommended.filled}
          total={recommended.total}
          missing={recommended.missing}
          isRequired={false}
        />

        {/* Improvement tip */}
        {recommended.missing.length > 0 && hasAllRequired && (
          <div className="text-xs text-muted-foreground bg-blue-50 rounded-lg p-3 flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              Adding recommended fields like <strong>{recommended.missing.slice(0, 2).join(', ')}</strong>
              {recommended.missing.length > 2 ? ` and ${recommended.missing.length - 2} more` : ''} can improve your listing visibility.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
