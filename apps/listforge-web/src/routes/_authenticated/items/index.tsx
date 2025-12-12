import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useMemo, useState, useCallback } from 'react'
import { useListItemsQuery, useOrgRoom, useMeQuery, useDeleteItemMutation } from '@listforge/api-rtk'
import { itemsToProducts } from '@/utils/transformers'
import { useItemFilters } from '@/hooks/useItemFilters'
import { useOrgFeatures } from '@/hooks'
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
	Checkbox,
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
	cn,
} from '@listforge/ui'
import { Plus, Loader2, Search, Filter, Bot, User, Trash2, X, CheckSquare } from 'lucide-react'
import { showSuccess, showError } from '@/utils/toast'

export const Route = createFileRoute('/_authenticated/items/')({
	component: ItemsListPage,
})

function ItemsListPage() {
	const navigate = useNavigate()
	const { itemsLabel } = useOrgFeatures()

	// Selection state for bulk operations
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
	const [isSelectionMode, setIsSelectionMode] = useState(false)
	const [isBulkDeleting, setIsBulkDeleting] = useState(false)
	const [deleteItem] = useDeleteItemMutation()

	// Use custom hook for filter management
	const {
		lifecycleTab,
		setLifecycleTab,
		sourceFilter,
		setSourceFilter,
		searchQuery,
		setSearchQuery,
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

	const { data, isLoading, error, refetch } = useListItemsQuery({
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

	// Selection handlers
	const toggleSelection = useCallback((productId: string) => {
		setSelectedIds(prev => {
			const next = new Set(prev)
			if (next.has(productId)) {
				next.delete(productId)
			} else {
				next.add(productId)
			}
			return next
		})
	}, [])

	const selectAll = useCallback(() => {
		setSelectedIds(new Set(products.map(p => p.id)))
	}, [products])

	const clearSelection = useCallback(() => {
		setSelectedIds(new Set())
		setIsSelectionMode(false)
	}, [])

	const handleBulkDelete = async () => {
		if (selectedIds.size === 0) return

		setIsBulkDeleting(true)
		const idsToDelete = Array.from(selectedIds)
		let successCount = 0
		let errorCount = 0

		for (const id of idsToDelete) {
			try {
				await deleteItem(id).unwrap()
				successCount++
			} catch (error) {
				errorCount++
				console.error(`Failed to delete item ${id}:`, error)
			}
		}

		setIsBulkDeleting(false)
		clearSelection()
		refetch()

		if (errorCount === 0) {
			showSuccess(`Deleted ${successCount} item${successCount !== 1 ? 's' : ''}`)
		} else {
			showError(`Deleted ${successCount} items, ${errorCount} failed`)
		}
	}

	const handleQuickView = (product: Product) => {
		if (isSelectionMode) {
			toggleSelection(product.id)
		} else {
			navigate({ to: '/items/$id', params: { id: product.id } })
		}
	}

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="flex justify-between items-center">
					<h1 className="text-3xl font-bold">{itemsLabel}</h1>
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
					<h1 className="text-3xl font-bold">{itemsLabel}</h1>
				</div>
				<div className="text-center py-12">
					<p className="text-destructive">Error loading items</p>
				</div>
			</div>
		)
	}

	return (
		<AppContent
			title={itemsLabel}
			description={`${data?.total || 0} ${data?.total === 1 ? 'item' : 'items'} ${lifecycleTab !== 'all' && `(${lifecycleTab})`}`}
			actions={
				<div className="flex items-center gap-2">
					<Button
						variant={isSelectionMode ? 'secondary' : 'outline'}
						size="sm"
						onClick={() => {
							if (isSelectionMode) {
								clearSelection()
							} else {
								setIsSelectionMode(true)
							}
						}}
					>
						<CheckSquare className="mr-2 h-4 w-4" />
						{isSelectionMode ? 'Exit Select' : 'Select'}
					</Button>
					<Link to="/items/new">
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							New Item
						</Button>
					</Link>
				</div>
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

			{/* Bulk Action Toolbar */}
			{isSelectionMode && (
				<div className="flex items-center justify-between p-3 bg-muted rounded-lg border">
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-2">
							<Checkbox
								checked={selectedIds.size === products.length && products.length > 0}
								onCheckedChange={(checked) => {
									if (checked) {
										selectAll()
									} else {
										setSelectedIds(new Set())
									}
								}}
								aria-label="Select all items"
							/>
							<span className="text-sm font-medium">
								{selectedIds.size > 0
									? `${selectedIds.size} selected`
									: 'Select items'}
							</span>
						</div>
						{selectedIds.size > 0 && (
							<Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
								<X className="mr-1 h-3 w-3" />
								Clear
							</Button>
						)}
					</div>
					<div className="flex items-center gap-2">
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button
									variant="destructive"
									size="sm"
									disabled={selectedIds.size === 0 || isBulkDeleting}
								>
									{isBulkDeleting ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Deleting...
										</>
									) : (
										<>
											<Trash2 className="mr-2 h-4 w-4" />
											Delete ({selectedIds.size})
										</>
									)}
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Delete {selectedIds.size} Items?</AlertDialogTitle>
									<AlertDialogDescription>
										Are you sure you want to delete {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''}?
										This action cannot be undone. All associated research runs and marketplace listings will also be deleted.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>Cancel</AlertDialogCancel>
									<AlertDialogAction
										onClick={handleBulkDelete}
										className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
									>
										Delete {selectedIds.size} Item{selectedIds.size !== 1 ? 's' : ''}
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</div>
				</div>
			)}

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
			) : isSelectionMode ? (
				<SelectableProductGrid
					products={products}
					selectedIds={selectedIds}
					onToggleSelection={toggleSelection}
					onNavigate={(id) => navigate({ to: '/items/$id', params: { id } })}
				/>
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

// Selectable Product Grid for bulk operations
interface SelectableProductGridProps {
	products: Product[]
	selectedIds: Set<string>
	onToggleSelection: (id: string) => void
	onNavigate: (id: string) => void
}

function SelectableProductGrid({
	products,
	selectedIds,
	onToggleSelection,
	onNavigate,
}: SelectableProductGridProps) {
	const [currentPage, setCurrentPage] = useState(1)
	const itemsPerPage = 12
	const totalPages = Math.ceil(products.length / itemsPerPage)
	const paginatedProducts = products.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	)

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
				{paginatedProducts.map((product) => (
					<SelectableProductCard
						key={product.id}
						product={product}
						isSelected={selectedIds.has(product.id)}
						onToggleSelection={() => onToggleSelection(product.id)}
						onNavigate={() => onNavigate(product.id)}
					/>
				))}
			</div>

			{/* Pagination */}
			{totalPages > 1 && (
				<div className="flex items-center justify-center gap-2">
					<Button
						variant="outline"
						size="icon"
						disabled={currentPage === 1}
						onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
					>
						<span className="sr-only">Previous</span>
						←
					</Button>
					<span className="text-sm text-muted-foreground">
						Page {currentPage} of {totalPages}
					</span>
					<Button
						variant="outline"
						size="icon"
						disabled={currentPage === totalPages}
						onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
					>
						<span className="sr-only">Next</span>
						→
					</Button>
				</div>
			)}
		</div>
	)
}

// Individual Selectable Product Card
interface SelectableProductCardProps {
	product: Product
	isSelected: boolean
	onToggleSelection: () => void
	onNavigate: () => void
}

function SelectableProductCard({
	product,
	isSelected,
	onToggleSelection,
	onNavigate,
}: SelectableProductCardProps) {
	return (
		<div
			className={cn(
				'group relative rounded-lg border bg-card overflow-hidden transition-all',
				isSelected && 'ring-2 ring-primary border-primary'
			)}
		>
			{/* Selection checkbox overlay */}
			<button
				className="absolute top-2 left-2 z-10"
				onClick={(e) => {
					e.stopPropagation()
					onToggleSelection()
				}}
				aria-label={isSelected ? 'Deselect item' : 'Select item'}
			>
				<div
					className={cn(
						'h-5 w-5 rounded border-2 flex items-center justify-center transition-colors',
						isSelected
							? 'bg-primary border-primary text-primary-foreground'
							: 'bg-white/90 border-gray-300 hover:border-primary'
					)}
				>
					{isSelected && (
						<svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
						</svg>
					)}
				</div>
			</button>

			{/* Product image */}
			<button
				className="w-full aspect-square bg-muted overflow-hidden cursor-pointer"
				onClick={onNavigate}
			>
				{product.images?.[0] ? (
					<img
						src={product.images[0]}
						alt={product.name}
						className="h-full w-full object-cover transition-transform group-hover:scale-105"
					/>
				) : (
					<div className="h-full w-full flex items-center justify-center text-muted-foreground">
						No image
					</div>
				)}
			</button>

			{/* Product info */}
			<div className="p-3">
				<button
					className="w-full text-left"
					onClick={onNavigate}
				>
					<h3 className="font-medium text-sm truncate hover:text-primary">
						{product.name || 'Untitled'}
					</h3>
					<p className="text-sm text-muted-foreground mt-1">
						{product.price ? `$${product.price.toFixed(2)}` : 'No price'}
					</p>
				</button>
				{product.category && (
					<Badge variant="secondary" className="mt-2 text-xs capitalize">
						{product.category}
					</Badge>
				)}
			</div>
		</div>
	)
}
