import { createFileRoute, Navigate, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import {
  useGetDomainExpertiseModuleQuery,
  useUpdateDomainExpertiseModuleMutation,
  usePublishDomainExpertiseModuleMutation,
  useListDomainExpertiseVersionsQuery,
  useRollbackDomainExpertiseModuleMutation,
  useListDecodersQuery,
  useListValueDriversQuery,
  useListAuthenticityMarkersQuery,
  useListLookupTablesQuery,
  useDeleteDecoderMutation,
  useDeleteValueDriverMutation,
  useDeleteAuthenticityMarkerMutation,
  useDeleteLookupTableMutation,
  useTestDecodePipelineMutation,
  useCreateDecoderMutation,
  useCreateValueDriverMutation,
  useCreateAuthenticityMarkerMutation,
  useCreateLookupTableMutation,
  useUpdateDecoderMutation,
  useUpdateValueDriverMutation,
  useUpdateAuthenticityMarkerMutation,
  useUpdateLookupTableMutation,
} from '@listforge/api-rtk';
import {
  AppContent,
  Button,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  ScrollArea,
} from '@listforge/ui';
import {
  Loader2,
  Send,
  History,
  Code,
  Table2,
  TrendingUp,
  Shield,
  Play,
  Trash2,
  Plus,
  CheckCircle,
  FileEdit,
  Archive,
  RotateCcw,
  Pencil,
  Settings,
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import type {
  DomainExpertiseModuleStatus,
  DecoderDefinitionDto,
  ValueDriverDefinitionDto,
  AuthenticityMarkerDefinitionDto,
  LookupTableDto,
} from '@listforge/api-types';

export const Route = createFileRoute('/_authenticated/admin/domain-expertise/$moduleId')({
  component: ModuleEditorPage,
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

function ModuleEditorPage() {
  const navigate = useNavigate();
  const { moduleId } = Route.useParams();
  const user = useSelector((state: RootState) => state.auth.user);

  // Module data
  const { data: module, isLoading: isLoadingModule } = useGetDomainExpertiseModuleQuery(moduleId);
  const { data: versionsData } = useListDomainExpertiseVersionsQuery(moduleId);
  const { data: decodersData } = useListDecodersQuery(moduleId);
  const { data: valueDriversData } = useListValueDriversQuery(moduleId);
  const { data: markersData } = useListAuthenticityMarkersQuery(moduleId);
  const { data: lookupTablesData } = useListLookupTablesQuery({ moduleId });

  // Mutations
  const [updateModule, { isLoading: isUpdatingModule }] = useUpdateDomainExpertiseModuleMutation();
  const [publishModule, { isLoading: isPublishing }] = usePublishDomainExpertiseModuleMutation();
  const [rollbackModule, { isLoading: isRollingBack }] = useRollbackDomainExpertiseModuleMutation();
  const [deleteDecoder, { isLoading: isDeletingDecoder }] = useDeleteDecoderMutation();
  const [deleteValueDriver, { isLoading: isDeletingDriver }] = useDeleteValueDriverMutation();
  const [deleteAuthenticityMarker, { isLoading: isDeletingMarker }] = useDeleteAuthenticityMarkerMutation();
  const [deleteLookupTable, { isLoading: isDeletingTable }] = useDeleteLookupTableMutation();
  const [testDecodePipeline, { isLoading: isTesting }] = useTestDecodePipelineMutation();
  const [createDecoder, { isLoading: isCreatingDecoder }] = useCreateDecoderMutation();
  const [createValueDriver, { isLoading: isCreatingDriver }] = useCreateValueDriverMutation();
  const [createAuthenticityMarker, { isLoading: isCreatingMarker }] = useCreateAuthenticityMarkerMutation();
  const [createLookupTable, { isLoading: isCreatingTable }] = useCreateLookupTableMutation();
  const [updateDecoder, { isLoading: isUpdatingDecoder }] = useUpdateDecoderMutation();
  const [updateValueDriver, { isLoading: isUpdatingDriver }] = useUpdateValueDriverMutation();
  const [updateAuthenticityMarker, { isLoading: isUpdatingMarker }] = useUpdateAuthenticityMarkerMutation();
  const [updateLookupTable, { isLoading: isUpdatingTable }] = useUpdateLookupTableMutation();

  // Local state
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [isRollbackDialogOpen, setIsRollbackDialogOpen] = useState(false);
  const [changelog, setChangelog] = useState('');
  const [selectedVersionId, setSelectedVersionId] = useState('');
  const [rollbackReason, setRollbackReason] = useState('');
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<any>(null);

  // Add dialogs state
  const [isAddDecoderOpen, setIsAddDecoderOpen] = useState(false);
  const [isAddDriverOpen, setIsAddDriverOpen] = useState(false);
  const [isAddMarkerOpen, setIsAddMarkerOpen] = useState(false);
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);

  // Edit dialogs state
  const [isEditModuleOpen, setIsEditModuleOpen] = useState(false);
  const [isEditDecoderOpen, setIsEditDecoderOpen] = useState(false);
  const [isEditDriverOpen, setIsEditDriverOpen] = useState(false);

  // Delete confirmation dialogs state
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'decoder' | 'driver' | 'marker' | 'table'; id: string; name: string } | null>(null);
  const [isEditMarkerOpen, setIsEditMarkerOpen] = useState(false);
  const [isEditTableOpen, setIsEditTableOpen] = useState(false);

  // Add form state
  const [newDecoder, setNewDecoder] = useState({ name: '', identifierType: '', inputPattern: '', description: '' });
  const [newDriver, setNewDriver] = useState<{ name: string; attribute: string; conditionType: 'contains' | 'equals' | 'regex'; conditionValue: string; priceMultiplier: number }>({ name: '', attribute: '', conditionType: 'contains', conditionValue: '', priceMultiplier: 1.0 });
  const [newMarker, setNewMarker] = useState<{ name: string; checkDescription: string; pattern: string; importance: 'critical' | 'important' | 'helpful' }>({ name: '', checkDescription: '', pattern: '', importance: 'important' });
  const [newTable, setNewTable] = useState({ name: '', description: '', keyField: '' });

  // Edit form state
  const [editModule, setEditModule] = useState({ name: '', description: '', applicableBrands: '' });
  const [editDecoder, setEditDecoder] = useState<{ id: string; name: string; identifierType: string; inputPattern: string; description: string; isActive: boolean }>({ id: '', name: '', identifierType: '', inputPattern: '', description: '', isActive: true });
  const [editDriver, setEditDriver] = useState<{ id: string; name: string; description: string; attribute: string; conditionType: 'contains' | 'equals' | 'regex' | 'range' | 'custom'; conditionValue: string; priceMultiplier: number; priority: number; isActive: boolean }>({ id: '', name: '', description: '', attribute: '', conditionType: 'contains', conditionValue: '', priceMultiplier: 1.0, priority: 0, isActive: true });
  const [editMarker, setEditMarker] = useState<{ id: string; name: string; checkDescription: string; pattern: string; importance: 'critical' | 'important' | 'helpful'; indicatesAuthentic: boolean; isActive: boolean }>({ id: '', name: '', checkDescription: '', pattern: '', importance: 'important', indicatesAuthentic: true, isActive: true });
  const [editTable, setEditTable] = useState<{ id: string; name: string; description: string; keyField: string; isActive: boolean }>({ id: '', name: '', description: '', keyField: '', isActive: true });

  // Check admin access
  if (user?.globalRole !== 'superadmin' && user?.globalRole !== 'staff') {
    return <Navigate to="/" />;
  }

  if (isLoadingModule) {
    return (
      <AppContent maxWidth="full" padding="md">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppContent>
    );
  }

  if (!module) {
    return (
      <AppContent maxWidth="full" padding="md">
        <div className="text-center py-20">
          <h2 className="text-xl font-semibold">Module not found</h2>
          <p className="text-muted-foreground mt-2">
            The requested module does not exist or has been deleted.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate({ to: '/admin/domain-expertise' })}
          >
            Back to Modules
          </Button>
        </div>
      </AppContent>
    );
  }

  const handlePublish = async () => {
    if (!changelog.trim()) {
      showError('Please provide a changelog description');
      return;
    }

    try {
      await publishModule({
        id: moduleId,
        data: { changelog: changelog.trim() },
      }).unwrap();
      showSuccess('Module published successfully');
      setIsPublishDialogOpen(false);
      setChangelog('');
    } catch (err) {
      console.error('Failed to publish module:', err);
      showError('Failed to publish module');
    }
  };

  const handleRollback = async () => {
    if (!selectedVersionId) {
      showError('Please select a version to rollback to');
      return;
    }

    try {
      await rollbackModule({
        id: moduleId,
        data: { versionId: selectedVersionId, reason: rollbackReason.trim() },
      }).unwrap();
      showSuccess('Module rolled back successfully');
      setIsRollbackDialogOpen(false);
      setSelectedVersionId('');
      setRollbackReason('');
    } catch (err) {
      console.error('Failed to rollback module:', err);
      showError('Failed to rollback module');
    }
  };

  const handleTestDecode = async () => {
    if (!testInput.trim()) {
      showError('Please enter a test input');
      return;
    }

    try {
      const result = await testDecodePipeline({
        moduleId,
        data: { input: testInput.trim() },
      }).unwrap();
      setTestResult({ type: 'decode', ...result });
    } catch (err) {
      console.error('Test failed:', err);
      showError('Test failed');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    const { type, id } = deleteConfirm;
    try {
      switch (type) {
        case 'decoder':
          await deleteDecoder(id).unwrap();
          showSuccess('Decoder deleted');
          break;
        case 'driver':
          await deleteValueDriver(id).unwrap();
          showSuccess('Value driver deleted');
          break;
        case 'marker':
          await deleteAuthenticityMarker(id).unwrap();
          showSuccess('Marker deleted');
          break;
        case 'table':
          await deleteLookupTable(id).unwrap();
          showSuccess('Lookup table deleted');
          break;
      }
      setDeleteConfirm(null);
    } catch (err) {
      console.error(`Failed to delete ${type}:`, err);
      showError(`Failed to delete ${type}`);
    }
  };

  const handleCreateDecoder = async () => {
    if (!newDecoder.name.trim() || !newDecoder.identifierType.trim() || !newDecoder.inputPattern.trim()) {
      showError('Name, identifier type, and input pattern are required');
      return;
    }
    try {
      await createDecoder({
        moduleId,
        data: {
          name: newDecoder.name.trim(),
          identifierType: newDecoder.identifierType.trim(),
          inputPattern: newDecoder.inputPattern.trim(),
          description: newDecoder.description.trim(),
          extractionRules: [],
          outputFields: [],
        },
      }).unwrap();
      showSuccess('Decoder created');
      setIsAddDecoderOpen(false);
      setNewDecoder({ name: '', identifierType: '', inputPattern: '', description: '' });
    } catch (err) {
      console.error('Failed to create decoder:', err);
      showError('Failed to create decoder');
    }
  };

  const handleCreateDriver = async () => {
    if (!newDriver.name.trim() || !newDriver.attribute.trim()) {
      showError('Name and attribute are required');
      return;
    }
    try {
      await createValueDriver({
        moduleId,
        data: {
          name: newDriver.name.trim(),
          attribute: newDriver.attribute.trim(),
          conditionType: newDriver.conditionType,
          conditionValue: newDriver.conditionValue.trim(),
          priceMultiplier: newDriver.priceMultiplier,
        },
      }).unwrap();
      showSuccess('Value driver created');
      setIsAddDriverOpen(false);
      setNewDriver({ name: '', attribute: '', conditionType: 'contains' as const, conditionValue: '', priceMultiplier: 1.0 });
    } catch (err) {
      console.error('Failed to create value driver:', err);
      showError('Failed to create value driver');
    }
  };

  const handleCreateMarker = async () => {
    if (!newMarker.name.trim() || !newMarker.checkDescription.trim()) {
      showError('Name and check description are required');
      return;
    }
    try {
      await createAuthenticityMarker({
        moduleId,
        data: {
          name: newMarker.name.trim(),
          checkDescription: newMarker.checkDescription.trim(),
          pattern: newMarker.pattern.trim() || undefined,
          importance: newMarker.importance,
        },
      }).unwrap();
      showSuccess('Authenticity marker created');
      setIsAddMarkerOpen(false);
      setNewMarker({ name: '', checkDescription: '', pattern: '', importance: 'important' as const });
    } catch (err) {
      console.error('Failed to create marker:', err);
      showError('Failed to create marker');
    }
  };

  const handleCreateTable = async () => {
    if (!newTable.name.trim() || !newTable.keyField.trim()) {
      showError('Name and key field are required');
      return;
    }
    try {
      await createLookupTable({
        name: newTable.name.trim(),
        description: newTable.description.trim(),
        keyField: newTable.keyField.trim(),
        moduleId,
        valueSchema: [{ name: 'value', type: 'string', required: true }],
      }).unwrap();
      showSuccess('Lookup table created');
      setIsAddTableOpen(false);
      setNewTable({ name: '', description: '', keyField: '' });
    } catch (err) {
      console.error('Failed to create lookup table:', err);
      showError('Failed to create lookup table');
    }
  };

  // ===== EDIT HANDLERS =====

  const openEditModule = () => {
    setEditModule({
      name: module.name,
      description: module.description || '',
      applicableBrands: module.applicableBrands?.join(', ') || '',
    });
    setIsEditModuleOpen(true);
  };

  const handleUpdateModule = async () => {
    if (!editModule.name.trim()) {
      showError('Name is required');
      return;
    }
    try {
      await updateModule({
        id: moduleId,
        data: {
          name: editModule.name.trim(),
          description: editModule.description.trim(),
          applicableBrands: editModule.applicableBrands.split(',').map(b => b.trim()).filter(Boolean),
        },
      }).unwrap();
      showSuccess('Module updated');
      setIsEditModuleOpen(false);
    } catch (err) {
      console.error('Failed to update module:', err);
      showError('Failed to update module');
    }
  };

  const openEditDecoder = (decoder: DecoderDefinitionDto) => {
    setEditDecoder({
      id: decoder.id,
      name: decoder.name,
      identifierType: decoder.identifierType,
      inputPattern: decoder.inputPattern,
      description: decoder.description || '',
      isActive: decoder.isActive,
    });
    setIsEditDecoderOpen(true);
  };

  const handleUpdateDecoder = async () => {
    if (!editDecoder.name.trim() || !editDecoder.identifierType.trim()) {
      showError('Name and identifier type are required');
      return;
    }
    try {
      await updateDecoder({
        id: editDecoder.id,
        data: {
          name: editDecoder.name.trim(),
          identifierType: editDecoder.identifierType.trim(),
          inputPattern: editDecoder.inputPattern.trim(),
          description: editDecoder.description.trim(),
          isActive: editDecoder.isActive,
        },
      }).unwrap();
      showSuccess('Decoder updated');
      setIsEditDecoderOpen(false);
    } catch (err) {
      console.error('Failed to update decoder:', err);
      showError('Failed to update decoder');
    }
  };

  const openEditValueDriver = (driver: ValueDriverDefinitionDto) => {
    setEditDriver({
      id: driver.id,
      name: driver.name,
      description: driver.description || '',
      attribute: driver.attribute,
      conditionType: driver.conditionType as 'contains' | 'equals' | 'regex' | 'range' | 'custom',
      conditionValue: typeof driver.conditionValue === 'string' ? driver.conditionValue : JSON.stringify(driver.conditionValue),
      priceMultiplier: driver.priceMultiplier,
      priority: driver.priority || 0,
      isActive: driver.isActive,
    });
    setIsEditDriverOpen(true);
  };

  const handleUpdateValueDriver = async () => {
    if (!editDriver.name.trim() || !editDriver.attribute.trim()) {
      showError('Name and attribute are required');
      return;
    }
    try {
      await updateValueDriver({
        id: editDriver.id,
        data: {
          name: editDriver.name.trim(),
          description: editDriver.description.trim(),
          attribute: editDriver.attribute.trim(),
          conditionType: editDriver.conditionType,
          conditionValue: editDriver.conditionValue.trim(),
          priceMultiplier: editDriver.priceMultiplier,
          priority: editDriver.priority,
          isActive: editDriver.isActive,
        },
      }).unwrap();
      showSuccess('Value driver updated');
      setIsEditDriverOpen(false);
    } catch (err) {
      console.error('Failed to update value driver:', err);
      showError('Failed to update value driver');
    }
  };

  const openEditMarker = (marker: AuthenticityMarkerDefinitionDto) => {
    setEditMarker({
      id: marker.id,
      name: marker.name,
      checkDescription: marker.checkDescription,
      pattern: marker.pattern || '',
      importance: marker.importance,
      indicatesAuthentic: marker.indicatesAuthentic,
      isActive: marker.isActive,
    });
    setIsEditMarkerOpen(true);
  };

  const handleUpdateMarker = async () => {
    if (!editMarker.name.trim() || !editMarker.checkDescription.trim()) {
      showError('Name and check description are required');
      return;
    }
    try {
      await updateAuthenticityMarker({
        id: editMarker.id,
        data: {
          name: editMarker.name.trim(),
          checkDescription: editMarker.checkDescription.trim(),
          pattern: editMarker.pattern.trim() || undefined,
          importance: editMarker.importance,
          indicatesAuthentic: editMarker.indicatesAuthentic,
          isActive: editMarker.isActive,
        },
      }).unwrap();
      showSuccess('Authenticity marker updated');
      setIsEditMarkerOpen(false);
    } catch (err) {
      console.error('Failed to update marker:', err);
      showError('Failed to update marker');
    }
  };

  const openEditTable = (table: LookupTableDto) => {
    setEditTable({
      id: table.id,
      name: table.name,
      description: table.description || '',
      keyField: table.keyField,
      isActive: table.isActive,
    });
    setIsEditTableOpen(true);
  };

  const handleUpdateTable = async () => {
    if (!editTable.name.trim() || !editTable.keyField.trim()) {
      showError('Name and key field are required');
      return;
    }
    try {
      await updateLookupTable({
        id: editTable.id,
        data: {
          name: editTable.name.trim(),
          description: editTable.description.trim(),
          isActive: editTable.isActive,
        },
      }).unwrap();
      showSuccess('Lookup table updated');
      setIsEditTableOpen(false);
    } catch (err) {
      console.error('Failed to update lookup table:', err);
      showError('Failed to update lookup table');
    }
  };


  return (
    <AppContent
      title={module.name}
      description={module.description}
      breadcrumbs={[
        { label: 'Admin', onClick: () => navigate({ to: '/admin' }) },
        { label: 'Domain Expertise', onClick: () => navigate({ to: '/admin/domain-expertise' }) },
        { label: module.name },
      ]}
      badges={
        <>
          <Badge variant={STATUS_COLORS[module.status] as any} className="gap-1">
            {STATUS_ICONS[module.status]}
            {module.status}
          </Badge>
          <Badge variant="outline">v{module.currentVersion}</Badge>
          <Badge variant="outline">{module.categoryId}</Badge>
        </>
      }
      actions={
        <>
          <Button
            variant="outline"
            onClick={openEditModule}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsRollbackDialogOpen(true)}
            disabled={!versionsData?.versions?.length}
          >
            <History className="mr-2 h-4 w-4" />
            Rollback
          </Button>
          <Button
            onClick={() => setIsPublishDialogOpen(true)}
            disabled={module.status === 'archived'}
          >
            <Send className="mr-2 h-4 w-4" />
            Publish
          </Button>
        </>
      }
      maxWidth="full"
      padding="md"
    >

      {/* Tabs */}
      <Tabs defaultValue="decoders">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="decoders" className="gap-2">
            <Code className="h-4 w-4" />
            Decoders ({decodersData?.decoders?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="lookup-tables" className="gap-2">
            <Table2 className="h-4 w-4" />
            Lookup Tables ({lookupTablesData?.tables?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="value-drivers" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Value Drivers ({valueDriversData?.valueDrivers?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="authenticity" className="gap-2">
            <Shield className="h-4 w-4" />
            Authenticity ({markersData?.markers?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="testing" className="gap-2">
            <Play className="h-4 w-4" />
            Testing
          </TabsTrigger>
        </TabsList>

        {/* Decoders Tab */}
        <TabsContent value="decoders" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Decoders</CardTitle>
                <CardDescription>
                  Pattern-based decoders for extracting structured data from identifiers
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setIsAddDecoderOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Decoder
              </Button>
            </CardHeader>
            <CardContent>
              {decodersData?.decoders?.length ? (
                <div className="space-y-3">
                  {decodersData.decoders.map((decoder: DecoderDefinitionDto) => (
                    <div
                      key={decoder.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{decoder.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Type: {decoder.identifierType} | Pattern: {decoder.inputPattern}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={decoder.isActive ? 'default' : 'secondary'}>
                          {decoder.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDecoder(decoder)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirm({ type: 'decoder', id: decoder.id, name: decoder.name })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No decoders configured. Add a decoder to parse identifiers.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lookup Tables Tab */}
        <TabsContent value="lookup-tables" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Lookup Tables</CardTitle>
                <CardDescription>
                  Reference data tables for factory codes, year codes, etc.
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setIsAddTableOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Table
              </Button>
            </CardHeader>
            <CardContent>
              {lookupTablesData?.tables?.length ? (
                <div className="space-y-3">
                  {lookupTablesData.tables.map((table: LookupTableDto) => (
                    <div
                      key={table.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{table.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {table.entryCount} entries | Key field: {table.keyField}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={table.isActive ? 'default' : 'secondary'}>
                          {table.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditTable(table)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirm({ type: 'table', id: table.id, name: table.name })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No lookup tables configured. Add a table for reference data.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Value Drivers Tab */}
        <TabsContent value="value-drivers" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Value Drivers</CardTitle>
                <CardDescription>
                  Price-affecting attributes that increase item value
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setIsAddDriverOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Driver
              </Button>
            </CardHeader>
            <CardContent>
              {valueDriversData?.valueDrivers?.length ? (
                <div className="space-y-3">
                  {valueDriversData.valueDrivers.map((driver: ValueDriverDefinitionDto) => (
                    <div
                      key={driver.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{driver.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Attribute: {driver.attribute} | Multiplier: {driver.priceMultiplier}x
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={driver.isActive ? 'default' : 'secondary'}>
                          {driver.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditValueDriver(driver)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirm({ type: 'driver', id: driver.id, name: driver.name })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No value drivers configured. Add drivers to identify price-affecting attributes.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Authenticity Tab */}
        <TabsContent value="authenticity" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Authenticity Markers</CardTitle>
                <CardDescription>
                  Patterns and checks for authenticating items
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setIsAddMarkerOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Marker
              </Button>
            </CardHeader>
            <CardContent>
              {markersData?.markers?.length ? (
                <div className="space-y-3">
                  {markersData.markers.map((marker: AuthenticityMarkerDefinitionDto) => (
                    <div
                      key={marker.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{marker.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {marker.checkDescription}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            marker.importance === 'critical'
                              ? 'destructive'
                              : marker.importance === 'important'
                                ? 'default'
                                : 'secondary'
                          }
                        >
                          {marker.importance}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditMarker(marker)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirm({ type: 'marker', id: marker.id, name: marker.name })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No authenticity markers configured. Add markers to validate item authenticity.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Testing Tab */}
        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Console</CardTitle>
              <CardDescription>
                Test decoders, value drivers, and authenticity checks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Test Input</Label>
                <Input
                  placeholder="Enter identifier or value to test..."
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleTestDecode} disabled={isTesting}>
                  {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Test Decode
                </Button>
              </div>

              {testResult && (
                <div className="mt-4">
                  <Label>Result</Label>
                  <ScrollArea className="h-48 rounded-md border p-4 mt-2">
                    <pre className="text-sm">{JSON.stringify(testResult, null, 2)}</pre>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Publish Dialog */}
      <Dialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Module</DialogTitle>
            <DialogDescription>
              Create a new version snapshot and publish the module
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="changelog">Changelog</Label>
              <Textarea
                id="changelog"
                placeholder="Describe what changed in this version..."
                value={changelog}
                onChange={(e) => setChangelog(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPublishDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePublish} disabled={isPublishing}>
              {isPublishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Publish v{module.currentVersion + 1}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rollback Dialog */}
      <Dialog open={isRollbackDialogOpen} onOpenChange={setIsRollbackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rollback to Previous Version</DialogTitle>
            <DialogDescription>
              Restore the module to a previous version
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Version</Label>
              <Select value={selectedVersionId} onValueChange={setSelectedVersionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a version to restore" />
                </SelectTrigger>
                <SelectContent>
                  {versionsData?.versions?.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      v{v.version} - {new Date(v.publishedAt).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rollback-reason">Reason (optional)</Label>
              <Textarea
                id="rollback-reason"
                placeholder="Why are you rolling back?"
                value={rollbackReason}
                onChange={(e) => setRollbackReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRollbackDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRollback} disabled={isRollingBack || !selectedVersionId}>
              {isRollingBack && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <RotateCcw className="mr-2 h-4 w-4" />
              Rollback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Decoder Dialog */}
      <Dialog open={isAddDecoderOpen} onOpenChange={setIsAddDecoderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Decoder</DialogTitle>
            <DialogDescription>
              Create a pattern-based decoder to extract data from identifiers
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="decoder-name">Name</Label>
              <Input
                id="decoder-name"
                placeholder="e.g., Louis Vuitton Date Code Decoder"
                value={newDecoder.name}
                onChange={(e) => setNewDecoder({ ...newDecoder, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="decoder-type">Identifier Type</Label>
              <Input
                id="decoder-type"
                placeholder="e.g., lv_date_code"
                value={newDecoder.identifierType}
                onChange={(e) => setNewDecoder({ ...newDecoder, identifierType: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="decoder-pattern">Input Pattern (Regex)</Label>
              <Input
                id="decoder-pattern"
                placeholder="e.g., ^([A-Z]{2})(\d{4})$"
                value={newDecoder.inputPattern}
                onChange={(e) => setNewDecoder({ ...newDecoder, inputPattern: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="decoder-desc">Description</Label>
              <Textarea
                id="decoder-desc"
                placeholder="Describe what this decoder does..."
                value={newDecoder.description}
                onChange={(e) => setNewDecoder({ ...newDecoder, description: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDecoderOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDecoder} disabled={isCreatingDecoder}>
              {isCreatingDecoder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Decoder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Value Driver Dialog */}
      <Dialog open={isAddDriverOpen} onOpenChange={setIsAddDriverOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Value Driver</DialogTitle>
            <DialogDescription>
              Create a price-affecting attribute that increases item value
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="driver-name">Name</Label>
              <Input
                id="driver-name"
                placeholder="e.g., Exotic Leather"
                value={newDriver.name}
                onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="driver-attribute">Attribute</Label>
              <Input
                id="driver-attribute"
                placeholder="e.g., material"
                value={newDriver.attribute}
                onChange={(e) => setNewDriver({ ...newDriver, attribute: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Condition Type</Label>
              <Select
                value={newDriver.conditionType}
                onValueChange={(value: 'contains' | 'equals' | 'regex') => setNewDriver({ ...newDriver, conditionType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contains">Contains</SelectItem>
                  <SelectItem value="equals">Equals</SelectItem>
                  <SelectItem value="regex">Regex</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="driver-condition">Condition Value</Label>
              <Input
                id="driver-condition"
                placeholder="e.g., python|crocodile|ostrich"
                value={newDriver.conditionValue}
                onChange={(e) => setNewDriver({ ...newDriver, conditionValue: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="driver-multiplier">Price Multiplier</Label>
              <Input
                id="driver-multiplier"
                type="number"
                step="0.1"
                min="0.1"
                placeholder="e.g., 2.5"
                value={newDriver.priceMultiplier}
                onChange={(e) => setNewDriver({ ...newDriver, priceMultiplier: parseFloat(e.target.value) || 1.0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDriverOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDriver} disabled={isCreatingDriver}>
              {isCreatingDriver && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Driver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Authenticity Marker Dialog */}
      <Dialog open={isAddMarkerOpen} onOpenChange={setIsAddMarkerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Authenticity Marker</DialogTitle>
            <DialogDescription>
              Create a pattern or check for authenticating items
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="marker-name">Name</Label>
              <Input
                id="marker-name"
                placeholder="e.g., Date Code Format"
                value={newMarker.name}
                onChange={(e) => setNewMarker({ ...newMarker, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="marker-desc">Check Description</Label>
              <Textarea
                id="marker-desc"
                placeholder="Describe what to check for..."
                value={newMarker.checkDescription}
                onChange={(e) => setNewMarker({ ...newMarker, checkDescription: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="marker-pattern">Pattern (Regex, optional)</Label>
              <Input
                id="marker-pattern"
                placeholder="e.g., ^[A-Z]{2}\d{4}$"
                value={newMarker.pattern}
                onChange={(e) => setNewMarker({ ...newMarker, pattern: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Importance</Label>
              <Select
                value={newMarker.importance}
                onValueChange={(value: 'critical' | 'important' | 'helpful') => setNewMarker({ ...newMarker, importance: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="important">Important</SelectItem>
                  <SelectItem value="helpful">Helpful</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMarkerOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateMarker} disabled={isCreatingMarker}>
              {isCreatingMarker && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Marker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Lookup Table Dialog */}
      <Dialog open={isAddTableOpen} onOpenChange={setIsAddTableOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Lookup Table</DialogTitle>
            <DialogDescription>
              Create a reference data table for factory codes, year codes, etc.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="table-name">Name</Label>
              <Input
                id="table-name"
                placeholder="e.g., LV Factory Codes"
                value={newTable.name}
                onChange={(e) => setNewTable({ ...newTable, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="table-desc">Description</Label>
              <Textarea
                id="table-desc"
                placeholder="Describe the purpose of this table..."
                value={newTable.description}
                onChange={(e) => setNewTable({ ...newTable, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="table-key">Key Field</Label>
              <Input
                id="table-key"
                placeholder="e.g., code"
                value={newTable.keyField}
                onChange={(e) => setNewTable({ ...newTable, keyField: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddTableOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTable} disabled={isCreatingTable}>
              {isCreatingTable && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== EDIT DIALOGS ===== */}

      {/* Edit Module Dialog */}
      <Dialog open={isEditModuleOpen} onOpenChange={setIsEditModuleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Module Settings</DialogTitle>
            <DialogDescription>
              Update the module name, description, and applicable brands
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-module-name">Name</Label>
              <Input
                id="edit-module-name"
                value={editModule.name}
                onChange={(e) => setEditModule({ ...editModule, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-module-desc">Description</Label>
              <Textarea
                id="edit-module-desc"
                value={editModule.description}
                onChange={(e) => setEditModule({ ...editModule, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-module-brands">Applicable Brands (comma-separated)</Label>
              <Input
                id="edit-module-brands"
                placeholder="e.g., Louis Vuitton, Gucci, Chanel"
                value={editModule.applicableBrands}
                onChange={(e) => setEditModule({ ...editModule, applicableBrands: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModuleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateModule} disabled={isUpdatingModule}>
              {isUpdatingModule && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Decoder Dialog */}
      <Dialog open={isEditDecoderOpen} onOpenChange={setIsEditDecoderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Decoder</DialogTitle>
            <DialogDescription>
              Update the decoder configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-decoder-name">Name</Label>
              <Input
                id="edit-decoder-name"
                value={editDecoder.name}
                onChange={(e) => setEditDecoder({ ...editDecoder, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-decoder-type">Identifier Type</Label>
              <Input
                id="edit-decoder-type"
                value={editDecoder.identifierType}
                onChange={(e) => setEditDecoder({ ...editDecoder, identifierType: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-decoder-pattern">Input Pattern (Regex)</Label>
              <Input
                id="edit-decoder-pattern"
                value={editDecoder.inputPattern}
                onChange={(e) => setEditDecoder({ ...editDecoder, inputPattern: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-decoder-desc">Description</Label>
              <Textarea
                id="edit-decoder-desc"
                value={editDecoder.description}
                onChange={(e) => setEditDecoder({ ...editDecoder, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-decoder-active"
                checked={editDecoder.isActive}
                onChange={(e) => setEditDecoder({ ...editDecoder, isActive: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="edit-decoder-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDecoderOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateDecoder} disabled={isUpdatingDecoder}>
              {isUpdatingDecoder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Value Driver Dialog */}
      <Dialog open={isEditDriverOpen} onOpenChange={setIsEditDriverOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Value Driver</DialogTitle>
            <DialogDescription>
              Update the value driver configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-driver-name">Name</Label>
              <Input
                id="edit-driver-name"
                value={editDriver.name}
                onChange={(e) => setEditDriver({ ...editDriver, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-driver-desc">Description</Label>
              <Textarea
                id="edit-driver-desc"
                value={editDriver.description}
                onChange={(e) => setEditDriver({ ...editDriver, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-driver-attribute">Attribute</Label>
              <Input
                id="edit-driver-attribute"
                value={editDriver.attribute}
                onChange={(e) => setEditDriver({ ...editDriver, attribute: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Condition Type</Label>
              <Select
                value={editDriver.conditionType}
                onValueChange={(value: 'contains' | 'equals' | 'regex' | 'range' | 'custom') => setEditDriver({ ...editDriver, conditionType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contains">Contains</SelectItem>
                  <SelectItem value="equals">Equals</SelectItem>
                  <SelectItem value="regex">Regex</SelectItem>
                  <SelectItem value="range">Range</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-driver-condition">Condition Value</Label>
              <Input
                id="edit-driver-condition"
                value={editDriver.conditionValue}
                onChange={(e) => setEditDriver({ ...editDriver, conditionValue: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-driver-multiplier">Price Multiplier</Label>
                <Input
                  id="edit-driver-multiplier"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={editDriver.priceMultiplier}
                  onChange={(e) => setEditDriver({ ...editDriver, priceMultiplier: parseFloat(e.target.value) || 1.0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-driver-priority">Priority</Label>
                <Input
                  id="edit-driver-priority"
                  type="number"
                  value={editDriver.priority}
                  onChange={(e) => setEditDriver({ ...editDriver, priority: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-driver-active"
                checked={editDriver.isActive}
                onChange={(e) => setEditDriver({ ...editDriver, isActive: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="edit-driver-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDriverOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateValueDriver} disabled={isUpdatingDriver}>
              {isUpdatingDriver && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Authenticity Marker Dialog */}
      <Dialog open={isEditMarkerOpen} onOpenChange={setIsEditMarkerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Authenticity Marker</DialogTitle>
            <DialogDescription>
              Update the authenticity marker configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-marker-name">Name</Label>
              <Input
                id="edit-marker-name"
                value={editMarker.name}
                onChange={(e) => setEditMarker({ ...editMarker, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-marker-desc">Check Description</Label>
              <Textarea
                id="edit-marker-desc"
                value={editMarker.checkDescription}
                onChange={(e) => setEditMarker({ ...editMarker, checkDescription: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-marker-pattern">Pattern (Regex, optional)</Label>
              <Input
                id="edit-marker-pattern"
                value={editMarker.pattern}
                onChange={(e) => setEditMarker({ ...editMarker, pattern: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Importance</Label>
              <Select
                value={editMarker.importance}
                onValueChange={(value: 'critical' | 'important' | 'helpful') => setEditMarker({ ...editMarker, importance: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="important">Important</SelectItem>
                  <SelectItem value="helpful">Helpful</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-marker-authentic"
                  checked={editMarker.indicatesAuthentic}
                  onChange={(e) => setEditMarker({ ...editMarker, indicatesAuthentic: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="edit-marker-authentic">Indicates Authentic</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-marker-active"
                  checked={editMarker.isActive}
                  onChange={(e) => setEditMarker({ ...editMarker, isActive: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="edit-marker-active">Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditMarkerOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateMarker} disabled={isUpdatingMarker}>
              {isUpdatingMarker && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Lookup Table Dialog */}
      <Dialog open={isEditTableOpen} onOpenChange={setIsEditTableOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Lookup Table</DialogTitle>
            <DialogDescription>
              Update the lookup table configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-table-name">Name</Label>
              <Input
                id="edit-table-name"
                value={editTable.name}
                onChange={(e) => setEditTable({ ...editTable, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-table-desc">Description</Label>
              <Textarea
                id="edit-table-desc"
                value={editTable.description}
                onChange={(e) => setEditTable({ ...editTable, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-table-key">Key Field</Label>
              <Input
                id="edit-table-key"
                value={editTable.keyField}
                disabled
              />
              <p className="text-xs text-muted-foreground">Key field cannot be changed after creation</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-table-active"
                checked={editTable.isActive}
                onChange={(e) => setEditTable({ ...editTable, isActive: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="edit-table-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditTableOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTable} disabled={isUpdatingTable}>
              {isUpdatingTable && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteConfirm?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeletingDecoder || isDeletingDriver || isDeletingMarker || isDeletingTable}
            >
              {(isDeletingDecoder || isDeletingDriver || isDeletingMarker || isDeletingTable) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppContent>
  );
}
