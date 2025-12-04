import { type NodeTemplate } from '../types'
import {
  AlertCircle,
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  GitBranch,
  GitPullRequest,
  Mail,
  MessageSquare,
  MousePointer,
  RefreshCw,
  Shield,
  Tag,
  User,
  Users,
  Webhook,
  Workflow,
  XCircle,
  Zap,
} from 'lucide-react'

export const jiraAutomationTemplates: NodeTemplate[] = [
  // ============ TRIGGERS ============
  {
    type: 'trigger',
    category: 'Issue Triggers',
    title: 'Issue Created',
    description: 'Triggers when a new issue is created',
    icon: FileText,
    defaultConfig: {
      triggerType: 'issue_created',
      filters: {
        projectKey: '',
        issueType: 'any',
      },
    },
    outputs: [{ type: 'output', position: 'right', label: 'Issue' }],
  },
  {
    type: 'trigger',
    category: 'Issue Triggers',
    title: 'Issue Updated',
    description: 'Triggers when an issue is updated',
    icon: RefreshCw,
    defaultConfig: {
      triggerType: 'issue_updated',
      filters: {
        projectKey: '',
        fields: [],
      },
    },
    outputs: [{ type: 'output', position: 'right', label: 'Issue' }],
  },
  {
    type: 'trigger',
    category: 'Issue Triggers',
    title: 'Issue Transitioned',
    description: 'Triggers when an issue changes status',
    icon: GitBranch,
    defaultConfig: {
      triggerType: 'issue_transitioned',
      fromStatus: '',
      toStatus: '',
    },
    outputs: [{ type: 'output', position: 'right', label: 'Issue' }],
  },
  {
    type: 'trigger',
    category: 'Issue Triggers',
    title: 'Comment Added',
    description: 'Triggers when a comment is added to an issue',
    icon: MessageSquare,
    defaultConfig: {
      triggerType: 'comment_added',
      authorFilter: 'any',
    },
    outputs: [{ type: 'output', position: 'right', label: 'Comment' }],
  },
  {
    type: 'trigger',
    category: 'Time Triggers',
    title: 'Scheduled',
    description: 'Triggers on a schedule',
    icon: Calendar,
    defaultConfig: {
      triggerType: 'scheduled',
      schedule: '0 9 * * 1', // Every Monday at 9 AM
      timezone: 'UTC',
    },
    outputs: [{ type: 'output', position: 'right' }],
  },
  {
    type: 'trigger',
    category: 'Time Triggers',
    title: 'Field Value Changed',
    description: 'Triggers when a specific field value changes',
    icon: Tag,
    defaultConfig: {
      triggerType: 'field_changed',
      fieldName: '',
      oldValue: '',
      newValue: '',
    },
    outputs: [{ type: 'output', position: 'right', label: 'Issue' }],
  },
  {
    type: 'trigger',
    category: 'External Triggers',
    title: 'Webhook',
    description: 'Triggers via external webhook',
    icon: Webhook,
    defaultConfig: {
      triggerType: 'webhook',
      secret: '',
    },
    outputs: [{ type: 'output', position: 'right', label: 'Payload' }],
  },
  {
    type: 'trigger',
    category: 'External Triggers',
    title: 'Pull Request',
    description: 'Triggers on pull request events',
    icon: GitPullRequest,
    defaultConfig: {
      triggerType: 'pull_request',
      events: ['opened', 'merged', 'closed'],
      repository: '',
    },
    outputs: [{ type: 'output', position: 'right', label: 'PR Data' }],
  },

  // ============ CONDITIONS ============
  {
    type: 'condition',
    category: 'Issue Conditions',
    title: 'Issue Type',
    description: 'Check if issue is of specific type',
    icon: FileText,
    defaultConfig: {
      operator: 'equals',
      issueType: 'Bug',
    },
    inputs: [{ type: 'input', position: 'left', label: 'Issue' }],
    outputs: [
      { type: 'output', position: 'right', label: 'Match' },
      { type: 'output', position: 'right', label: 'No Match' },
    ],
  },
  {
    type: 'condition',
    category: 'Issue Conditions',
    title: 'Status Check',
    description: 'Check if issue is in specific status',
    icon: CheckCircle,
    defaultConfig: {
      operator: 'equals',
      status: 'In Progress',
    },
    inputs: [{ type: 'input', position: 'left', label: 'Issue' }],
    outputs: [
      { type: 'output', position: 'right', label: 'Match' },
      { type: 'output', position: 'right', label: 'No Match' },
    ],
  },
  {
    type: 'condition',
    category: 'Issue Conditions',
    title: 'Priority Level',
    description: 'Check issue priority',
    icon: AlertCircle,
    defaultConfig: {
      operator: 'greaterThanOrEqual',
      priority: 'High',
    },
    inputs: [{ type: 'input', position: 'left', label: 'Issue' }],
    outputs: [
      { type: 'output', position: 'right', label: 'Match' },
      { type: 'output', position: 'right', label: 'No Match' },
    ],
  },
  {
    type: 'condition',
    category: 'User Conditions',
    title: 'User Role',
    description: 'Check if user has specific role',
    icon: Shield,
    defaultConfig: {
      roles: ['Developer', 'Admin'],
      matchType: 'any', // any or all
    },
    inputs: [{ type: 'input', position: 'left', label: 'User' }],
    outputs: [
      { type: 'output', position: 'right', label: 'Has Role' },
      { type: 'output', position: 'right', label: 'No Role' },
    ],
  },
  {
    type: 'condition',
    category: 'User Conditions',
    title: 'User in Group',
    description: 'Check if user belongs to group',
    icon: Users,
    defaultConfig: {
      groups: [],
    },
    inputs: [{ type: 'input', position: 'left', label: 'User' }],
    outputs: [
      { type: 'output', position: 'right', label: 'In Group' },
      { type: 'output', position: 'right', label: 'Not in Group' },
    ],
  },
  {
    type: 'condition',
    category: 'Advanced Conditions',
    title: 'JQL Query',
    description: 'Check if issue matches JQL query',
    icon: Workflow,
    defaultConfig: {
      jql: 'project = "PROJ" AND status = "Open"',
    },
    inputs: [{ type: 'input', position: 'left', label: 'Issue' }],
    outputs: [
      { type: 'output', position: 'right', label: 'Match' },
      { type: 'output', position: 'right', label: 'No Match' },
    ],
  },
  {
    type: 'condition',
    category: 'Time Conditions',
    title: 'Time Since',
    description: 'Check time elapsed since event',
    icon: Clock,
    defaultConfig: {
      field: 'created',
      duration: 7,
      unit: 'days',
      operator: 'greaterThan',
    },
    inputs: [{ type: 'input', position: 'left', label: 'Issue' }],
    outputs: [
      { type: 'output', position: 'right', label: 'Condition Met' },
      { type: 'output', position: 'right', label: 'Not Met' },
    ],
  },

  // ============ ACTIONS ============
  {
    type: 'action',
    category: 'Issue Actions',
    title: 'Transition Issue',
    description: 'Move issue to different status',
    icon: GitBranch,
    defaultConfig: {
      transitionTo: 'Done',
      comment: '',
    },
    inputs: [{ type: 'input', position: 'left', label: 'Issue', required: true }],
    outputs: [{ type: 'output', position: 'right', label: 'Updated' }],
  },
  {
    type: 'action',
    category: 'Issue Actions',
    title: 'Update Field',
    description: 'Update issue field value',
    icon: RefreshCw,
    defaultConfig: {
      field: '',
      value: '',
      operation: 'set', // set, append, increment
    },
    inputs: [{ type: 'input', position: 'left', label: 'Issue', required: true }],
    outputs: [{ type: 'output', position: 'right', label: 'Updated' }],
  },
  {
    type: 'action',
    category: 'Issue Actions',
    title: 'Add Comment',
    description: 'Add a comment to the issue',
    icon: MessageSquare,
    defaultConfig: {
      comment: '',
      visibility: 'all', // all, developers, internal
    },
    inputs: [{ type: 'input', position: 'left', label: 'Issue', required: true }],
    outputs: [{ type: 'output', position: 'right', label: 'Comment' }],
  },
  {
    type: 'action',
    category: 'Issue Actions',
    title: 'Assign Issue',
    description: 'Assign issue to user',
    icon: User,
    defaultConfig: {
      assignTo: 'reporter', // reporter, specific user, unassigned
      specificUser: '',
    },
    inputs: [{ type: 'input', position: 'left', label: 'Issue', required: true }],
    outputs: [{ type: 'output', position: 'right', label: 'Assigned' }],
  },
  {
    type: 'action',
    category: 'Issue Actions',
    title: 'Clone Issue',
    description: 'Create a copy of the issue',
    icon: FileText,
    defaultConfig: {
      linkType: 'clones',
      summaryPrefix: '[Clone] ',
      copyFields: ['description', 'attachments'],
    },
    inputs: [{ type: 'input', position: 'left', label: 'Issue', required: true }],
    outputs: [{ type: 'output', position: 'right', label: 'New Issue' }],
  },
  {
    type: 'action',
    category: 'Issue Actions',
    title: 'Create Sub-task',
    description: 'Create a sub-task for the issue',
    icon: GitBranch,
    defaultConfig: {
      summary: '',
      description: '',
      assignTo: 'parent_assignee',
    },
    inputs: [{ type: 'input', position: 'left', label: 'Parent', required: true }],
    outputs: [{ type: 'output', position: 'right', label: 'Sub-task' }],
  },
  {
    type: 'action',
    category: 'Notifications',
    title: 'Send Email',
    description: 'Send email notification',
    icon: Mail,
    defaultConfig: {
      to: ['reporter', 'assignee', 'watchers'],
      subject: '',
      body: '',
      includeIssueDetails: true,
    },
    inputs: [{ type: 'input', position: 'left', label: 'Data', required: true }],
    outputs: [{ type: 'output', position: 'right', label: 'Sent' }],
  },
  {
    type: 'action',
    category: 'Notifications',
    title: 'Send Slack Message',
    description: 'Post message to Slack',
    icon: MessageSquare,
    defaultConfig: {
      channel: '',
      message: '',
      mentionUsers: false,
    },
    inputs: [{ type: 'input', position: 'left', label: 'Data', required: true }],
    outputs: [{ type: 'output', position: 'right', label: 'Sent' }],
  },
  {
    type: 'action',
    category: 'Notifications',
    title: 'Create Alert',
    description: 'Create system alert',
    icon: Bell,
    defaultConfig: {
      severity: 'info', // info, warning, error
      title: '',
      message: '',
      recipients: [],
    },
    inputs: [{ type: 'input', position: 'left', label: 'Data', required: true }],
    outputs: [{ type: 'output', position: 'right', label: 'Alert' }],
  },
  {
    type: 'action',
    category: 'Advanced Actions',
    title: 'HTTP Request',
    description: 'Make external API call',
    icon: Zap,
    defaultConfig: {
      method: 'POST',
      url: '',
      headers: {},
      body: {},
      authentication: 'none',
    },
    inputs: [{ type: 'input', position: 'left', label: 'Data' }],
    outputs: [{ type: 'output', position: 'right', label: 'Response' }],
  },
  {
    type: 'action',
    category: 'Advanced Actions',
    title: 'Run Script',
    description: 'Execute custom script',
    icon: FileText,
    defaultConfig: {
      language: 'javascript',
      script: '// Your custom logic here\nreturn { success: true };',
    },
    inputs: [{ type: 'input', position: 'left', label: 'Input' }],
    outputs: [{ type: 'output', position: 'right', label: 'Result' }],
  },
  {
    type: 'action',
    category: 'Error Handling',
    title: 'Log Error',
    description: 'Log error for debugging',
    icon: XCircle,
    defaultConfig: {
      logLevel: 'error',
      includeStackTrace: true,
      notifyAdmins: false,
    },
    inputs: [{ type: 'input', position: 'left', label: 'Error' }],
    outputs: [{ type: 'output', position: 'right', label: 'Logged' }],
  },
]

// Pre-built workflow examples
export const jiraWorkflowExamples = {
  autoAssignBugs: {
    name: 'Auto-assign Critical Bugs',
    description: 'Automatically assign critical bugs to the team lead',
    nodes: [
      {
        id: '1',
        type: 'trigger' as const,
        title: 'Issue Created',
        position: { x: 100, y: 100 },
      },
      {
        id: '2',
        type: 'condition' as const,
        title: 'Is Critical Bug?',
        position: { x: 300, y: 100 },
      },
      {
        id: '3',
        type: 'action' as const,
        title: 'Assign to Team Lead',
        position: { x: 500, y: 50 },
      },
      {
        id: '4',
        type: 'action' as const,
        title: 'Send Slack Alert',
        position: { x: 700, y: 50 },
      },
    ],
    connections: [
      { source: '1', target: '2' },
      { source: '2', target: '3', label: 'Yes' },
      { source: '3', target: '4' },
    ],
  },

  slaEscalation: {
    name: 'SLA Escalation',
    description: 'Escalate issues that breach SLA',
    nodes: [
      {
        id: '1',
        type: 'trigger' as const,
        title: 'Scheduled Check',
        position: { x: 100, y: 100 },
      },
      {
        id: '2',
        type: 'condition' as const,
        title: 'SLA Breached?',
        position: { x: 300, y: 100 },
      },
      {
        id: '3',
        type: 'action' as const,
        title: 'Update Priority',
        position: { x: 500, y: 50 },
      },
      {
        id: '4',
        type: 'action' as const,
        title: 'Notify Manager',
        position: { x: 700, y: 50 },
      },
      {
        id: '5',
        type: 'action' as const,
        title: 'Add Comment',
        position: { x: 900, y: 50 },
      },
    ],
    connections: [
      { source: '1', target: '2' },
      { source: '2', target: '3', label: 'Breached' },
      { source: '3', target: '4' },
      { source: '4', target: '5' },
    ],
  },

  releaseNotification: {
    name: 'Release Notification',
    description: 'Notify stakeholders when issues are released',
    nodes: [
      {
        id: '1',
        type: 'trigger' as const,
        title: 'Issue Transitioned',
        position: { x: 100, y: 100 },
      },
      {
        id: '2',
        type: 'condition' as const,
        title: 'To Released?',
        position: { x: 300, y: 100 },
      },
      {
        id: '3',
        type: 'action' as const,
        title: 'Update Fix Version',
        position: { x: 500, y: 50 },
      },
      {
        id: '4',
        type: 'action' as const,
        title: 'Email Reporter',
        position: { x: 700, y: 50 },
      },
      {
        id: '5',
        type: 'action' as const,
        title: 'Post to Slack',
        position: { x: 700, y: 150 },
      },
    ],
    connections: [
      { source: '1', target: '2' },
      { source: '2', target: '3', label: 'Yes' },
      { source: '3', target: '4' },
      { source: '3', target: '5' },
    ],
  },
}
