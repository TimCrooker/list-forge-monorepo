import { createFileRoute, Navigate, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import {
  useListDomainExpertiseModulesQuery,
  useCreateDomainExpertiseModuleMutation,
  useDeleteDomainExpertiseModuleMutation,
  useDuplicateDomainExpertiseModuleMutation,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  EmptyState,
} from '@listforge/ui';
import {
  Plus,
  MoreHorizontal,
  Eye,
  Copy,
  Trash2,
  Loader2,
  BookOpen,
  CheckCircle,
  Archive,
  FileEdit,
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import type { ColumnDef } from '@tanstack/react-table';
import type { DomainExpertiseModuleDto, DomainExpertiseModuleStatus } from '@listforge/api-types';
import type { CategoryId } from '@listforge/core-types';

export const Route = createFileRoute('/_authenticated/admin/domain-expertise/')({
  component: DomainExpertiseModulesPage,
});

const STATUS_COLORS: Record<DomainExpertiseModuleStatus, string> = {
  draft: 'secondary',
  published: 'default',
  archived: 'outline',
};

const STATUS_ICONS: Record<DomainExpertiseModuleStatus, React.ReactNode> = {
  draft: <FileEdit className="h-3 w-3" />,
  published: <CheckCircle className="h-3 w-3" />,
  archived: <Archive className="h-3 w-3" />,
};

const CATEGORY_OPTIONS: { value: CategoryId; label: string }[] = [
  { value: 'luxury_handbags', label: 'Luxury Handbags' },
  { value: 'watches', label: 'Watches' },
  { value: 'sneakers', label: 'Sneakers' },
  { value: 'vintage_denim', label: 'Vintage Denim' },
  { value: 'trading_cards', label: 'Trading Cards' },
  { value: 'electronics_phones', label: 'Electronics & Phones' },
  { value: 'collectible_toys', label: 'Collectibles & Toys' },
  { value: 'general', label: 'General' },
];

function DomainExpertiseModulesPage() {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const { data, isLoading } = useListDomainExpertiseModulesQuery();
  const [createModule, { isLoading: isCreating }] = useCreateDomainExpertiseModuleMutation();
  const [deleteModule] = useDeleteDomainExpertiseModuleMutation();
  const [duplicateModule] = useDuplicateDomainExpertiseModuleMutation();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');
  const [newModuleCategory, setNewModuleCategory] = useState<CategoryId>('general');
  const [newModuleDescription, setNewModuleDescription] = useState('');

  // Check admin access
  if (user?.globalRole !== 'superadmin' && user?.globalRole !== 'staff') {
    return <Navigate to="/" />;
  }

  const handleCreateModule = async () => {
    if (!newModuleName.trim()) {
      showError('Module name is required');
      return;
    }

    try {
      const result = await createModule({
        name: newModuleName.trim(),
        categoryId: newModuleCategory,
        description: newModuleDescription.trim(),
      }).unwrap();

      showSuccess('Module created successfully');
      setIsCreateDialogOpen(false);
      setNewModuleName('');
      setNewModuleDescription('');

      // Navigate to the new module
      navigate({ to: '/admin/domain-expertise/$moduleId', params: { moduleId: result.id } });
    } catch (err) {
      console.error('Failed to create module:', err);
    }
  };

  const handleDuplicateModule = async (id: string) => {
    try {
      const result = await duplicateModule(id).unwrap();
      showSuccess('Module duplicated successfully');
      navigate({ to: '/admin/domain-expertise/$moduleId', params: { moduleId: result.id } });
    } catch (err) {
      console.error('Failed to duplicate module:', err);
    }
  };

  const handleDeleteModule = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this module? This cannot be undone.')) {
      return;
    }

    try {
      await deleteModule(id).unwrap();
      showSuccess('Module deleted successfully');
    } catch (err) {
      console.error('Failed to delete module:', err);
    }
  };

  const columns: ColumnDef<DomainExpertiseModuleDto>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <div>
            <button
              onClick={() =>
                navigate({
                  to: '/admin/domain-expertise/$moduleId',
                  params: { moduleId: row.original.id },
                })
              }
              className="font-medium hover:underline text-left"
            >
              {row.original.name}
            </button>
            {row.original.description && (
              <div className="text-sm text-muted-foreground truncate max-w-md">
                {row.original.description}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'categoryId',
        header: 'Category',
        cell: ({ row }) => {
          const category = CATEGORY_OPTIONS.find((c) => c.value === row.original.categoryId);
          return (
            <Badge variant="outline">{category?.label || row.original.categoryId}</Badge>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={STATUS_COLORS[row.original.status] as any} className="gap-1">
            {STATUS_ICONS[row.original.status]}
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: 'currentVersion',
        header: 'Version',
        cell: ({ row }) => (
          <span className="text-muted-foreground">v{row.original.currentVersion}</span>
        ),
      },
      {
        accessorKey: 'applicableBrands',
        header: 'Brands',
        cell: ({ row }) => {
          const brands = row.original.applicableBrands;
          if (!brands || brands.length === 0) {
            return <span className="text-muted-foreground">All brands</span>;
          }
          return (
            <div className="flex flex-wrap gap-1">
              {brands.slice(0, 2).map((brand) => (
                <Badge key={brand} variant="secondary" className="text-xs">
                  {brand}
                </Badge>
              ))}
              {brands.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{brands.length - 2}
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'updatedAt',
        header: 'Updated',
        cell: ({ row }) =>
          row.original.lastModifiedAt
            ? new Date(row.original.lastModifiedAt).toLocaleDateString()
            : '-',
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  navigate({
                    to: '/admin/domain-expertise/$moduleId',
                    params: { moduleId: row.original.id },
                  })
                }
              >
                <Eye className="mr-2 h-4 w-4" />
                View / Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDuplicateModule(row.original.id)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteModule(row.original.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [navigate]
  );

  const modules = data?.modules || [];

  return (
    <AppContent
      title="Domain Expertise"
      description="Manage domain knowledge modules for item research and authentication"
      breadcrumbs={[
        { label: 'Admin', onClick: () => navigate({ to: '/admin' }) },
        { label: 'Domain Expertise' },
      ]}
      actions={
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Module
        </Button>
      }
      maxWidth="full"
      padding="md"
    >
      {modules.length === 0 && !isLoading ? (
        <EmptyState
          icon={BookOpen}
          title="No modules found"
          description="Create your first domain expertise module to get started"
          action={
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Module
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={modules}
          loading={isLoading}
        />
      )}

      {/* Create Module Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Module</DialogTitle>
            <DialogDescription>
              Create a new domain expertise module for a specific category
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Module Name</Label>
              <Input
                id="name"
                placeholder="e.g., Louis Vuitton Authentication"
                value={newModuleName}
                onChange={(e) => setNewModuleName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={newModuleCategory}
                onValueChange={(value) => setNewModuleCategory(value as CategoryId)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe what this module covers..."
                value={newModuleDescription}
                onChange={(e) => setNewModuleDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateModule} disabled={isCreating}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Module
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppContent>
  );
}
