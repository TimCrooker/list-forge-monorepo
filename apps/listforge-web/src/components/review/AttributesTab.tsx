import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from '@listforge/ui';
import { List, Sparkles, User, FileInput } from 'lucide-react';
import type { ListingDraftAttribute } from '@listforge/core-types';

interface AttributesTabProps {
  attributes: ListingDraftAttribute[];
}

export function AttributesTab({ attributes }: AttributesTabProps) {
  // Group attributes by source
  const aiAttributes = attributes.filter((a) => a.source === 'ai');
  const userAttributes = attributes.filter((a) => a.source === 'user');
  const importedAttributes = attributes.filter((a) => a.source === 'imported');

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'ai':
        return <Sparkles className="h-3 w-3" />;
      case 'user':
        return <User className="h-3 w-3" />;
      case 'imported':
        return <FileInput className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getSourceBadgeVariant = (source: string) => {
    switch (source) {
      case 'ai':
        return 'secondary';
      case 'user':
        return 'default';
      case 'imported':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const renderAttributeRow = (attr: ListingDraftAttribute, idx: number) => (
    <div
      key={idx}
      className="flex items-center justify-between py-2 border-b last:border-0"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm text-muted-foreground truncate max-w-[100px]">
          {attr.key}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium truncate max-w-[120px]">
          {attr.value}
        </span>
        {attr.confidence !== undefined && (
          <div className="flex items-center gap-1">
            <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${getConfidenceColor(attr.confidence)}`}
                style={{ width: `${attr.confidence * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground w-8">
              {Math.round(attr.confidence * 100)}%
            </span>
          </div>
        )}
        <Badge
          variant={getSourceBadgeVariant(attr.source) as any}
          className="text-xs py-0 px-1.5 gap-0.5"
        >
          {getSourceIcon(attr.source)}
          {attr.source === 'ai' ? 'AI' : attr.source === 'user' ? 'User' : 'Import'}
        </Badge>
      </div>
    </div>
  );

  if (attributes.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <List className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No attributes extracted</p>
            <p className="text-xs mt-1">
              Attributes are extracted during AI processing
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <List className="h-4 w-4" />
            Attributes ({attributes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 text-xs">
            {aiAttributes.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Badge variant="secondary" className="text-xs py-0 px-1.5 gap-0.5">
                  <Sparkles className="h-3 w-3" />
                  AI
                </Badge>
                <span className="text-muted-foreground">{aiAttributes.length}</span>
              </div>
            )}
            {userAttributes.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Badge variant="default" className="text-xs py-0 px-1.5 gap-0.5">
                  <User className="h-3 w-3" />
                  User
                </Badge>
                <span className="text-muted-foreground">{userAttributes.length}</span>
              </div>
            )}
            {importedAttributes.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-xs py-0 px-1.5 gap-0.5">
                  <FileInput className="h-3 w-3" />
                  Import
                </Badge>
                <span className="text-muted-foreground">{importedAttributes.length}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Attributes */}
      {aiAttributes.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              AI-Extracted ({aiAttributes.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y">
              {aiAttributes.map((attr, idx) => renderAttributeRow(attr, idx))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Attributes */}
      {userAttributes.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4 text-blue-500" />
              User-Provided ({userAttributes.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y">
              {userAttributes.map((attr, idx) => renderAttributeRow(attr, idx))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Imported Attributes */}
      {importedAttributes.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileInput className="h-4 w-4 text-gray-500" />
              Imported ({importedAttributes.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y">
              {importedAttributes.map((attr, idx) => renderAttributeRow(attr, idx))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
