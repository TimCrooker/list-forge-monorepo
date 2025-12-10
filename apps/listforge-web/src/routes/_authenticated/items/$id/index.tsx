import {
	createFileRoute,
	useNavigate,
	Link,
	useSearch,
} from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import {
	useGetItemQuery,
	useDeleteItemMutation,
	useListMarketplaceAccountsQuery,
	usePublishItemToMarketplacesMutation,
	useGetItemMarketplaceListingsQuery,
	useGetItemResearchRunsQuery,
	useTriggerItemResearchMutation,
	useGetResearchRunEvidenceQuery,
	useUpdateItemMutation,
	useRetryItemPublishMutation,
} from '@listforge/api-rtk'
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Badge,
	MediaGallery,
	Tabs,
	TabsList,
	TabsTrigger,
	TabsContent,
	type MediaItem,
	AppContent,
} from '@listforge/ui'
import {
	Loader2,
	CheckCircle2,
	XCircle,
	Clock,
	Store,
	RefreshCw,
	ChevronDown,
	ChevronUp,
	FileText,
	BarChart3,
	ExternalLink,
	Zap,
	RotateCcw,
} from 'lucide-react'
import { showSuccess } from '@/utils/toast'
import type { MarketplaceAccountDto } from '@listforge/api-types'
import { ResearchPanel } from '@/components/research/ResearchPanel'

export const Route = createFileRoute('/_authenticated/items/$id/')({
	component: ItemDetailPage,
	validateSearch: (
		search?: Record<string, unknown>
	): { tab?: 'details' | 'research' } => ({
		tab: (search?.tab as 'details' | 'research' | undefined) || 'details',
	}),
})

function ItemDetailPage() {
	const { id } = Route.useParams()
	const navigate = useNavigate()
	const search = useSearch({ from: '/_authenticated/items/$id/' })
	const activeTab = search.tab || 'details'
	const { data: itemResponse, isLoading, error } = useGetItemQuery(id)
	const item = itemResponse?.item
	const [deleteItem] = useDeleteItemMutation()
	const [updateItem] = useUpdateItemMutation()
	const { data: accountsData } = useListMarketplaceAccountsQuery()
	const [publishItem, { isLoading: isPublishing }] =
		usePublishItemToMarketplacesMutation()
	const {
		data: listingsData,
		refetch: refetchListings,
		isFetching: isListingLoading,
	} = useGetItemMarketplaceListingsQuery(id)
	const {
		data: researchData,
		refetch: refetchResearch,
		isFetching: isResearchLoading,
	} = useGetItemResearchRunsQuery(id)
	const [triggerResearch, { isLoading: isTriggeringResearch }] =
		useTriggerItemResearchMutation()
	const [retryPublish, { isLoading: isRetrying }] =
		useRetryItemPublishMutation()
	const [expandedRunId, setExpandedRunId] = useState<string | null>(null)
	const [activeResearchRunId, setActiveResearchRunId] = useState<string | null>(
		null
	)

	// Note: Chat context is now automatically detected via useChatContext() hook
	// No manual setContext needed - route-based detection handles this

	const activeAccounts =
		accountsData?.accounts?.filter((acc) => acc.status === 'active') || []
	const [selectedAccountIds, setSelectedAccountIds] = useState<Set<string>>(
		new Set()
	)

	const toggleAccount = (accountId: string) => {
		setSelectedAccountIds((prev) => {
			const next = new Set(prev)
			if (next.has(accountId)) {
				next.delete(accountId)
			} else {
				next.add(accountId)
			}
			return next
		})
	}

	const handleDelete = async () => {
		if (!confirm('Delete this item?')) return
		await deleteItem(id).unwrap()
		navigate({ to: '/items' })
	}

	const handlePublish = async () => {
		if (selectedAccountIds.size === 0) return
		await publishItem({
			itemId: id,
			data: { accountIds: Array.from(selectedAccountIds) },
		}).unwrap()
		showSuccess('Publish jobs queued')
		setSelectedAccountIds(new Set())
		refetchListings()
	}

	const handleTriggerResearch = async () => {
		const result = await triggerResearch({ itemId: id }).unwrap()
		showSuccess('Research run triggered')
		// Track the active research run ID for polling
		if (result.researchRun?.id) {
			setActiveResearchRunId(result.researchRun.id)
		}
		refetchResearch()
	}

	const handleResearchComplete = () => {
		// Clear active run ID and refresh data
		setActiveResearchRunId(null)
		refetchResearch()
	}

	// Slice 7: Retry failed publish
	const handleRetryPublish = async (listingId: string) => {
		try {
			await retryPublish({ itemId: id, listingId }).unwrap()
			showSuccess('Publish retry queued')
			refetchListings()
		} catch (err: any) {
			console.error('Failed to retry publish:', err)
		}
	}

	// Check if there's a running research run
	const runningRun = researchData?.researchRuns?.find(
		(run) => run.status === 'running'
	)
	const currentActiveRunId = activeResearchRunId || runningRun?.id || null

	const toggleRunExpansion = (runId: string) => {
		setExpandedRunId(expandedRunId === runId ? null : runId)
	}

	const mediaItems: MediaItem[] = useMemo(() => {
		if (!item?.media) return []
		// Sort by sortOrder to maintain order
		const sortedMedia = [...item.media].sort(
			(a, b) => a.sortOrder - b.sortOrder
		)
		return sortedMedia.map((media) => ({
			id: media.id,
			url: media.url,
			type: 'image' as const,
			title: media.isPrimary ? 'Primary' : undefined,
		}))
	}, [item?.media])

	const firstImage =
		item?.media && item.media.length > 0
			? [...item.media].sort((a, b) => a.sortOrder - b.sortOrder)[0]
			: null

	const handleMediaReorder = async (reorderedItems: MediaItem[]) => {
		if (!item?.media) return

		// Create updated media array with new sortOrder values
		const updatedMedia = reorderedItems
			.map((mediaItem, index) => {
				const originalMedia = item.media!.find((m) => m.id === mediaItem.id)
				if (!originalMedia) return null
				return {
					...originalMedia,
					sortOrder: index,
				}
			})
			.filter(Boolean) as typeof item.media

		try {
			await updateItem({
				id,
				data: { media: updatedMedia },
			}).unwrap()
			showSuccess('Image order updated')
		} catch (error) {
			console.error('Failed to update image order:', error)
		}
	}

	const handleTabChange = (value: string) => {
		navigate({
			to: '/items/$id',
			params: { id },
			search: { tab: value as 'details' | 'research' },
		})
	}

	// Check if item can be published (must be ready or listed)
	const canPublish =
		item?.lifecycleStatus === 'ready' || item?.lifecycleStatus === 'listed'

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		)
	}

	if (error || !item) {
		return (
			<div className="text-center py-12">
				<p className="text-destructive">Error loading item</p>
				<Link to="/items">
					<Button variant="outline" className="mt-4">
						Back to Items
					</Button>
				</Link>
			</div>
		)
	}

	return (
		<Tabs value={activeTab} onValueChange={handleTabChange}>
			<AppContent
				title={item.title || item.userTitleHint || 'Untitled Item'}
				actions={
					<Button variant="destructive" onClick={handleDelete}>
						Delete
					</Button>
				}
				statusIndicator={
					firstImage ? (
						<img
							src={firstImage.url}
							alt="Item image"
							className="h-10 w-10 rounded-md object-cover border"
						/>
					) : null
				}
				badges={
					<>
						<Badge variant="secondary" className="capitalize">
							{item.lifecycleStatus}
						</Badge>
						<Badge variant="outline" className="capitalize">
							{item.aiReviewState}
						</Badge>
						<Badge variant="outline" className="capitalize">
							{item.source}
						</Badge>
					</>
				}
				breadcrumbs={[
					{
						label: 'Items',
						href: '/items',
					},
					{
						label: item.title || item.userTitleHint || 'Untitled Item',
						href: `/items/${id}`,
					},
				]}
				headerContent={
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="details" className="flex items-center gap-2">
							<FileText className="h-4 w-4" />
							Details
						</TabsTrigger>
						<TabsTrigger value="research" className="flex items-center gap-2">
							<BarChart3 className="h-4 w-4" />
							Research
						</TabsTrigger>
					</TabsList>
				}
			>
				<TabsContent value="details" className="mt-0 h-full">
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-0 overflow-hidden">
						<div className="lg:col-span-2 flex flex-col min-h-0 min-w-0 overflow-hidden space-y-6">
							<Card>
								<CardHeader>
									<CardTitle>Photos</CardTitle>
								</CardHeader>
								<CardContent>
									{mediaItems.length === 0 ? (
										<p className="text-muted-foreground">No photos available</p>
									) : (
										<MediaGallery
											items={mediaItems}
											onReorder={handleMediaReorder}
										/>
									)}
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle>Item Details</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div>
										<h3 className="text-lg font-semibold">
											{item.title || item.userTitleHint || 'No title'}
										</h3>
										<p className="text-muted-foreground mt-1">
											{item.description || 'No description'}
										</p>
									</div>
									<div className="grid grid-cols-2 gap-4">
										<div>
											<p className="text-sm text-muted-foreground">Price</p>
											<p className="text-lg font-semibold">
												{item.defaultPrice
													? `$${item.defaultPrice.toFixed(2)}`
													: '—'}
											</p>
										</div>
										<div>
											<p className="text-sm text-muted-foreground">Quantity</p>
											<p className="text-lg font-semibold">{item.quantity}</p>
										</div>
										<div>
											<p className="text-sm text-muted-foreground">Condition</p>
											<p className="text-lg font-semibold capitalize">
												{item.condition
													? item.condition.replace(/_/g, ' ')
													: '—'}
											</p>
										</div>
										<div>
											<p className="text-sm text-muted-foreground">Category</p>
											<p className="text-lg font-semibold">
												{item.categoryPath
													? item.categoryPath.join(' > ')
													: '—'}
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>

						<div className="space-y-6">
							{canPublish ? (
								<Card>
									<CardHeader>
										<CardTitle>Publish</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										<p className="text-sm text-muted-foreground">
											Choose accounts to publish this item. Only active
											connections are shown.
										</p>

										<div className="space-y-2">
											{activeAccounts.length === 0 ? (
												<p className="text-sm text-muted-foreground">
													No active marketplace accounts
												</p>
											) : (
												activeAccounts.map((account: MarketplaceAccountDto) => (
													<label
														key={account.id}
														className="flex items-center gap-2"
													>
														<input
															type="checkbox"
															checked={selectedAccountIds.has(account.id)}
															onChange={() => toggleAccount(account.id)}
														/>
														<span className="text-sm text-muted-foreground inline-flex items-center gap-2">
															<Store className="h-4 w-4" />
															{account.marketplace} (
															{account.remoteAccountId || account.id})
														</span>
													</label>
												))
											)}
										</div>

										<Button
											disabled={selectedAccountIds.size === 0 || isPublishing}
											onClick={handlePublish}
											className="w-full"
										>
											{isPublishing ? (
												<>
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
													Publishing...
												</>
											) : (
												'Publish Item'
											)}
										</Button>
									</CardContent>
								</Card>
							) : (
								<Card>
									<CardHeader>
										<CardTitle>Publish</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-sm text-muted-foreground">
											Item must be in 'ready' or 'listed' status to publish.
											Current status: {item.lifecycleStatus}
										</p>
									</CardContent>
								</Card>
							)}

							<Card>
								<CardHeader className="flex items-center justify-between">
									<CardTitle>Marketplace Listings</CardTitle>
									<Button
										size="icon"
										variant="ghost"
										onClick={() => refetchListings()}
									>
										<RefreshCw className="h-4 w-4" />
									</Button>
								</CardHeader>
								<CardContent className="space-y-3">
									{isListingLoading ? (
										<div className="flex items-center gap-2 text-muted-foreground">
											<Loader2 className="h-4 w-4 animate-spin" />
											Loading listings...
										</div>
									) : listingsData?.listings?.length ? (
										listingsData.listings.map((listing) => (
											<div
												key={listing.id}
												className="flex items-center justify-between border rounded-lg p-3"
											>
												<div className="space-y-1">
													<div className="flex items-center gap-2">
														{listing.status === 'listed' && (
															<CheckCircle2 className="h-4 w-4 text-green-600" />
														)}
														{listing.status === 'error' && (
															<XCircle className="h-4 w-4 text-red-600" />
														)}
														{listing.status === 'listing_pending' && (
															<Clock className="h-4 w-4 text-amber-500" />
														)}
														{listing.status === 'not_listed' && (
															<Clock className="h-4 w-4 text-gray-400" />
														)}
														<p className="font-medium capitalize">
															{listing.status.replace(/_/g, ' ')}
														</p>
														{/* Slice 7: Auto-published badge */}
														{listing.autoPublished && (
															<Badge
																variant="secondary"
																className="text-xs gap-1"
															>
																<Zap className="h-3 w-3" />
																Auto
															</Badge>
														)}
													</div>
													<p className="text-sm text-muted-foreground">
														{listing.marketplace}
													</p>
													{listing.url && (
														<a
															href={listing.url}
															target="_blank"
															rel="noreferrer"
															className="text-sm text-primary inline-flex items-center gap-1"
														>
															View listing
														</a>
													)}
													{/* Slice 7: Show error message for failed listings */}
													{listing.status === 'error' &&
														listing.errorMessage && (
															<p className="text-xs text-red-600 mt-1">
																{listing.errorMessage}
															</p>
														)}
												</div>
												<div className="flex items-center gap-2">
													{listing.price && (
														<p className="font-semibold">
															${listing.price.toFixed(2)}
														</p>
													)}
													{/* Slice 7: Retry button for failed listings */}
													{listing.status === 'error' && (
														<Button
															size="sm"
															variant="outline"
															onClick={() => handleRetryPublish(listing.id)}
															disabled={isRetrying}
														>
															{isRetrying ? (
																<Loader2 className="h-4 w-4 animate-spin" />
															) : (
																<>
																	<RotateCcw className="h-3 w-3 mr-1" />
																	Retry
																</>
															)}
														</Button>
													)}
												</div>
											</div>
										))
									) : (
										<p className="text-sm text-muted-foreground">
											No marketplace listings yet
										</p>
									)}
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="flex flex-row items-center justify-between">
									<CardTitle>Research Runs</CardTitle>
									<Button
										size="sm"
										variant="ghost"
										onClick={() => refetchResearch()}
										disabled={isResearchLoading}
									>
										<RefreshCw
											className={`h-4 w-4 ${isResearchLoading ? 'animate-spin' : ''}`}
										/>
									</Button>
								</CardHeader>
								<CardContent className="space-y-3">
									{isResearchLoading ? (
										<div className="flex items-center gap-2 text-muted-foreground">
											<Loader2 className="h-4 w-4 animate-spin" />
											Loading research runs...
										</div>
									) : researchData?.researchRuns?.length ? (
										researchData.researchRuns
											.slice(0, 3)
											.map((run) => (
												<ResearchRunCard
													key={run.id}
													run={run}
													isExpanded={expandedRunId === run.id}
													onToggle={() => toggleRunExpansion(run.id)}
												/>
											))
									) : (
										<p className="text-sm text-muted-foreground">
											No research runs yet
										</p>
									)}
									{researchData?.researchRuns &&
										researchData.researchRuns.length > 3 && (
											<p className="text-xs text-muted-foreground text-center pt-2">
												+{researchData.researchRuns.length - 3} more runs
											</p>
										)}
								</CardContent>
							</Card>
						</div>
					</div>
				</TabsContent>

				<TabsContent
					value="research"
					className="mt-0 h-full flex flex-col min-h-0 min-w-0 overflow-hidden"
				>
					<ResearchPanel
						itemId={id}
						onTriggerResearch={handleTriggerResearch}
						isResearchRunning={isTriggeringResearch || !!runningRun}
						activeRunId={currentActiveRunId}
						onResearchComplete={handleResearchComplete}
					/>
				</TabsContent>
			</AppContent>
		</Tabs>
	)
}

function ResearchRunCard({
	run,
	isExpanded,
	onToggle,
}: {
	run: any
	isExpanded: boolean
	onToggle: () => void
}) {
	const { id: itemId } = Route.useParams()
	const { data: evidenceData, isFetching } = useGetResearchRunEvidenceQuery(
		run.id,
		{
			skip: !isExpanded,
		}
	)

	const statusColorMap: Record<string, string> = {
		pending: 'bg-gray-100 text-gray-800',
		running: 'bg-blue-100 text-blue-800',
		success: 'bg-green-100 text-green-800',
		error: 'bg-red-100 text-red-800',
	}
	const statusColor = statusColorMap[run.status] || 'bg-gray-100 text-gray-800'

	const runTypeLabelMap: Record<string, string> = {
		initial_intake: 'Initial Intake',
		pricing_refresh: 'Pricing Refresh',
		manual_request: 'Manual Research',
	}
	const runTypeLabel = runTypeLabelMap[run.runType] || run.runType

	return (
		<div className="border rounded-lg">
			<button
				onClick={onToggle}
				className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
			>
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-2">
						{run.status === 'success' && (
							<CheckCircle2 className="h-5 w-5 text-green-600" />
						)}
						{run.status === 'error' && (
							<XCircle className="h-5 w-5 text-red-600" />
						)}
						{run.status === 'running' && (
							<Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
						)}
						{run.status === 'pending' && (
							<Clock className="h-5 w-5 text-gray-400" />
						)}
					</div>
					<div className="text-left flex-1">
						<div className="flex items-center gap-2">
							<span className="font-medium">{runTypeLabel}</span>
							<Badge className={`${statusColor} text-xs`}>{run.status}</Badge>
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							{new Date(run.startedAt).toLocaleString()}
							{run.completedAt &&
								` - ${new Date(run.completedAt).toLocaleString()}`}
						</p>
						{run.summary && (
							<p className="text-sm text-muted-foreground mt-1">
								{run.summary}
							</p>
						)}
					</div>
				</div>
				{isExpanded ? (
					<ChevronUp className="h-5 w-5 text-muted-foreground" />
				) : (
					<ChevronDown className="h-5 w-5 text-muted-foreground" />
				)}
			</button>
			{isExpanded && (
				<div className="border-t p-3 bg-gray-50 space-y-3">
					{/* View Details Link */}
					<Link
						to="/items/$id/research/$runId"
						params={{ id: itemId, runId: run.id }}
						className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
					>
						<BarChart3 className="h-4 w-4" />
						View Full Research Details
						<ExternalLink className="h-3 w-3" />
					</Link>

					{/* Evidence Summary */}
					{isFetching ? (
						<div className="flex items-center gap-2 text-muted-foreground">
							<Loader2 className="h-4 w-4 animate-spin" />
							Loading evidence...
						</div>
					) : evidenceData?.evidence ? (
						<div className="space-y-2">
							<h4 className="text-sm font-semibold">
								Evidence ({evidenceData.evidence.items.length} items)
							</h4>
							<div className="space-y-2 max-h-64 overflow-y-auto">
								{evidenceData.evidence.items.map((item: any) => (
									<div
										key={item.id}
										className="text-xs bg-white p-2 rounded border"
									>
										<span className="font-medium capitalize">
											{item.type.replace(/_/g, ' ')}
										</span>
										{item.data.title && (
											<p className="mt-1">{item.data.title}</p>
										)}
										{item.data.text && (
											<p className="mt-1 text-muted-foreground">
												{item.data.text}
											</p>
										)}
										{item.data.price && (
											<p className="mt-1">Price: ${item.data.price}</p>
										)}
									</div>
								))}
							</div>
						</div>
					) : (
						<p className="text-sm text-muted-foreground">
							No evidence available
						</p>
					)}
				</div>
			)}
		</div>
	)
}
