import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useSelector } from 'react-redux';
import {
  SettingsType,
  SETTINGS_TYPE_LABELS,
} from '@listforge/api-types';
import { useGetSettingsAuditLogsQuery } from '@listforge/api-rtk';
import { RootState } from '@/store/store';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
  Skeleton,
} from '@listforge/ui';
import { History, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { SettingsAuditLogItem } from '@/components/settings';

export const Route = createFileRoute('/_authenticated/settings/history')({
  component: SettingsHistoryPage,
});

const SETTINGS_TYPES: SettingsType[] = [
  'workflow',
  'notification',
  'team',
  'inventory',
  'marketplaceDefaults',
  'billing',
  'security',
];

const PAGE_SIZE = 20;

function SettingsHistoryPage() {
  const currentOrg = useSelector((state: RootState) => state.auth.currentOrg);
  const orgId = currentOrg?.id;

  const [settingsType, setSettingsType] = useState<SettingsType | 'all'>('all');
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useGetSettingsAuditLogsQuery(
    {
      orgId: orgId!,
      params: {
        settingsType: settingsType === 'all' ? undefined : settingsType,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      },
    },
    { skip: !orgId },
  );

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (!orgId) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Please select an organization to view settings history.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Settings History
              </CardTitle>
              <CardDescription>
                View all changes made to your organization settings
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={settingsType}
                onValueChange={(value) => {
                  setSettingsType(value as SettingsType | 'all');
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Settings</SelectItem>
                  {SETTINGS_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {SETTINGS_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No settings history yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Changes to settings will appear here
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {logs.map((log) => (
                  <SettingsAuditLogItem key={log.id} log={log} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, total)} of {total}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1 || isFetching}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages || isFetching}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
