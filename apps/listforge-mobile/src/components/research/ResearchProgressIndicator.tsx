import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { CheckCircle2, XCircle, Pause, AlertCircle } from 'lucide-react-native';
import { useResearchProgress } from '../../hooks/useResearchProgress';

interface ResearchProgressIndicatorProps {
  researchRunId: string | null | undefined;
  compact?: boolean;
}

/**
 * Component that displays real-time research progress
 *
 * Shows current node being processed, completed nodes, and overall status.
 * Updates in real-time via WebSocket.
 */
export default function ResearchProgressIndicator({
  researchRunId,
  compact = false,
}: ResearchProgressIndicatorProps) {
  const { completedNodes, currentNode, status, error, activityLog } = useResearchProgress(researchRunId);

  if (!researchRunId) {
    return null;
  }

  // Compact view - just show status badge
  if (compact) {
    return (
      <View className="flex-row items-center gap-2">
        {status === 'running' && (
          <>
            <ActivityIndicator size="small" color="#0ea5e9" />
            <Text className="text-sm text-gray-600">Researching...</Text>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 color="#059669" size={16} />
            <Text className="text-sm text-green-600">Complete</Text>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle color="#dc2626" size={16} />
            <Text className="text-sm text-red-600">Error</Text>
          </>
        )}
        {status === 'paused' && (
          <>
            <Pause color="#f59e0b" size={16} />
            <Text className="text-sm text-yellow-600">Paused</Text>
          </>
        )}
        {status === 'cancelled' && (
          <>
            <XCircle color="#6b7280" size={16} />
            <Text className="text-sm text-gray-600">Cancelled</Text>
          </>
        )}
      </View>
    );
  }

  // Full view - show detailed progress
  return (
    <View className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg font-semibold text-gray-900">Research Progress</Text>
        {status === 'running' && (
          <ActivityIndicator size="small" color="#0ea5e9" />
        )}
        {status === 'success' && (
          <CheckCircle2 color="#059669" size={24} />
        )}
        {status === 'error' && (
          <XCircle color="#dc2626" size={24} />
        )}
        {status === 'paused' && (
          <Pause color="#f59e0b" size={24} />
        )}
      </View>

      {/* Current Node */}
      {currentNode && (
        <View className="mb-3 bg-blue-50 px-3 py-2 rounded-lg">
          <Text className="text-sm text-blue-900 font-medium">
            Current: {formatNodeName(currentNode)}
          </Text>
        </View>
      )}

      {/* Progress Stats */}
      <View className="flex-row items-center gap-4 mb-3">
        <View className="flex-row items-center gap-1">
          <CheckCircle2 color="#059669" size={16} />
          <Text className="text-sm text-gray-600">
            {completedNodes.size} completed
          </Text>
        </View>
        {status === 'running' && (
          <View className="flex-row items-center gap-1">
            <ActivityIndicator size="small" color="#0ea5e9" />
            <Text className="text-sm text-gray-600">In progress</Text>
          </View>
        )}
      </View>

      {/* Error Message */}
      {error && (
        <View className="bg-red-50 px-3 py-2 rounded-lg flex-row items-start gap-2">
          <AlertCircle color="#dc2626" size={16} />
          <Text className="text-sm text-red-800 flex-1">{error}</Text>
        </View>
      )}

      {/* Success Message */}
      {status === 'success' && (
        <View className="bg-green-50 px-3 py-2 rounded-lg">
          <Text className="text-sm text-green-800">
            Research completed successfully!
          </Text>
        </View>
      )}

      {/* Recent Activity */}
      {activityLog.length > 0 && (
        <View className="mt-3 pt-3 border-t border-gray-200">
          <Text className="text-xs font-medium text-gray-700 mb-2">
            Recent Activity
          </Text>
          <View className="gap-1">
            {activityLog.slice(-3).map((entry, index) => (
              <Text key={index} className="text-xs text-gray-600">
                • {entry.message || entry.type}
              </Text>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

/**
 * Format node name for display
 */
function formatNodeName(nodeName: string): string {
  // Convert snake_case or camelCase to Title Case
  return nodeName
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .trim();
}
