# Data Display Blocks

This directory contains advanced data visualization and display components including charts, tables, feeds, and interactive data representations. These blocks handle complex data presentation with built-in interactivity and responsive design.

## Components

### Data Table

**Purpose**: Advanced data table with sorting, filtering, pagination, and actions
**Use Cases**: User management, data administration, content management
**Key Props**: `data`, `columns`, `sorting`, `filtering`, `pagination`, `actions`

```tsx
<DataTable
  data={userData}
  columns={[
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Avatar src={row.original.avatar} />
          <span>{row.getValue('name')}</span>
        </div>
      )
    },
    {
      accessorKey: 'email',
      header: 'Email',
      enableSorting: true
    },
    {
      id: 'actions',
      cell: ({ row }) => <DataTableRowActions row={row} />
    }
  ]}
  enableSorting={true}
  enableFiltering={true}
  pagination={{ pageSize: 10 }}
/>
```

### Area Chart

**Purpose**: Area chart visualization for time series and comparative data
**Use Cases**: Analytics dashboards, trend analysis, performance metrics
**Key Props**: `data`, `xKey`, `yKey`, `categories`, `colors`, `stacked`

```tsx
<AreaChart
  data={monthlyData}
  xKey="month"
  yKey="value"
  categories={['revenue', 'expenses', 'profit']}
  colors={['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(var(--success))']}
  stacked={true}
  height={300}
/>
```

### Bar Chart

**Purpose**: Bar chart for categorical data comparison
**Use Cases**: Sales comparisons, category analysis, performance metrics
**Key Props**: `data`, `xKey`, `yKey`, `orientation`, `categories`

```tsx
<BarChart
  data={salesData}
  xKey="category"
  yKey="sales"
  orientation="vertical"
  categories={['Q1', 'Q2', 'Q3', 'Q4']}
  height={400}
/>
```

### Line Chart

**Purpose**: Line chart for trend visualization and time series
**Use Cases**: Performance tracking, trend analysis, monitoring
**Key Props**: `data`, `xKey`, `yKey`, `categories`, `smooth`, `dots`

```tsx
<LineChart
  data={performanceData}
  xKey="date"
  yKey="value"
  categories={['users', 'sessions', 'pageviews']}
  smooth={true}
  dots={false}
  height={300}
/>
```

### Pie Chart

**Purpose**: Pie chart for proportion and percentage visualization
**Use Cases**: Distribution analysis, market share, resource allocation
**Key Props**: `data`, `nameKey`, `valueKey`, `colors`, `showLabels`

```tsx
<PieChart
  data={distributionData}
  nameKey="category"
  valueKey="value"
  colors={['#8884d8', '#82ca9d', '#ffc658', '#ff7300']}
  showLabels={true}
  innerRadius={60}
/>
```

### KPI Card

**Purpose**: Key Performance Indicator display with trends and comparisons
**Use Cases**: Dashboard metrics, business intelligence, performance monitoring
**Key Props**: `title`, `value`, `change`, `trend`, `target`, `icon`

```tsx
<KPICard
  title="Monthly Revenue"
  value="$125,430"
  change={12.5}
  trend="up"
  target="$120,000"
  icon={<DollarSign className="h-4 w-4" />}
  period="vs last month"
/>
```

### Activity Feed

**Purpose**: Real-time activity stream and event log display
**Use Cases**: User activity, system logs, audit trails, notifications
**Key Props**: `activities`, `groupBy`, `realTime`, `avatars`, `actions`

```tsx
<ActivityFeed
  activities={[
    {
      id: '1',
      user: 'John Doe',
      action: 'created',
      resource: 'user account',
      timestamp: new Date(),
      avatar: '/avatars/john.jpg'
    },
    {
      id: '2',
      user: 'System',
      action: 'updated',
      resource: 'security settings',
      timestamp: new Date(),
      type: 'system'
    }
  ]}
  groupBy="date"
  realTime={true}
  showAvatars={true}
/>
```

### Timeline

**Purpose**: Chronological event timeline visualization
**Use Cases**: Project timelines, process flows, history tracking
**Key Props**: `events`, `orientation`, `interactive`, `groupBy`

```tsx
<Timeline
  events={[
    {
      id: '1',
      title: 'Project Started',
      description: 'Initial project setup and planning',
      date: new Date('2024-01-01'),
      status: 'completed',
      icon: <Play className="h-4 w-4" />
    },
    {
      id: '2',
      title: 'Design Phase',
      description: 'UI/UX design and prototyping',
      date: new Date('2024-01-15'),
      status: 'in-progress',
      icon: <Palette className="h-4 w-4" />
    }
  ]}
  orientation="vertical"
  interactive={true}
/>
```

### Kanban Board

**Purpose**: Task management board with drag-and-drop functionality
**Use Cases**: Project management, workflow organization, task tracking
**Key Props**: `columns`, `tasks`, `onTaskMove`, `onTaskUpdate`, `editable`

```tsx
<KanbanBoard
  columns={[
    { id: 'todo', title: 'To Do', limit: 5 },
    { id: 'doing', title: 'In Progress', limit: 3 },
    { id: 'done', title: 'Done' }
  ]}
  tasks={[
    {
      id: '1',
      title: 'Design homepage',
      description: 'Create wireframes and mockups',
      column: 'todo',
      assignee: 'John Doe',
      priority: 'high',
      tags: ['design', 'frontend']
    }
  ]}
  onTaskMove={handleTaskMove}
  onTaskUpdate={handleTaskUpdate}
  editable={true}
/>
```

## Specialized Components

### Data Table Column Header

**Purpose**: Sortable column header for data tables
**Use Cases**: Table sorting, column controls
**Key Props**: `column`, `title`, `canSort`, `canFilter`

```tsx
<DataTableColumnHeader
  column={column}
  title="Name"
  canSort={true}
  canFilter={true}
/>
```

### Data Table Faceted Filter

**Purpose**: Multi-select filter for table columns
**Use Cases**: Data filtering, search refinement
**Key Props**: `column`, `title`, `options`, `selectedValues`

```tsx
<DataTableFacetedFilter
  column={table.getColumn('status')}
  title="Status"
  options={[
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ]}
/>
```

### Data Table Row Actions

**Purpose**: Action menu for table rows
**Use Cases**: Row-level operations, context menus
**Key Props**: `row`, `actions`, `onAction`

```tsx
<DataTableRowActions
  row={row}
  actions={[
    { label: 'Edit', icon: <Edit />, onClick: handleEdit },
    { label: 'Delete', icon: <Trash />, onClick: handleDelete, destructive: true }
  ]}
/>
```

## Features

### Interactive Charts

- Zoom and pan functionality
- Tooltip displays
- Legend interactions
- Data point selection
- Real-time updates

### Data Table Features

- Column sorting (single and multi)
- Global and column filtering
- Row selection (single and multi)
- Pagination with size options
- Column visibility toggle
- Export functionality
- Responsive design

### Responsive Design

- Mobile-optimized layouts
- Adaptive chart sizing
- Collapsible table columns
- Touch-friendly interactions

### Performance

- Virtual scrolling for large datasets
- Lazy loading of data
- Efficient re-rendering
- Memory optimization

### Accessibility

- Screen reader support
- Keyboard navigation
- ARIA labels and descriptions
- High contrast support

## Usage Examples

### Complete Dashboard

```tsx
function AnalyticsDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Total Users"
          value="12,543"
          change={8.2}
          trend="up"
          icon={<Users />}
        />
        <KPICard
          title="Revenue"
          value="$45,210"
          change={-2.1}
          trend="down"
          icon={<DollarSign />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              data={revenueData}
              xKey="month"
              yKey="revenue"
              height={300}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart
              data={trafficData}
              nameKey="source"
              valueKey="visits"
              height={300}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityFeed
            activities={recentActivity}
            realTime={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}
```

### Advanced Data Table

```tsx
function UsersTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const columns = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Avatar src={row.original.avatar} />
          <span>{row.getValue('name')}</span>
        </div>
      )
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => (
        <Badge variant={row.getValue('status') === 'active' ? 'default' : 'secondary'}>
          {row.getValue('status')}
        </Badge>
      ),
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      }
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DataTableRowActions
          row={row}
          actions={[
            { label: 'Edit', onClick: () => editUser(row.original.id) },
            { label: 'Delete', onClick: () => deleteUser(row.original.id), destructive: true }
          ]}
        />
      )
    }
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      loading={loading}
      enableSorting={true}
      enableFiltering={true}
      pagination={{ pageSize: 10 }}
      toolbar={
        <DataTableFacetedFilter
          column={table.getColumn('status')}
          title="Status"
          options={statusOptions}
        />
      }
    />
  );
}
```
