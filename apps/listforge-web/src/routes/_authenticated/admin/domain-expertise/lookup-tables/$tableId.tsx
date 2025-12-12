import { createFileRoute, Navigate, useNavigate } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import {
  useGetLookupTableQuery,
  useListLookupEntriesQuery,
  useCreateLookupEntryMutation,
  useUpdateLookupEntryMutation,
  useDeleteLookupEntryMutation,
  useImportLookupEntriesMutation,
  useLazyExportLookupEntriesQuery,
} from '@listforge/api-rtk';
import {
  AppContent,
  DataTable,
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
} from '@listforge/ui';
import {
  Plus,
  Trash2,
  Loader2,
  Upload,
  Download,
  Database,
  Pencil,
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import type { ColumnDef } from '@tanstack/react-table';
import type { LookupEntryDto } from '@listforge/api-types';

export const Route = createFileRoute('/_authenticated/admin/domain-expertise/lookup-tables/$tableId')({
  component: LookupTableEntriesPage,
});

function LookupTableEntriesPage() {
  const navigate = useNavigate();
  const params = Route.useParams();
  const tableId = params.tableId;
  const user = useSelector((state: RootState) => state.auth.user);

  // Data fetching
  const { data: table, isLoading: isLoadingTable } = useGetLookupTableQuery(tableId);
  const { data: entriesData, isLoading: isLoadingEntries } = useListLookupEntriesQuery({
    tableId,
    params: {},
  });

  // Mutations
  const [createEntry, { isLoading: isCreating }] = useCreateLookupEntryMutation();
  const [updateEntry, { isLoading: isUpdating }] = useUpdateLookupEntryMutation();
  const [deleteEntry, { isLoading: isDeleting }] = useDeleteLookupEntryMutation();
  const [importEntries, { isLoading: isImporting }] = useImportLookupEntriesMutation();
  const [triggerExport, { isLoading: isExporting }] = useLazyExportLookupEntriesQuery();

  // Dialog states
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [isEditEntryOpen, setIsEditEntryOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Form states
  const [newEntry, setNewEntry] = useState({ key: '', values: '{}' });
  const [editEntry, setEditEntry] = useState<{ id: string; key: string; values: string }>({ id: '', key: '', values: '{}' });
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);
  const [importData, setImportData] = useState('');

  // Check admin access
  if (user?.globalRole !== 'superadmin' && user?.globalRole !== 'staff') {
    return <Navigate to="/" />;
  }

  const entries = entriesData?.entries || [];

  // Column definitions
  const columns: ColumnDef<LookupEntryDto>[] = useMemo(
    () => [
      {
        accessorKey: 'key',
        header: table?.keyField || 'Key',
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.key}</span>
        ),
      },
      {
        accessorKey: 'values',
        header: 'Values',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {JSON.stringify(row.original.values).slice(0, 50)}
            {JSON.stringify(row.original.values).length > 50 && '...'}
          </span>
        ),
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
            {row.original.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openEditEntry(row.original)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setDeleteEntryId(row.original.id);
                setIsDeleteConfirmOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [table?.keyField]
  );

  const handleCreateEntry = async () => {
    if (!newEntry.key.trim()) {
      showError('Key is required');
      return;
    }
    try {
      const values = JSON.parse(newEntry.values);
      await createEntry({
        tableId,
        data: {
          key: newEntry.key.trim(),
          values,
        },
      }).unwrap();
      showSuccess('Entry created');
      setIsAddEntryOpen(false);
      setNewEntry({ key: '', values: '{}' });
    } catch (err) {
      console.error('Failed to create entry:', err);
      if (err instanceof SyntaxError) {
        showError('Invalid JSON in values field');
      } else {
        showError('Failed to create entry');
      }
    }
  };

  const openEditEntry = (entry: LookupEntryDto) => {
    setEditEntry({
      id: entry.id,
      key: entry.key,
      values: JSON.stringify(entry.values, null, 2),
    });
    setIsEditEntryOpen(true);
  };

  const handleUpdateEntry = async () => {
    if (!editEntry.key.trim()) {
      showError('Key is required');
      return;
    }
    try {
      const values = JSON.parse(editEntry.values);
      await updateEntry({
        entryId: editEntry.id,
        data: {
          key: editEntry.key.trim(),
          values,
        },
      }).unwrap();
      showSuccess('Entry updated');
      setIsEditEntryOpen(false);
    } catch (err) {
      console.error('Failed to update entry:', err);
      if (err instanceof SyntaxError) {
        showError('Invalid JSON in values field');
      } else {
        showError('Failed to update entry');
      }
    }
  };

  const handleDeleteEntry = async () => {
    if (!deleteEntryId) return;
    try {
      await deleteEntry(deleteEntryId).unwrap();
      showSuccess('Entry deleted');
      setIsDeleteConfirmOpen(false);
      setDeleteEntryId(null);
    } catch (err) {
      console.error('Failed to delete entry:', err);
      showError('Failed to delete entry');
    }
  };

  const handleImport = async () => {
    if (!importData.trim()) {
      showError('Please provide import data');
      return;
    }
    try {
      const entries = JSON.parse(importData);
      if (!Array.isArray(entries)) {
        showError('Import data must be a JSON array');
        return;
      }
      const result = await importEntries({
        tableId,
        data: {
          entries,
          overwriteExisting: true,
        },
      }).unwrap();
      showSuccess(`Imported ${result.created} created, ${result.updated} updated`);
      setIsImportOpen(false);
      setImportData('');
    } catch (err) {
      console.error('Failed to import entries:', err);
      if (err instanceof SyntaxError) {
        showError('Invalid JSON format');
      } else {
        showError('Failed to import entries');
      }
    }
  };

  const handleExport = async () => {
    try {
      const result = await triggerExport(tableId).unwrap();
      const dataStr = JSON.stringify(result.entries, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${table?.name || 'lookup-table'}-entries.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess('Entries exported');
    } catch (err) {
      console.error('Failed to export entries:', err);
      showError('Failed to export entries');
    }
  };

  if (isLoadingTable) {
    return (
      <AppContent maxWidth="full" padding="md">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppContent>
    );
  }

  if (!table) {
    return (
      <AppContent maxWidth="full" padding="md">
        <div className="text-center py-20">
          <h2 className="text-xl font-semibold">Lookup table not found</h2>
          <p className="text-muted-foreground mt-2">
            The requested lookup table does not exist.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate({ to: '/admin/domain-expertise' })}
          >
            Back to Domain Expertise
          </Button>
        </div>
      </AppContent>
    );
  }

  return (
    <AppContent
      title={table.name}
      description={table.description || `Manage entries for ${table.name}`}
      breadcrumbs={[
        { label: 'Admin', onClick: () => navigate({ to: '/admin' }) },
        { label: 'Domain Expertise', onClick: () => navigate({ to: '/admin/domain-expertise' }) },
        { label: 'Lookup Tables' },
        { label: table.name },
      ]}
      badges={
        <>
          <Badge variant={table.isActive ? 'default' : 'secondary'}>
            {table.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <Badge variant="outline">{entries.length} entries</Badge>
        </>
      }
      actions={
        <>
          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export
          </Button>
          <Button onClick={() => setIsAddEntryOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Entry
          </Button>
        </>
      }
      maxWidth="full"
      padding="md"
    >
      {isLoadingEntries ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Database className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No entries yet</h3>
          <p className="text-muted-foreground mt-1">
            Add entries to this lookup table to use in decoders.
          </p>
          <Button className="mt-4" onClick={() => setIsAddEntryOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add First Entry
          </Button>
        </div>
      ) : (
        <DataTable columns={columns} data={entries} />
      )}

      {/* Add Entry Dialog */}
      <Dialog open={isAddEntryOpen} onOpenChange={setIsAddEntryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Entry</DialogTitle>
            <DialogDescription>
              Add a new entry to the lookup table
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="entry-key">{table.keyField}</Label>
              <Input
                id="entry-key"
                placeholder={`Enter ${table.keyField}...`}
                value={newEntry.key}
                onChange={(e) => setNewEntry({ ...newEntry, key: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entry-values">Values (JSON)</Label>
              <Textarea
                id="entry-values"
                placeholder='{"value": "..."}'
                value={newEntry.values}
                onChange={(e) => setNewEntry({ ...newEntry, values: e.target.value })}
                rows={4}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddEntryOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateEntry} disabled={isCreating}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Entry Dialog */}
      <Dialog open={isEditEntryOpen} onOpenChange={setIsEditEntryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Entry</DialogTitle>
            <DialogDescription>
              Update the entry values
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-entry-key">{table.keyField}</Label>
              <Input
                id="edit-entry-key"
                value={editEntry.key}
                onChange={(e) => setEditEntry({ ...editEntry, key: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-entry-values">Values (JSON)</Label>
              <Textarea
                id="edit-entry-values"
                value={editEntry.values}
                onChange={(e) => setEditEntry({ ...editEntry, values: e.target.value })}
                rows={6}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditEntryOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateEntry} disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteEntry} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Entries</DialogTitle>
            <DialogDescription>
              Paste a JSON array of entries to import. Existing entries with matching keys will be updated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="import-data">Import Data (JSON Array)</Label>
              <Textarea
                id="import-data"
                placeholder={`[
  { "key": "AA", "values": { "location": "France" } },
  { "key": "AB", "values": { "location": "Spain" } }
]`}
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={isImporting}>
              {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import Entries
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppContent>
  );
}
