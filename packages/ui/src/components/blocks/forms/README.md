# Form Blocks

This directory contains advanced form components including search interfaces, filters, and complex form layouts. These blocks handle sophisticated form interactions and data collection.

## Components

### Search Filters

**Purpose**: Advanced search and filtering interface with multiple criteria
**Use Cases**: Product search, data filtering, content discovery
**Key Props**: `filters`, `onFiltersChange`, `searchValue`, `categories`, `layout`

```tsx
<SearchFilters
  filters={[
    {
      id: 'category',
      label: 'Category',
      type: 'select',
      options: [
        { value: 'electronics', label: 'Electronics' },
        { value: 'clothing', label: 'Clothing' },
        { value: 'books', label: 'Books' }
      ]
    },
    {
      id: 'price',
      label: 'Price Range',
      type: 'range',
      min: 0,
      max: 1000,
      step: 10
    },
    {
      id: 'rating',
      label: 'Rating',
      type: 'rating',
      max: 5
    },
    {
      id: 'inStock',
      label: 'In Stock Only',
      type: 'checkbox'
    }
  ]}
  searchValue={searchQuery}
  onSearchChange={setSearchQuery}
  onFiltersChange={handleFiltersChange}
  layout="sidebar"
  collapsible={true}
/>
```

## Features

### Filter Types

- **Text Search**: Full-text search with autocomplete
- **Select Filters**: Single and multi-select dropdowns
- **Range Filters**: Price, date, and numeric ranges
- **Checkbox Filters**: Boolean and multi-option checkboxes
- **Rating Filters**: Star rating selection
- **Date Filters**: Date pickers and range selectors
- **Location Filters**: Geographic location selection

### Advanced Capabilities

- Real-time filtering
- Filter persistence
- URL synchronization
- Advanced query building
- Custom filter components
- Filter presets and saved searches
- Clear all functionality

### Search Features

- Autocomplete suggestions
- Search history
- Typo tolerance
- Faceted search
- Search analytics
- Custom ranking

## Usage Examples

### E-commerce Product Search

```tsx
function ProductSearch() {
  const [filters, setFilters] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);

  const filterConfig = [
    {
      id: 'category',
      label: 'Category',
      type: 'select',
      options: categories,
      multiple: true
    },
    {
      id: 'priceRange',
      label: 'Price Range',
      type: 'range',
      min: 0,
      max: 500,
      step: 5,
      formatValue: (value) => `$${value}`
    },
    {
      id: 'brand',
      label: 'Brand',
      type: 'checkbox',
      options: brands
    },
    {
      id: 'rating',
      label: 'Customer Rating',
      type: 'rating',
      max: 5
    },
    {
      id: 'availability',
      label: 'Availability',
      type: 'radio',
      options: [
        { value: 'all', label: 'All Products' },
        { value: 'inStock', label: 'In Stock' },
        { value: 'onSale', label: 'On Sale' }
      ]
    }
  ];

  return (
    <div className="flex gap-6">
      <aside className="w-64">
        <SearchFilters
          filters={filterConfig}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          onFiltersChange={setFilters}
          layout="sidebar"
          showClearAll={true}
          showResultCount={true}
          resultCount={results.length}
        />
      </aside>

      <main className="flex-1">
        <ProductGrid products={results} />
      </main>
    </div>
  );
}
```

### Advanced Data Table Filters

```tsx
function DataTableWithFilters() {
  const [tableFilters, setTableFilters] = useState({});

  const filterConfig = [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active', color: 'green' },
        { value: 'inactive', label: 'Inactive', color: 'gray' },
        { value: 'pending', label: 'Pending', color: 'yellow' }
      ],
      multiple: true
    },
    {
      id: 'dateRange',
      label: 'Created Date',
      type: 'dateRange',
      presets: [
        { label: 'Last 7 days', value: { from: subDays(new Date(), 7), to: new Date() } },
        { label: 'Last 30 days', value: { from: subDays(new Date(), 30), to: new Date() } },
        { label: 'This year', value: { from: startOfYear(new Date()), to: new Date() } }
      ]
    },
    {
      id: 'tags',
      label: 'Tags',
      type: 'multiSelect',
      searchable: true,
      createable: true,
      options: availableTags
    }
  ];

  return (
    <div className="space-y-4">
      <SearchFilters
        filters={filterConfig}
        onFiltersChange={setTableFilters}
        layout="horizontal"
        showActiveFilters={true}
        showSaveFilter={true}
        savedFilters={savedFilterPresets}
      />

      <DataTable
        data={filteredData}
        columns={columns}
        filters={tableFilters}
      />
    </div>
  );
}
```
