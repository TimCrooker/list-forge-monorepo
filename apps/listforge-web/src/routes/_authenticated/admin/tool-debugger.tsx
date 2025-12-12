import { createFileRoute, Navigate } from '@tanstack/react-router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import {
  useListDebuggerToolsQuery,
  useLazySearchDebuggerItemsQuery,
  useExecuteDebuggerToolMutation,
} from '@listforge/api-rtk';
import { ToolInfoDto, DebuggerItemDto } from '@listforge/api-types';
import {
  AppContent,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Input,
  Label,
  Skeleton,
  ScrollArea,
  Separator,
  toast,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@listforge/ui';
import {
  Play,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  Box,
  FlaskConical,
  SearchCode,
  BarChart3,
  Zap,
  ChevronsUpDown,
  Check,
  Copy,
  Plus,
  Trash2,
} from 'lucide-react';
import { useState, useMemo, useCallback } from 'react';
import { cn } from '@listforge/ui';

export const Route = createFileRoute('/_authenticated/admin/tool-debugger')({
  component: ToolDebuggerPage,
});

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  item: Box,
  research: FlaskConical,
  search: SearchCode,
  aggregate: BarChart3,
  action: Zap,
};

const CATEGORY_LABELS: Record<string, string> = {
  item: 'Item Tools',
  research: 'Research Tools',
  search: 'Search Tools',
  aggregate: 'Aggregate Tools',
  action: 'Action Tools',
};

function ToolDebuggerPage() {
  const user = useSelector((state: RootState) => state.auth.user);

  // Selected state
  const [selectedItem, setSelectedItem] = useState<DebuggerItemDto | null>(null);
  const [selectedTool, setSelectedTool] = useState<ToolInfoDto | null>(null);
  const [inputs, setInputs] = useState<Record<string, unknown>>({});
  const [itemSearchOpen, setItemSearchOpen] = useState(false);
  const [itemSearchQuery, setItemSearchQuery] = useState('');

  // API hooks
  const { data: toolsData, isLoading: toolsLoading } = useListDebuggerToolsQuery();
  const [searchItems, { data: searchResults, isFetching: searchingItems }] =
    useLazySearchDebuggerItemsQuery();
  const [executeTool, { data: result, isLoading: executing }] =
    useExecuteDebuggerToolMutation();

  // Check admin access
  if (user?.globalRole !== 'superadmin' && user?.globalRole !== 'staff') {
    return <Navigate to="/" />;
  }

  // Group tools by category
  const toolsByCategory = useMemo(() => {
    if (!toolsData?.tools) return {};
    return toolsData.tools.reduce(
      (acc, tool) => {
        if (!acc[tool.category]) acc[tool.category] = [];
        acc[tool.category].push(tool);
        return acc;
      },
      {} as Record<string, ToolInfoDto[]>
    );
  }, [toolsData?.tools]);

  // Handle item search
  const handleItemSearch = useCallback(
    (query: string) => {
      setItemSearchQuery(query);
      searchItems({ query, limit: 20 });
    },
    [searchItems]
  );

  // Handle tool selection
  const handleToolSelect = (tool: ToolInfoDto) => {
    setSelectedTool(tool);
    // Pre-populate itemId if we have a selected item and tool requires it
    const newInputs: Record<string, unknown> = {};
    if (selectedItem && tool.requiredContext.itemId) {
      newInputs.itemId = selectedItem.id;
    }
    setInputs(newInputs);
  };

  // Handle input change
  const handleInputChange = (key: string, value: unknown) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  // Execute tool
  const handleExecute = async () => {
    if (!selectedTool) return;

    try {
      await executeTool({
        toolName: selectedTool.name,
        itemId: selectedItem?.id,
        inputs,
      }).unwrap();
    } catch (error) {
      console.error('Tool execution failed:', error);
      toast({
        variant: 'destructive',
        title: 'Execution Failed',
        description: 'Failed to execute tool. Check the output for details.',
      });
    }
  };

  // Copy result to clipboard
  const handleCopyResult = () => {
    if (result?.result) {
      navigator.clipboard.writeText(result.result);
      toast({
        title: 'Copied',
        description: 'Result copied to clipboard',
      });
    }
  };

  return (
    <AppContent title="Tool Debugger" description="Test AI workflow tools in isolation">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel - Item & Tool Selection */}
        <div className="lg:col-span-4 space-y-4">
          {/* Item Selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Select Item</CardTitle>
              <CardDescription>
                Choose an item to test tools against (optional for some tools)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Popover open={itemSearchOpen} onOpenChange={setItemSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={itemSearchOpen}
                    className="w-full justify-between"
                  >
                    {selectedItem ? (
                      <span className="truncate">
                        {selectedItem.title || `Item ${selectedItem.id.slice(0, 8)}...`}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Search items...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Search by title or ID..."
                      value={itemSearchQuery}
                      onValueChange={handleItemSearch}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {searchingItems ? 'Searching...' : 'No items found.'}
                      </CommandEmpty>
                      <CommandGroup>
                        {searchResults?.items.map((item) => (
                          <CommandItem
                            key={item.id}
                            value={item.id}
                            onSelect={() => {
                              setSelectedItem(item);
                              setItemSearchOpen(false);
                              // Update itemId in inputs if tool requires it
                              if (selectedTool?.requiredContext.itemId) {
                                setInputs((prev) => ({ ...prev, itemId: item.id }));
                              }
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                selectedItem?.id === item.id ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="truncate">
                                {item.title || `Item ${item.id.slice(0, 8)}...`}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {item.lifecycleStatus} / {item.aiReviewState}
                                {item.defaultPrice && ` / $${item.defaultPrice.toFixed(2)}`}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {selectedItem && (
                <div className="mt-3 p-3 bg-muted rounded-md">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{selectedItem.lifecycleStatus}</Badge>
                    <Badge variant="secondary">{selectedItem.aiReviewState}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 font-mono">
                    ID: {selectedItem.id}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tool Selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Select Tool</CardTitle>
              <CardDescription>Choose a tool to test</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {toolsLoading ? (
                <div className="p-4 space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  {Object.entries(toolsByCategory).map(([category, tools]) => {
                    const Icon = CATEGORY_ICONS[category] || Box;
                    return (
                      <div key={category}>
                        <div className="px-4 py-2 bg-muted/50 flex items-center gap-2 sticky top-0">
                          <Icon className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            {CATEGORY_LABELS[category] || category}
                          </span>
                          <Badge variant="secondary" className="ml-auto">
                            {tools.length}
                          </Badge>
                        </div>
                        {tools.map((tool) => {
                          const requiresItem = tool.requiredContext.itemId;
                          const isDisabled = requiresItem && !selectedItem;
                          const isSelected = selectedTool?.name === tool.name;

                          return (
                            <button
                              key={tool.name}
                              onClick={() => !isDisabled && handleToolSelect(tool)}
                              disabled={isDisabled}
                              className={cn(
                                'w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-muted/50 transition-colors',
                                isSelected && 'bg-primary/10',
                                isDisabled && 'opacity-50 cursor-not-allowed'
                              )}
                            >
                              <ChevronRight
                                className={cn(
                                  'h-4 w-4 transition-transform',
                                  isSelected && 'rotate-90'
                                )}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-mono truncate">{tool.name}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {tool.description}
                                </p>
                              </div>
                              {requiresItem && (
                                <Badge variant="outline" className="text-xs shrink-0">
                                  itemId
                                </Badge>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Inputs & Output */}
        <div className="lg:col-span-8 space-y-4">
          {/* Input Form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {selectedTool ? (
                  <>
                    <span className="font-mono">{selectedTool.name}</span>
                    <Badge>{selectedTool.category}</Badge>
                  </>
                ) : (
                  'Tool Inputs'
                )}
              </CardTitle>
              <CardDescription>
                {selectedTool?.description || 'Select a tool to configure inputs'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedTool ? (
                <div className="space-y-4">
                  <SchemaForm
                    schema={selectedTool.jsonSchema}
                    values={inputs}
                    onChange={handleInputChange}
                    selectedItemId={selectedItem?.id}
                  />

                  <Separator />

                  <Button
                    onClick={handleExecute}
                    disabled={executing}
                    className="w-full"
                  >
                    {executing ? (
                      <>
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        Executing...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Execute Tool
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a tool from the list to configure inputs</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Output Panel */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Output</CardTitle>
                  <CardDescription>
                    {result
                      ? `Executed in ${result.executionTimeMs}ms`
                      : 'Execute a tool to see results'}
                  </CardDescription>
                </div>
                {result && (
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <Badge className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Success
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Error
                      </Badge>
                    )}
                    <Button variant="outline" size="sm" onClick={handleCopyResult}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-4">
                  {result.error && (
                    <div className="p-3 bg-destructive/10 text-destructive rounded-md">
                      <p className="font-medium">Error</p>
                      <p className="text-sm">{result.error}</p>
                    </div>
                  )}

                  {result.validationErrors && result.validationErrors.length > 0 && (
                    <div className="p-3 bg-yellow-500/10 text-yellow-700 rounded-md">
                      <p className="font-medium">Validation Errors</p>
                      <ul className="text-sm mt-1 list-disc list-inside">
                        {result.validationErrors.map((err, i) => (
                          <li key={i}>
                            <span className="font-mono">{err.path.join('.')}</span>:{' '}
                            {err.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <ScrollArea className="h-[400px] rounded-md border">
                    <pre className="p-4 text-sm font-mono whitespace-pre-wrap">
                      {result.result
                        ? (() => {
                            try {
                              return JSON.stringify(JSON.parse(result.result), null, 2);
                            } catch {
                              // If not valid JSON, show raw result
                              return result.result;
                            }
                          })()
                        : '(empty result)'}
                    </pre>
                  </ScrollArea>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Execute a tool to see results here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppContent>
  );
}

/**
 * JSON Schema property definition
 */
interface SchemaProperty {
  type?: string | string[];
  description?: string;
  enum?: string[];
  default?: unknown;
  minimum?: number;
  maximum?: number;
  items?: SchemaProperty;
  properties?: Record<string, SchemaProperty>;
  required?: string[];
}

/**
 * Dynamic form generated from JSON Schema
 */
interface SchemaFormProps {
  schema: Record<string, unknown>;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  selectedItemId?: string;
}

function SchemaForm({ schema, values, onChange, selectedItemId }: SchemaFormProps) {
  const properties = (schema.properties || {}) as Record<string, SchemaProperty>;
  const required = (schema.required || []) as string[];

  return (
    <div className="space-y-4">
      {Object.entries(properties).map(([key, prop]) => (
        <SchemaField
          key={key}
          fieldKey={key}
          prop={prop}
          value={values[key]}
          onChange={(value) => onChange(key, value)}
          isRequired={required.includes(key)}
          selectedItemId={selectedItemId}
        />
      ))}

      {Object.keys(properties).length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          This tool has no configurable inputs
        </p>
      )}
    </div>
  );
}

/**
 * Individual schema field component
 */
interface SchemaFieldProps {
  fieldKey: string;
  prop: SchemaProperty;
  value: unknown;
  onChange: (value: unknown) => void;
  isRequired: boolean;
  selectedItemId?: string;
}

function SchemaField({
  fieldKey,
  prop,
  value,
  onChange,
  isRequired,
  selectedItemId,
}: SchemaFieldProps) {
  const isItemId = fieldKey === 'itemId';
  const propType = Array.isArray(prop.type) ? prop.type[0] : prop.type;
  const displayValue = value ?? prop.default ?? '';

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldKey} className="flex items-center gap-2">
        <span className="font-mono text-sm">{fieldKey}</span>
        {isRequired && <span className="text-destructive">*</span>}
        {isItemId && selectedItemId && (
          <Badge variant="outline" className="text-xs">
            auto-filled
          </Badge>
        )}
        {propType && (
          <Badge variant="secondary" className="text-xs">
            {propType}
          </Badge>
        )}
      </Label>

      {prop.description && (
        <p className="text-xs text-muted-foreground">{prop.description}</p>
      )}

      {prop.enum ? (
        <Select value={String(displayValue)} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder={`Select ${fieldKey}`} />
          </SelectTrigger>
          <SelectContent>
            {prop.enum.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : propType === 'boolean' ? (
        <div className="flex items-center gap-2">
          <Switch
            id={fieldKey}
            checked={Boolean(displayValue)}
            onCheckedChange={onChange}
          />
          <Label htmlFor={fieldKey} className="text-sm text-muted-foreground">
            {displayValue ? 'true' : 'false'}
          </Label>
        </div>
      ) : propType === 'number' || propType === 'integer' ? (
        <Input
          id={fieldKey}
          type="number"
          value={String(displayValue)}
          onChange={(e) =>
            onChange(e.target.value ? Number(e.target.value) : undefined)
          }
          min={prop.minimum}
          max={prop.maximum}
          placeholder={`Enter ${fieldKey}`}
        />
      ) : propType === 'array' ? (
        <ArrayField
          fieldKey={fieldKey}
          prop={prop}
          value={value as unknown[] | undefined}
          onChange={onChange}
        />
      ) : propType === 'object' ? (
        <ObjectField
          fieldKey={fieldKey}
          prop={prop}
          value={value as Record<string, unknown> | undefined}
          onChange={onChange}
        />
      ) : fieldKey.toLowerCase().includes('description') ||
        fieldKey.toLowerCase().includes('query') ? (
        <Textarea
          id={fieldKey}
          value={String(displayValue)}
          onChange={(e) => onChange(e.target.value || undefined)}
          placeholder={`Enter ${fieldKey}`}
          rows={3}
        />
      ) : (
        <Input
          id={fieldKey}
          value={String(displayValue)}
          onChange={(e) => onChange(e.target.value || undefined)}
          placeholder={`Enter ${fieldKey}`}
        />
      )}
    </div>
  );
}

/**
 * Array field with add/remove controls
 */
interface ArrayFieldProps {
  fieldKey: string;
  prop: SchemaProperty;
  value: unknown[] | undefined;
  onChange: (value: unknown[]) => void;
}

function ArrayField({ fieldKey, prop, value, onChange }: ArrayFieldProps) {
  const items = value || [];
  const itemSchema = prop.items;
  const itemType = itemSchema?.type;

  const addItem = () => {
    const defaultValue = getDefaultValue(itemSchema);
    onChange([...items, defaultValue]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, newValue: unknown) => {
    const newItems = [...items];
    newItems[index] = newValue;
    onChange(newItems);
  };

  return (
    <div className="space-y-2 border rounded-md p-3 bg-muted/30">
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">
          No items. Click "Add" to add an item.
        </p>
      ) : (
        items.map((item, index) => (
          <div key={index} className="flex items-start gap-2">
            <div className="flex-1">
              {itemType === 'object' && itemSchema?.properties ? (
                <ObjectField
                  fieldKey={`${fieldKey}[${index}]`}
                  prop={itemSchema}
                  value={item as Record<string, unknown>}
                  onChange={(v) => updateItem(index, v)}
                />
              ) : itemType === 'number' || itemType === 'integer' ? (
                <Input
                  type="number"
                  value={String(item ?? '')}
                  onChange={(e) =>
                    updateItem(
                      index,
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  placeholder={`Item ${index + 1}`}
                />
              ) : (
                <Input
                  value={String(item ?? '')}
                  onChange={(e) => updateItem(index, e.target.value || undefined)}
                  placeholder={`Item ${index + 1}`}
                />
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeItem(index)}
              className="shrink-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addItem}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-1" />
        Add Item
      </Button>
    </div>
  );
}

/**
 * Object field with nested properties
 */
interface ObjectFieldProps {
  fieldKey: string;
  prop: SchemaProperty;
  value: Record<string, unknown> | undefined;
  onChange: (value: Record<string, unknown>) => void;
}

function ObjectField({ fieldKey: _fieldKey, prop, value, onChange }: ObjectFieldProps) {
  const objectValue = value || {};
  const properties = prop.properties || {};
  const required = prop.required || [];
  const [jsonError, setJsonError] = useState<string | null>(null);

  // If no schema defined, show JSON editor
  if (Object.keys(properties).length === 0) {
    return (
      <div className="space-y-1">
        <Textarea
          value={JSON.stringify(objectValue, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              onChange(parsed);
              setJsonError(null);
            } catch (err) {
              // Show error feedback but keep the text input
              setJsonError(err instanceof Error ? err.message : 'Invalid JSON');
            }
          }}
          placeholder='{ "key": "value" }'
          rows={4}
          className={cn(
            'font-mono text-xs',
            jsonError && 'border-destructive focus-visible:ring-destructive'
          )}
        />
        {jsonError && (
          <p className="text-xs text-destructive">{jsonError}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 border rounded-md p-3 bg-muted/30">
      {Object.entries(properties).map(([key, subProp]) => {
        const subPropType = Array.isArray(subProp.type)
          ? subProp.type[0]
          : subProp.type;

        return (
          <div key={key} className="space-y-1">
            <Label className="text-xs font-mono flex items-center gap-1">
              {key}
              {required.includes(key) && (
                <span className="text-destructive">*</span>
              )}
            </Label>
            {subProp.enum ? (
              <Select
                value={String(objectValue[key] ?? '')}
                onValueChange={(v) => onChange({ ...objectValue, [key]: v })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder={`Select ${key}`} />
                </SelectTrigger>
                <SelectContent>
                  {subProp.enum.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : subPropType === 'boolean' ? (
              <Switch
                checked={Boolean(objectValue[key])}
                onCheckedChange={(checked) =>
                  onChange({ ...objectValue, [key]: checked })
                }
              />
            ) : subPropType === 'number' || subPropType === 'integer' ? (
              <Input
                type="number"
                className="h-8"
                value={String(objectValue[key] ?? '')}
                onChange={(e) =>
                  onChange({
                    ...objectValue,
                    [key]: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder={key}
              />
            ) : (
              <Input
                className="h-8"
                value={String(objectValue[key] ?? '')}
                onChange={(e) =>
                  onChange({
                    ...objectValue,
                    [key]: e.target.value || undefined,
                  })
                }
                placeholder={key}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Get default value for a schema type
 */
function getDefaultValue(schema?: SchemaProperty): unknown {
  if (!schema) return '';
  if (schema.default !== undefined) return schema.default;

  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;

  switch (type) {
    case 'string':
      return '';
    case 'number':
    case 'integer':
      return 0;
    case 'boolean':
      return false;
    case 'array':
      return [];
    case 'object':
      return {};
    default:
      return '';
  }
}
