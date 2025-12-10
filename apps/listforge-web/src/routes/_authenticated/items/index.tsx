import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useMemo } from 'react'
import { useListItemsQuery, useOrgRoom, useMeQuery } from '@listforge/api-rtk'
import { itemsToProducts } from '@/utils/transformers'
import { useItemFilters } from '@/hooks/useItemFilters'
import {
	Button,
	ProductGrid,
	type Product,
	Input,
	Tabs,
	TabsList,
	TabsTrigger,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Badge,
	AppContent,
} from '@listforge/ui'
import { Plus, Loader2, Search, Filter, Bot, User } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/items/')({
	component: ItemsListPage,
})

function ItemsListPage() {
	const navigate = useNavigate()

	// Use custom hook for filter management
	const {
		lifecycleTab,
		setLifecycleTab,
		sourceFilter,
		setSourceFilter,
		searchQuery,
		searchInput,
		setSearchInput,
		sortOption,
		setSortOption,
		handleSearchChange,
		lifecycleFilter,
		sourceFilterArray,
		sortBy,
		sortOrder,
	} = useItemFilters({
		lifecycleTab: 'inventory',
		sourceFilter: 'all',
		searchQuery: '',
		sortOption: 'newest',
	})

	const { data, isLoading, error } = useListItemsQuery({
		lifecycleStatus: lifecycleFilter.length > 0 ? lifecycleFilter : undefined,
		source: sourceFilterArray.length > 0 ? sourceFilterArray : undefined,
		search: searchQuery || undefined,
		sortBy,
		sortOrder,
		page: 1,
		pageSize: 100,
	})

	// Get current org for socket subscription
	const { data: meData } = useMeQuery()
	const currentOrgId = meData?.currentOrg?.id

	// Subscribe to org room for real-time updates on items
	useOrgRoom(currentOrgId)

	// Transform items to Product format for ProductGrid
	const products: Product[] = useMemo(() => {
		if (!data?.items) return []
		return itemsToProducts(data.items)
	}, [data?.items])

	const handleQuickView = (product: Product) => {
		navigate({ to: '/items/$id', params: { id: product.id } })
	}

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="flex justify-between items-center">
					<h1 className="text-3xl font-bold">Inventory</h1>
				</div>
				<div className="flex items-center justify-center py-12">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="space-y-6">
				<div className="flex justify-between items-center">
					<h1 className="text-3xl font-bold">Inventory</h1>
				</div>
				<div className="text-center py-12">
					<p className="text-destructive">Error loading items</p>
				</div>
			</div>
		)
	}

	return (
		<AppContent
			title="Inventory"
			description={`${data?.total || 0} ${data?.total === 1 ? 'item' : 'items'} ${lifecycleTab !== 'all' && `(${lifecycleTab})`}`}
			actions={
				<Link to="/items/new">
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						New Item
					</Button>
				</Link>
			}
			headerContent={
				<Tabs value={lifecycleTab} onValueChange={setLifecycleTab}>
					<TabsList className="grid w-full grid-cols-7">
						<TabsTrigger value="all">All</TabsTrigger>
						<TabsTrigger value="draft">Draft</TabsTrigger>
						<TabsTrigger value="inventory">Inventory</TabsTrigger>
						<TabsTrigger value="ready">Ready</TabsTrigger>
						<TabsTrigger value="listed">Listed</TabsTrigger>
						<TabsTrigger value="sold">Sold</TabsTrigger>
						<TabsTrigger value="archived">Archived</TabsTrigger>
					</TabsList>
				</Tabs>
			}
		>
			{/* Filters */}
			<div className="space-y-4">
				{/* Search, Source Filter, and Sort */}
				<div className="flex gap-3 items-center">
					{/* Search Input */}
					<div className="flex-1 relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search items by title or description..."
							value={searchInput}
							onChange={(e) => handleSearchChange(e.target.value)}
							className="pl-9"
						/>
					</div>

					{/* Source Filter */}
					<Select value={sourceFilter} onValueChange={setSourceFilter}>
						<SelectTrigger className="w-[180px]">
							<Filter className="h-4 w-4 mr-2" />
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Sources</SelectItem>
							<SelectItem value="ai_capture">
								<div className="flex items-center gap-2">
									<Bot className="h-4 w-4" />
									AI Capture
								</div>
							</SelectItem>
							<SelectItem value="manual">
								<div className="flex items-center gap-2">
									<User className="h-4 w-4" />
									Manual
								</div>
							</SelectItem>
						</SelectContent>
					</Select>

					{/* Sort Options */}
					<Select value={sortOption} onValueChange={setSortOption}>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Sort by..." />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="newest">Newest First</SelectItem>
							<SelectItem value="oldest">Oldest First</SelectItem>
							<SelectItem value="price-high">Price: High to Low</SelectItem>
							<SelectItem value="price-low">Price: Low to High</SelectItem>
							<SelectItem value="title-az">Title: A-Z</SelectItem>
							<SelectItem value="title-za">Title: Z-A</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Active Filters Summary */}
				{(sourceFilter !== 'all' || searchQuery) && (
					<div className="flex items-center gap-2 text-sm">
						<span className="text-muted-foreground">Active filters:</span>
						{sourceFilter !== 'all' && (
							<Badge variant="secondary" className="gap-1">
								Source:{' '}
								{sourceFilter === 'ai_capture' ? 'AI Capture' : 'Manual'}
								<button
									onClick={() => setSourceFilter('all')}
									className="ml-1 hover:text-destructive"
								>
									×
								</button>
							</Badge>
						)}
						{searchQuery && (
							<Badge variant="secondary" className="gap-1">
								Search: "{searchQuery}"
								<button
									onClick={() => {
										setSearchQuery('')
										setSearchInput('')
									}}
									className="ml-1 hover:text-destructive"
								>
									×
								</button>
							</Badge>
						)}
					</div>
				)}
			</div>

			{/* Content */}
			{isLoading ? (
				<div className="flex items-center justify-center py-12">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			) : error ? (
				<div className="text-center py-12 border rounded-lg">
					<p className="text-destructive mb-4">Error loading items</p>
				</div>
			) : products.length === 0 ? (
				<div className="text-center py-12 border rounded-lg">
					<p className="text-muted-foreground mb-4">
						{searchQuery || sourceFilter !== 'all'
							? 'No items match your filters'
							: 'No items yet'}
					</p>
					{!searchQuery && sourceFilter === 'all' && (
						<Link to="/items/new">
							<Button>Create your first item</Button>
						</Link>
					)}
				</div>
			) : (
				<ProductGrid
					products={products}
					onQuickView={handleQuickView}
					columns={4}
					showFilters={false}
					showSorting={false}
					showPagination={true}
					itemsPerPage={12}
				/>
			)}
		</AppContent>
	)
}
