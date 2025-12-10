import { createFileRoute, Link } from '@tanstack/react-router'
import { useResearchActivityFeed, useGetResearchRunQuery, useGetItemQuery } from '@listforge/api-rtk'
import {
  Card,
  CardContent,
  Button,
  Badge,
  AppContent,
} from '@listforge/ui'
import { AgentActivityFeed } from '@/components/research/agent-activity/agent-activity-feed'
import { useRef, useState } from 'react'
import {
  Loader2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  FlaskConical,
  Download,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { ResearchChecklist } from '@/components/research/ResearchChecklist'

export const Route = createFileRoute('/_authenticated/items/$id/research/$runId')({
  component: ResearchRunPage,
})

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'success':
      return (
        <Badge variant="default" className="bg-green-500">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      )
    case 'error':
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      )
    case 'running':
      return (
        <Badge variant="secondary" className="bg-blue-500 text-white">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Running
        </Badge>
      )
    case 'pending':
      return (
        <Badge variant="outline">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function ResearchRunPage() {
  const { id: itemId, runId } = Route.useParams()
  const expandControlRef = useRef<{ expandAll: () => void; collapseAll: () => void } | null>(null)
  const [allExpanded, setAllExpanded] = useState(false)

  // Fetch item data
  const { data: itemData, isLoading: isItemLoading } = useGetItemQuery(itemId)

  // Fetch research run details
  const { data: runData, isLoading: isRunLoading } = useGetResearchRunQuery(runId)

  // Fetch activity events
  const { operationEvents, checklistStatus, isLoading: isEventsLoading } = useResearchActivityFeed(runId)

  const isLoading = isItemLoading || isRunLoading || isEventsLoading
  const item = itemData?.item
  const researchRun = runData?.researchRun

  // Determine if the research is still live
  const isLive = researchRun?.status === 'running' || researchRun?.status === 'pending'

  // Handle export run
  const handleExportRun = () => {
    if (!researchRun) return

    const dataStr = JSON.stringify(researchRun, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `research-run-${runId}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Handle expand/collapse all
  const handleExpandCollapseAll = () => {
    if (allExpanded) {
      expandControlRef.current?.collapseAll()
      setAllExpanded(false)
    } else {
      expandControlRef.current?.expandAll()
      setAllExpanded(true)
    }
  }

  if (isLoading) {
    return (
      <AppContent>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppContent>
    )
  }

  if (!researchRun) {
    return (
      <AppContent>
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FlaskConical className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Research Run Not Found</h3>
              <p className="text-sm text-muted-foreground mb-6">
                The research run you're looking for doesn't exist or has been deleted.
              </p>
              <Link to="/items/$id" params={{ id: itemId }}>
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Item
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </AppContent>
    )
  }

  return (
    <AppContent>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/items/$id" params={{ id: itemId }}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold flex items-center gap-2">
                <FlaskConical className="h-5 w-5" />
                Research Run
              </h1>
              <p className="text-sm text-muted-foreground">
                {item?.title || 'Untitled Item'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportRun}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Run
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExpandCollapseAll}
            >
              {allExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Collapse All
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Expand All
                </>
              )}
            </Button>
            {getStatusBadge(researchRun.status)}
            {researchRun.startedAt && (
              <span className="text-sm text-muted-foreground">
                {formatTimeAgo(researchRun.startedAt)}
              </span>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex gap-4 h-[calc(100vh-12rem)] min-h-0">
          {/* Left sidebar - Checklist */}
          <ResearchChecklist steps={checklistStatus} className="w-56 shrink-0" />

          {/* Right panel - Activity Feed */}
          <Card className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
            <CardContent className="p-0 flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
              <div className="p-4 border-b shrink-0">
                <h3 className="text-lg font-semibold">Research Activity</h3>
                <p className="text-sm text-muted-foreground">
                  {isLive ? 'Live stream of research operations' : 'Completed research operations'}
                </p>
              </div>
              <div className="flex-1 min-h-0 min-w-0 h-full overflow-hidden">
                <AgentActivityFeed
                  ref={expandControlRef}
                  events={operationEvents}
                  isLive={isLive}
                  autoScroll={isLive}
                  emptyComponent={
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No activity recorded</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        No operations were logged for this research run
                      </p>
                    </div>
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error message if failed */}
        {researchRun.status === 'error' && researchRun.errorMessage && (
          <Card className="border-destructive">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <h4 className="font-medium text-destructive">Research Failed</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {researchRun.errorMessage}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppContent>
  )
}
