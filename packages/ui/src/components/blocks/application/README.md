# Application Blocks

This directory contains comprehensive application UI components including navigation, dashboards, shells, and administrative interfaces. These blocks provide complete application layouts and functionality.

## Components

### App Shell

**Purpose**: Complete application layout structure
**Use Cases**: Main app layout, responsive design wrapper
**Key Props**: `sidebar`, `header`, `footer`, `children`

```tsx
<AppShell
  sidebar={<AppSidebar />}
  header={<AppNavbar />}
  className="min-h-screen"
>
  <main>{children}</main>
</AppShell>
```

### App Sidebar

**Purpose**: Application navigation sidebar with collapsible sections
**Use Cases**: Main navigation, menu organization, responsive navigation
**Key Props**: `items`, `collapsible`, `defaultOpen`, `onToggle`

```tsx
<AppSidebar
  items={[
    {
      title: 'Dashboard',
      icon: <Home className="h-4 w-4" />,
      href: '/dashboard'
    },
    {
      title: 'Users',
      icon: <Users className="h-4 w-4" />,
      children: [
        { title: 'All Users', href: '/users' },
        { title: 'Add User', href: '/users/new' }
      ]
    }
  ]}
  collapsible={true}
  defaultOpen={true}
/>
```

### App Navbar

**Purpose**: Application header with navigation and user controls
**Use Cases**: Top navigation, user menu, global actions
**Key Props**: `title`, `user`, `actions`, `search`

```tsx
<AppNavbar
  title="My Application"
  user={{
    name: 'John Doe',
    email: 'john@example.com',
    avatar: '/avatar.jpg'
  }}
  actions={[
    { icon: <Bell />, onClick: toggleNotifications },
    { icon: <Settings />, href: '/settings' }
  ]}
  showSearch={true}
/>
```

### App Content

**Purpose**: Main content area with proper spacing and layout
**Use Cases**: Page content wrapper, responsive content
**Key Props**: `padding`, `maxWidth`, `centered`

```tsx
<AppContent
  padding="lg"
  maxWidth="7xl"
  centered={true}
>
  <PageHeader title="Dashboard" />
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {/* Content */}
  </div>
</AppContent>
```

### Dashboard Shell

**Purpose**: Complete dashboard layout with widgets and responsive grid
**Use Cases**: Analytics dashboards, admin panels, monitoring interfaces
**Key Props**: `widgets`, `layout`, `refreshInterval`, `loading`

```tsx
<DashboardShell
  widgets={[
    { id: 'metrics', component: <MetricsWidget />, span: 2 },
    { id: 'chart', component: <ChartWidget />, span: 1 },
    { id: 'table', component: <TableWidget />, span: 3 }
  ]}
  layout="grid"
  refreshInterval={30000}
  loading={isLoading}
/>
```

### Overview Cards

**Purpose**: Summary statistics cards with icons and trends
**Use Cases**: KPI displays, dashboard summaries, metric overviews
**Key Props**: `cards`, `layout`, `animate`

```tsx
<OverviewCards
  cards={[
    {
      title: 'Total Users',
      value: '2,340',
      change: '+12%',
      trend: 'up',
      icon: <Users className="h-4 w-4" />
    },
    {
      title: 'Revenue',
      value: '$45,230',
      change: '+8%',
      trend: 'up',
      icon: <DollarSign className="h-4 w-4" />
    }
  ]}
  layout="grid"
  animate={true}
/>
```

### Quick Actions

**Purpose**: Frequently used action buttons and shortcuts
**Use Cases**: Dashboard shortcuts, admin actions, quick tasks
**Key Props**: `actions`, `layout`, `size`

```tsx
<QuickActions
  actions={[
    {
      title: 'Add User',
      description: 'Create a new user account',
      icon: <UserPlus className="h-5 w-5" />,
      onClick: () => navigate('/users/new')
    },
    {
      title: 'Generate Report',
      description: 'Create monthly report',
      icon: <FileText className="h-5 w-5" />,
      onClick: generateReport
    }
  ]}
  layout="grid"
  size="default"
/>
```

### Metrics Dashboard

**Purpose**: Comprehensive metrics display with charts and KPIs
**Use Cases**: Analytics, monitoring, performance tracking
**Key Props**: `metrics`, `timeRange`, `refreshable`, `exportable`

```tsx
<MetricsDashboard
  metrics={[
    {
      name: 'Active Users',
      value: 1234,
      change: 12,
      chart: <LineChart data={userData} />
    },
    {
      name: 'Conversion Rate',
      value: 3.2,
      unit: '%',
      change: -0.5,
      chart: <AreaChart data={conversionData} />
    }
  ]}
  timeRange="7d"
  refreshable={true}
  exportable={true}
/>
```

### Notifications Panel

**Purpose**: Notification center with categorization and actions
**Use Cases**: Alert management, message center, system notifications
**Key Props**: `notifications`, `categories`, `onMarkAsRead`, `onClear`

```tsx
<NotificationsPanel
  notifications={[
    {
      id: '1',
      title: 'New User Registered',
      message: 'John Doe joined your application',
      type: 'info',
      timestamp: new Date(),
      read: false
    }
  ]}
  categories={['all', 'unread', 'important']}
  onMarkAsRead={markAsRead}
  onClear={clearNotification}
/>
```

### User Profile

**Purpose**: User profile display and editing interface
**Use Cases**: Profile pages, user management, account settings
**Key Props**: `user`, `editable`, `onUpdate`, `fields`

```tsx
<UserProfile
  user={{
    name: 'John Doe',
    email: 'john@example.com',
    avatar: '/avatar.jpg',
    role: 'Admin',
    lastActive: new Date()
  }}
  editable={true}
  onUpdate={handleProfileUpdate}
  fields={['name', 'email', 'bio', 'avatar']}
/>
```

### Settings Panel

**Purpose**: Application settings with categories and validation
**Use Cases**: App configuration, user preferences, admin settings
**Key Props**: `categories`, `settings`, `onSave`, `validation`

```tsx
<SettingsPanel
  categories={[
    {
      id: 'general',
      title: 'General',
      settings: [
        {
          key: 'appName',
          label: 'Application Name',
          type: 'text',
          value: 'My App'
        },
        {
          key: 'theme',
          label: 'Theme',
          type: 'select',
          options: ['light', 'dark', 'auto'],
          value: 'auto'
        }
      ]
    }
  ]}
  onSave={saveSettings}
  validation={settingsSchema}
/>
```

### API Explorer

**Purpose**: Interactive API documentation and testing interface
**Use Cases**: Developer tools, API documentation, testing interfaces
**Key Props**: `endpoints`, `authentication`, `baseUrl`, `onRequest`

```tsx
<APIExplorer
  endpoints={[
    {
      method: 'GET',
      path: '/api/users',
      description: 'List all users',
      parameters: [
        { name: 'page', type: 'number', required: false }
      ]
    }
  ]}
  authentication={{
    type: 'bearer',
    token: apiToken
  }}
  baseUrl="https://api.example.com"
  onRequest={handleApiRequest}
/>
```

### Log Viewer

**Purpose**: System logs display with filtering and search
**Use Cases**: Debugging, monitoring, audit trails
**Key Props**: `logs`, `filters`, `searchable`, `realTime`

```tsx
<LogViewer
  logs={systemLogs}
  filters={['error', 'warning', 'info', 'debug']}
  searchable={true}
  realTime={true}
  onFilter={handleLogFilter}
  onSearch={handleLogSearch}
/>
```

### Activity Widgets

**Purpose**: Recent activity feed and user actions
**Use Cases**: Activity streams, audit logs, user tracking
**Key Props**: `activities`, `groupBy`, `realTime`, `filters`

```tsx
<ActivityWidgets
  activities={[
    {
      user: 'John Doe',
      action: 'created',
      resource: 'user',
      timestamp: new Date(),
      details: { userId: '123' }
    }
  ]}
  groupBy="user"
  realTime={true}
  filters={['user', 'admin', 'system']}
/>
```

### Analytics Widgets

**Purpose**: Analytics charts and data visualization widgets
**Use Cases**: Data analysis, reporting, business intelligence
**Key Props**: `widgets`, `data`, `timeRange`, `interactive`

```tsx
<AnalyticsWidgets
  widgets={[
    {
      type: 'line-chart',
      title: 'User Growth',
      data: userGrowthData,
      height: 300
    },
    {
      type: 'pie-chart',
      title: 'Traffic Sources',
      data: trafficData,
      height: 300
    }
  ]}
  timeRange="30d"
  interactive={true}
/>
```

## Features

### Responsive Design

- Mobile-first approach
- Collapsible navigation
- Adaptive layouts
- Touch-friendly interfaces

### State Management

- Built-in state handling
- Persistence options
- Real-time updates
- Optimistic updates

### Accessibility

- ARIA compliance
- Keyboard navigation
- Screen reader support
- Focus management

### Performance

- Lazy loading
- Virtual scrolling
- Memoization
- Efficient re-renders

### Customization

- Theme support
- Custom layouts
- Configurable components
- Brand integration

## Usage Examples

### Complete App Layout

```tsx
function App() {
  return (
    <AppShell
      sidebar={
        <AppSidebar
          items={navigationItems}
          collapsible={true}
        />
      }
      header={
        <AppNavbar
          title="Dashboard"
          user={currentUser}
          actions={headerActions}
        />
      }
    >
      <AppContent>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/users" element={<UsersPage />} />
        </Routes>
      </AppContent>
    </AppShell>
  );
}
```

### Admin Dashboard

```tsx
function AdminDashboard() {
  return (
    <DashboardShell
      widgets={[
        { id: 'overview', component: <OverviewCards cards={kpiCards} /> },
        { id: 'metrics', component: <MetricsDashboard metrics={metrics} /> },
        { id: 'activity', component: <ActivityWidgets activities={recentActivity} /> }
      ]}
      refreshInterval={30000}
    />
  );
}
```
