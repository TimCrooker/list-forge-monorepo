import { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  SettingsType,
  SettingsAuditEventType,
  SETTINGS_TYPE_LABELS,
  EVENT_TYPE_LABELS,
} from '@listforge/api-types';
import { useGetAdminSettingsAuditLogsQuery, useListOrgsAdminQuery } from '@listforge/api-rtk';
import {
  AppContent,
  SearchFilters,
  Card,
  CardContent,
  Button,
  Skeleton,
  EmptyState,
} from '@listforge/ui';
import { History, ChevronLeft, ChevronRight, Building2 } from 'lucide-react';
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
  const navigate = useNavigate();
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [page, setPage] = useState(1);

  const { data: orgsData } = useListOrgsAdminQuery();
  const orgs = orgsData?.orgs || [];

  const orgId = filters.orgId === 'all' || !filters.orgId ? undefined : filters.orgId;
  const settingsType = filters.settingsType === 'all' || !filters.settingsType ? undefined : filters.settingsType;
  const eventType = filters.eventType === 'all' || !filters.eventType ? undefined : filters.eventType;

  const { data, isLoading, isFetching } = useGetAdminSettingsAuditLogsQuery({
    orgId,
    settingsType,
    eventType,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleExport = () => {
    const json = JSON.stringify(logs, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit-logs.json';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <AppContent
      title="Settings Audit Logs"
      description="View all settings changes across all organizations"
      breadcrumbs={[
        { label: 'Admin', onClick: () => navigate({ to: '/admin' }) },
        { label: 'Settings Audit' },
      ]}
      actions={
        logs.length > 0 && (
          <Button variant="outline" onClick={handleExport}>
            Export Logs
          </Button>
        )
      }
      headerContent={
        <SearchFilters
          variant="inline"
          showSearch={false}
          filterGroups={[
            {
              id: 'orgId',
              label: 'Organization',
              type: 'select',
              options: [
                { value: 'all', label: 'All Organizations' },
                ...orgs.map((org) => ({ value: org.id, label: org.name })),
              ],
            },
            {
              id: 'settingsType',
              label: 'Settings Type',
              type: 'select',
              options: [
                { value: 'all', label: 'All Types' },
                ...SETTINGS_TYPES.map((type) => ({
                  value: type,
                  label: SETTINGS_TYPE_LABELS[type],
                })),
              ],
            },
            {
              id: 'eventType',
              label: 'Event Type',
              type: 'select',
              options: [
                { value: 'all', label: 'All Events' },
                ...EVENT_TYPES.map((type) => ({
                  value: type,
                  label: EVENT_TYPE_LABELS[type],
                })),
              ],
            },
          ]}
          onFilterChange={handleFilterChange}
        />
      }
      maxWidth="xl"
      padding="md"
    >
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <EmptyState
              icon={History}
              title="No audit logs found"
              description={
                Object.keys(filters).length > 0
                  ? 'Try adjusting your filters'
                  : 'Settings changes will appear here'
              }
            />
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
    </AppContent>
  );
}
