import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import {
  SettingsType,
  SettingsAuditEventType,
  SETTINGS_TYPE_LABELS,
  EVENT_TYPE_LABELS,
} from '@listforge/api-types';
import { useGetAdminSettingsAuditLogsQuery, useListOrgsAdminQuery } from '@listforge/api-rtk';
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
import { History, Filter, ChevronLeft, ChevronRight, Building2 } from 'lucide-react';
import { SettingsAuditLogItem } from '@/components/settings';

export const Route = createFileRoute('/_authenticated/admin/settings-audit')({
  component: AdminSettingsAuditPage,
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

const EVENT_TYPES: SettingsAuditEventType[] = [
  'settings:created',
  'settings:updated',
  'settings:reverted',
  'settings:admin_update',
];

const PAGE_SIZE = 20;

function AdminSettingsAuditPage() {
  const [orgId, setOrgId] = useState<string | 'all'>('all');
  const [settingsType, setSettingsType] = useState<SettingsType | 'all'>('all');
  const [eventType, setEventType] = useState<SettingsAuditEventType | 'all'>('all');
  const [page, setPage] = useState(1);

  const { data: orgsData } = useListOrgsAdminQuery();
  const orgs = orgsData?.orgs || [];

  const { data, isLoading, isFetching } = useGetAdminSettingsAuditLogsQuery({
    orgId: orgId === 'all' ? undefined : orgId,
    settingsType: settingsType === 'all' ? undefined : settingsType,
    eventType: eventType === 'all' ? undefined : eventType,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const resetFilters = () => {
    setOrgId('all');
    setSettingsType('all');
    setEventType('all');
    setPage(1);
  };

  const hasFilters = orgId !== 'all' || settingsType !== 'all' || eventType !== 'all';

  return (
    <div className="container py-8 max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Settings Audit Logs
              </CardTitle>
              <CardDescription>
                View all settings changes across all organizations
              </CardDescription>
            </div>

            {hasFilters && (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Clear Filters
              </Button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t mt-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filter:</span>
            </div>

            <Select
              value={orgId}
              onValueChange={(value) => {
                setOrgId(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Organization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Organizations</SelectItem>
                {orgs.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={settingsType}
              onValueChange={(value) => {
                setSettingsType(value as SettingsType | 'all');
                setPage(1);
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Settings Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {SETTINGS_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {SETTINGS_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={eventType}
              onValueChange={(value) => {
                setEventType(value as SettingsAuditEventType | 'all');
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {EVENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {EVENT_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              <p className="text-muted-foreground">No audit logs found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {hasFilters
                  ? 'Try adjusting your filters'
                  : 'Settings changes will appear here'}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {logs.map((log) => (
                  <div key={log.id}>
                    {/* Show org name for admin view */}
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Org: {orgs.find((o) => o.id === log.orgId)?.name || log.orgId}
                      </span>
                    </div>
                    <SettingsAuditLogItem log={log} showOrg />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, total)} of{' '}
                    {total}
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
