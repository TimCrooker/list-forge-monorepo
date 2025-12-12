import { createFileRoute, Navigate } from '@tanstack/react-router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import {
  useGetLearningDashboardQuery,
  useGetToolEffectivenessQuery,
  useListAnomaliesQuery,
  useTriggerCalibrationMutation,
  useResolveAnomalyMutation,
} from '@listforge/api-rtk';
import {
  AppContent,
  OverviewCards,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Progress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Skeleton,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Textarea,
  toast,
} from '@listforge/ui';
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Target,
  Activity,
  BarChart3,
} from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/_authenticated/admin/learning')({
  component: LearningDashboard,
});

function LearningDashboard() {
  const user = useSelector((state: RootState) => state.auth.user);

  const [selectedAnomalyId, setSelectedAnomalyId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const { data: dashboard, isLoading: dashboardLoading } = useGetLearningDashboardQuery(
    { periodDays: 30 },
    { skip: !user }
  );

  const { data: toolEffectiveness, isLoading: toolsLoading } = useGetToolEffectivenessQuery(
    { periodDays: 90 },
    { skip: !user }
  );

  const { data: anomalies, isLoading: anomaliesLoading } = useListAnomaliesQuery(
    { resolved: false },
    { skip: !user }
  );

  const [triggerCalibration, { isLoading: calibrating }] = useTriggerCalibrationMutation();
  const [resolveAnomaly, { isLoading: resolving }] = useResolveAnomalyMutation();

  // Check admin access
  if (user?.globalRole !== 'superadmin' && user?.globalRole !== 'staff') {
    return <Navigate to="/" />;
  }

  const handleCalibrate = async () => {
    try {
      await triggerCalibration().unwrap();
      toast({
        title: 'Success',
        description: 'Calibration completed successfully',
      });
    } catch (error) {
      console.error('Calibration failed:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Calibration failed. Please try again.',
      });
    }
  };

  const handleResolveAnomaly = async () => {
    if (!selectedAnomalyId) return;
    try {
      await resolveAnomaly({
        id: selectedAnomalyId,
        data: { resolutionNotes },
      }).unwrap();
      setSelectedAnomalyId(null);
      setResolutionNotes('');
      toast({
        title: 'Success',
        description: 'Anomaly resolved successfully',
      });
    } catch (error) {
      console.error('Failed to resolve anomaly:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to resolve anomaly. Please try again.',
      });
    }
  };

  const overviewCards = dashboard?.summary
    ? [
        {
          title: 'Total Outcomes',
          value: dashboard.summary.totalOutcomes,
          description: `Last 30 days`,
          icon: <BarChart3 className="h-4 w-4" />,
        },
        {
          title: 'Price Accuracy',
          value: `${((1 - dashboard.summary.averagePriceAccuracy) * 100).toFixed(1)}%`,
          description: 'Average accuracy',
          icon:
            dashboard.summary.averagePriceAccuracy < 0.15 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            ),
        },
        {
          title: 'ID Accuracy',
          value: `${(dashboard.summary.identificationAccuracy * 100).toFixed(1)}%`,
          description: 'Identification correct',
          icon: <Target className="h-4 w-4" />,
        },
        {
          title: 'Active Anomalies',
          value: anomalies?.total ?? 0,
          description: 'Requires attention',
          icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
        },
      ]
    : [];

  const qualityColors: Record<string, string> = {
    excellent: 'bg-green-500',
    good: 'bg-blue-500',
    fair: 'bg-amber-500',
    poor: 'bg-red-500',
  };

  const severityColors: Record<string, string> = {
    info: 'bg-blue-500',
    warning: 'bg-amber-500',
    critical: 'bg-red-500',
  };

  const isLoading = dashboardLoading || toolsLoading || anomaliesLoading;

  return (
    <AppContent
      title="Learning Dashboard"
      description="Track research outcomes, tool effectiveness, and anomalies"
      maxWidth="full"
      padding="md"
      actions={
        <Button onClick={handleCalibrate} disabled={calibrating}>
          {calibrating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Recalibrate Tools
        </Button>
      }
    >
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overview Cards */}
          <OverviewCards cards={overviewCards} columns={4} />

          {/* Outcome Quality Distribution */}
          {dashboard?.summary?.outcomesByQuality && (
            <Card>
              <CardHeader>
                <CardTitle>Outcome Quality Distribution</CardTitle>
                <CardDescription>
                  Distribution of research outcome quality over the last 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(dashboard.summary.outcomesByQuality).map(([quality, count]) => {
                    const total = dashboard.summary.totalOutcomes || 1;
                    const percentage = (count / total) * 100;
                    return (
                      <div key={quality} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{quality}</span>
                          <span className="text-muted-foreground">
                            {count} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <Progress
                          value={percentage}
                          className={`h-2 ${qualityColors[quality]}`}
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tool Effectiveness Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Tool Effectiveness
              </CardTitle>
              <CardDescription>
                Performance metrics for each research tool over the last 90 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {toolEffectiveness?.tools && toolEffectiveness.tools.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tool</TableHead>
                      <TableHead className="text-right">Uses</TableHead>
                      <TableHead className="text-right">Sales</TableHead>
                      <TableHead className="text-right">Returns</TableHead>
                      <TableHead className="text-right">Price Accuracy</TableHead>
                      <TableHead className="text-right">ID Accuracy</TableHead>
                      <TableHead className="text-right">Weight</TableHead>
                      <TableHead className="text-right">Calibration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {toolEffectiveness.tools.map((tool) => (
                      <TableRow key={tool.toolType}>
                        <TableCell className="font-medium">{tool.toolType}</TableCell>
                        <TableCell className="text-right">{tool.totalUses}</TableCell>
                        <TableCell className="text-right">{tool.contributedToSale}</TableCell>
                        <TableCell className="text-right">{tool.contributedToReturn}</TableCell>
                        <TableCell className="text-right">
                          {((1 - tool.averagePriceAccuracy) * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right">
                          {(tool.identificationAccuracy * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right">{tool.currentWeight.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          {tool.calibrationScore !== null ? (
                            <Badge
                              variant={
                                tool.calibrationScore >= 0.9 && tool.calibrationScore <= 1.1
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {tool.calibrationScore.toFixed(2)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No tool effectiveness data available yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Anomalies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Active Anomalies
              </CardTitle>
              <CardDescription>
                Detected patterns that may indicate research quality issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              {anomalies?.anomalies && anomalies.anomalies.length > 0 ? (
                <div className="space-y-4">
                  {anomalies.anomalies.map((anomaly) => (
                    <div
                      key={anomaly.id}
                      className="flex items-start justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge className={severityColors[anomaly.severity]}>
                            {anomaly.severity}
                          </Badge>
                          <span className="font-medium capitalize">
                            {anomaly.anomalyType.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{anomaly.description}</p>
                        {anomaly.suggestedAction && (
                          <p className="text-xs text-blue-600">{anomaly.suggestedAction}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Detected: {new Date(anomaly.detectedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Dialog
                        open={selectedAnomalyId === anomaly.id}
                        onOpenChange={(open) => {
                          if (!open) setSelectedAnomalyId(null);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedAnomalyId(anomaly.id)}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Resolve
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Resolve Anomaly</DialogTitle>
                            <DialogDescription>
                              Add notes about how this anomaly was resolved.
                            </DialogDescription>
                          </DialogHeader>
                          <Textarea
                            placeholder="Resolution notes..."
                            value={resolutionNotes}
                            onChange={(e) => setResolutionNotes(e.target.value)}
                          />
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setSelectedAnomalyId(null)}>
                              Cancel
                            </Button>
                            <Button onClick={handleResolveAnomaly} disabled={resolving}>
                              {resolving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Resolve
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground flex flex-col items-center gap-2">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <p>No active anomalies detected</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </AppContent>
  );
}
