import { useState } from 'react';
import {
  SettingsType,
  SettingsVersionDto,
  SETTINGS_TYPE_LABELS,
} from '@listforge/api-types';
import { useGetSettingsVersionsQuery } from '@listforge/api-rtk';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Button,
  Badge,
  Skeleton,
  cn,
} from '@listforge/ui';
import { History, RotateCcw, User, Clock, CheckCircle2 } from 'lucide-react';
import { RevertSettingsDialog } from './RevertSettingsDialog';

interface SettingsVersionHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  settingsType: SettingsType;
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Sheet component for viewing settings version history
 *
 * Shows up to 5 versions with ability to revert to any
 */
export function SettingsVersionHistory({
  open,
  onOpenChange,
  orgId,
  settingsType,
}: SettingsVersionHistoryProps) {
  const [revertVersion, setRevertVersion] = useState<SettingsVersionDto | null>(null);

  const { data, isLoading, refetch } = useGetSettingsVersionsQuery(
    { orgId, settingsType },
    { skip: !open },
  );

  const versions = data?.versions || [];
  const settingsTypeLabel = SETTINGS_TYPE_LABELS[settingsType] || settingsType;

  const handleRevertSuccess = () => {
    setRevertVersion(null);
    refetch();
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[450px] sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              {settingsTypeLabel} History
            </SheetTitle>
            <SheetDescription>
              View and revert to previous versions. Up to 5 versions are kept.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-8">
                <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No version history yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Versions are created when settings are saved
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {versions.map((version, index) => (
                  <VersionCard
                    key={version.id}
                    version={version}
                    isCurrent={index === 0}
                    onRevert={() => setRevertVersion(version)}
                  />
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Revert confirmation dialog */}
      {revertVersion && (
        <RevertSettingsDialog
          open={!!revertVersion}
          onOpenChange={(open) => !open && setRevertVersion(null)}
          orgId={orgId}
          version={revertVersion}
          onSuccess={handleRevertSuccess}
        />
      )}
    </>
  );
}

interface VersionCardProps {
  version: SettingsVersionDto;
  isCurrent: boolean;
  onRevert: () => void;
}

function VersionCard({ version, isCurrent, onRevert }: VersionCardProps) {
  return (
    <div
      className={cn(
        'border rounded-lg p-4',
        isCurrent && 'border-primary bg-primary/5',
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium">Version {version.versionNumber}</span>
            {isCurrent && (
              <Badge variant="default" className="text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Current
              </Badge>
            )}
            {version.isRevert && (
              <Badge variant="outline" className="text-xs">
                <RotateCcw className="h-3 w-3 mr-1" />
                Revert
              </Badge>
            )}
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{version.user?.email || 'System'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatDate(version.createdAt)}</span>
            </div>
          </div>

          {version.revertReason && (
            <p className="mt-2 text-sm text-muted-foreground italic">
              "{version.revertReason}"
            </p>
          )}
        </div>

        {!isCurrent && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRevert}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Revert
          </Button>
        )}
      </div>
    </div>
  );
}
