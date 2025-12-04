import * as React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Send,
  Copy,
  History,
  Save,
  Plus,
  Trash2,
  Key,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Code,
  FileJson,
} from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

export interface ApiEndpoint {
  id: string
  name: string
  method: HttpMethod
  path: string
  description?: string
  headers?: Record<string, string>
  queryParams?: Record<string, string>
  body?: string
  auth?: {
    type: 'none' | 'bearer' | 'basic' | 'apikey'
    value?: string
  }
}

export interface ApiResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  body: any
  time: number
}

export interface ApiRequest {
  endpoint: ApiEndpoint
  timestamp: Date
  response?: ApiResponse
}

export interface ApiExplorerProps {
  endpoints?: ApiEndpoint[]
  baseUrl?: string
  defaultHeaders?: Record<string, string>
  history?: ApiRequest[]
  onSave?: (endpoint: ApiEndpoint) => void
  onDelete?: (endpointId: string) => void
  onRequest?: (request: ApiRequest) => void
  className?: string
}

const methodColors: Record<HttpMethod, string> = {
  GET: 'bg-blue-500',
  POST: 'bg-green-500',
  PUT: 'bg-yellow-500',
  PATCH: 'bg-orange-500',
  DELETE: 'bg-red-500',
  HEAD: 'bg-purple-500',
  OPTIONS: 'bg-gray-500',
}

export const ApiExplorer = ({
  endpoints = [],
  baseUrl = '',
  defaultHeaders = {},
  history = [],
  onSave,
  onDelete,
  onRequest,
  className,
}: ApiExplorerProps) => {
  const [selectedEndpoint, setSelectedEndpoint] = React.useState<ApiEndpoint | null>(null)
  const [method, setMethod] = React.useState<HttpMethod>('GET')
  const [path, setPath] = React.useState('')
  const [headers, setHeaders] = React.useState<
    Array<{ key: string; value: string; enabled: boolean }>
  >([...Object.entries(defaultHeaders).map(([key, value]) => ({ key, value, enabled: true }))])
  const [queryParams, setQueryParams] = React.useState<
    Array<{ key: string; value: string; enabled: boolean }>
  >([])
  const [body, setBody] = React.useState('')
  const [authType, setAuthType] = React.useState<'none' | 'bearer' | 'basic' | 'apikey'>('none')
  const [authValue, setAuthValue] = React.useState('')
  const [response, setResponse] = React.useState<ApiResponse | null>(null)
  const [loading, setLoading] = React.useState(false)

  const handleSelectEndpoint = (endpoint: ApiEndpoint) => {
    setSelectedEndpoint(endpoint)
    setMethod(endpoint.method)
    setPath(endpoint.path)
    setHeaders([
      ...Object.entries(defaultHeaders).map(([key, value]) => ({ key, value, enabled: true })),
      ...Object.entries(endpoint.headers || {}).map(([key, value]) => ({
        key,
        value,
        enabled: true,
      })),
    ])
    setQueryParams(
      Object.entries(endpoint.queryParams || {}).map(([key, value]) => ({
        key,
        value,
        enabled: true,
      })),
    )
    setBody(endpoint.body || '')
    setAuthType(endpoint.auth?.type || 'none')
    setAuthValue(endpoint.auth?.value || '')
  }

  const handleSend = async () => {
    setLoading(true)
    setResponse(null)

    try {
      // Build URL with query params
      const url = new URL(path, baseUrl)
      queryParams.forEach(param => {
        if (param.enabled && param.key) {
          url.searchParams.append(param.key, param.value)
        }
      })

      // Build headers
      const requestHeaders: Record<string, string> = {}
      headers.forEach(header => {
        if (header.enabled && header.key) {
          requestHeaders[header.key] = header.value
        }
      })

      // Add auth header
      if (authType === 'bearer' && authValue) {
        requestHeaders['Authorization'] = `Bearer ${authValue}`
      } else if (authType === 'basic' && authValue) {
        requestHeaders['Authorization'] = `Basic ${authValue}`
      } else if (authType === 'apikey' && authValue) {
        requestHeaders['X-API-Key'] = authValue
      }

      const startTime = Date.now()

      // Make request (this is a mock - in real implementation, this would make actual HTTP request)
      const mockResponse: ApiResponse = {
        status: 200,
        statusText: 'OK',
        headers: {
          'content-type': 'application/json',
          'x-request-id': Math.random().toString(36).substr(2, 9),
        },
        body: {
          message: 'Mock response',
          method,
          path: url.toString(),
          headers: requestHeaders,
          body: body ? JSON.parse(body) : undefined,
        },
        time: Date.now() - startTime,
      }

      setResponse(mockResponse)

      // Add to history
      if (onRequest) {
        const request: ApiRequest = {
          endpoint: {
            id: selectedEndpoint?.id || Math.random().toString(36).substr(2, 9),
            name: selectedEndpoint?.name || `${method} ${path}`,
            method,
            path,
            headers: Object.fromEntries(headers.filter(h => h.enabled).map(h => [h.key, h.value])),
            queryParams: Object.fromEntries(
              queryParams.filter(p => p.enabled).map(p => [p.key, p.value]),
            ),
            body,
            auth: { type: authType, value: authValue },
          },
          timestamp: new Date(),
          response: mockResponse,
        }
        onRequest(request)
      }
    } catch (error) {
      const errorResponse: ApiResponse = {
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        body: { error: error instanceof Error ? error.message : 'Unknown error' },
        time: 0,
      }
      setResponse(errorResponse)
    } finally {
      setLoading(false)
    }
  }

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '', enabled: true }])
  }

  const addQueryParam = () => {
    setQueryParams([...queryParams, { key: '', value: '', enabled: true }])
  }

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-600'
    if (status >= 300 && status < 400) return 'text-yellow-600'
    if (status >= 400 && status < 500) return 'text-orange-600'
    return 'text-red-600'
  }

  return (
    <div className={cn('grid grid-cols-12 gap-4 h-[800px]', className)}>
      {/* Sidebar */}
      <Card className="col-span-3 overflow-hidden">
        <CardHeader>
          <CardTitle>Endpoints</CardTitle>
          <CardDescription>Select an endpoint to test</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100%-5rem)]">
            <div className="space-y-1 p-4">
              {endpoints.map(endpoint => (
                <button
                  key={endpoint.id}
                  className={cn(
                    'w-full text-left p-3 rounded-lg transition-colors',
                    'hover:bg-muted',
                    selectedEndpoint?.id === endpoint.id && 'bg-muted',
                  )}
                  onClick={() => handleSelectEndpoint(endpoint)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={cn('text-xs', methodColors[endpoint.method])}>
                      {endpoint.method}
                    </Badge>
                    <span className="text-sm font-medium truncate">{endpoint.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{endpoint.path}</p>
                </button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="col-span-9 space-y-4">
        {/* Request Builder */}
        <Card>
          <CardHeader>
            <CardTitle>Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Method and URL */}
            <div className="flex gap-2">
              <Select value={method} onValueChange={value => setMethod(value as HttpMethod)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as HttpMethod[]
                  ).map(m => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex-1 relative">
                <Input
                  className="pr-20"
                  placeholder="/api/endpoint"
                  value={path}
                  onChange={e => setPath(e.target.value)}
                />
                {baseUrl && (
                  <span className="absolute right-2 top-2.5 text-xs text-muted-foreground">
                    {baseUrl}
                  </span>
                )}
              </div>
              <Button disabled={loading} onClick={handleSend}>
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
            </div>

            {/* Tabs for Headers, Query, Body, Auth */}
            <Tabs defaultValue="headers">
              <TabsList>
                <TabsTrigger value="headers">
                  Headers
                  {headers.filter(h => h.enabled).length > 0 && (
                    <Badge className="ml-2" variant="secondary">
                      {headers.filter(h => h.enabled).length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="query">
                  Query
                  {queryParams.filter(p => p.enabled).length > 0 && (
                    <Badge className="ml-2" variant="secondary">
                      {queryParams.filter(p => p.enabled).length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger disabled={method === 'GET' || method === 'HEAD'} value="body">
                  Body
                </TabsTrigger>
                <TabsTrigger value="auth">
                  Auth
                  {authType !== 'none' && (
                    <Badge className="ml-2" variant="secondary">
                      1
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent className="space-y-2" value="headers">
                {headers.map((header, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Switch
                      checked={header.enabled}
                      onCheckedChange={checked => {
                        const newHeaders = [...headers]
                        newHeaders[index].enabled = checked
                        setHeaders(newHeaders)
                      }}
                    />
                    <Input
                      className="flex-1"
                      placeholder="Key"
                      value={header.key}
                      onChange={e => {
                        const newHeaders = [...headers]
                        newHeaders[index].key = e.target.value
                        setHeaders(newHeaders)
                      }}
                    />
                    <Input
                      className="flex-1"
                      placeholder="Value"
                      value={header.value}
                      onChange={e => {
                        const newHeaders = [...headers]
                        newHeaders[index].value = e.target.value
                        setHeaders(newHeaders)
                      }}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setHeaders(headers.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={addHeader}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Header
                </Button>
              </TabsContent>

              <TabsContent className="space-y-2" value="query">
                {queryParams.map((param, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Switch
                      checked={param.enabled}
                      onCheckedChange={checked => {
                        const newParams = [...queryParams]
                        newParams[index].enabled = checked
                        setQueryParams(newParams)
                      }}
                    />
                    <Input
                      className="flex-1"
                      placeholder="Key"
                      value={param.key}
                      onChange={e => {
                        const newParams = [...queryParams]
                        newParams[index].key = e.target.value
                        setQueryParams(newParams)
                      }}
                    />
                    <Input
                      className="flex-1"
                      placeholder="Value"
                      value={param.value}
                      onChange={e => {
                        const newParams = [...queryParams]
                        newParams[index].value = e.target.value
                        setQueryParams(newParams)
                      }}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setQueryParams(queryParams.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={addQueryParam}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Parameter
                </Button>
              </TabsContent>

              <TabsContent value="body">
                <Textarea
                  className="font-mono text-sm min-h-[200px]"
                  placeholder="Request body (JSON)"
                  value={body}
                  onChange={e => setBody(e.target.value)}
                />
              </TabsContent>

              <TabsContent className="space-y-4" value="auth">
                <div>
                  <Label>Authentication Type</Label>
                  <Select value={authType} onValueChange={value => setAuthType(value as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="bearer">Bearer Token</SelectItem>
                      <SelectItem value="basic">Basic Auth</SelectItem>
                      <SelectItem value="apikey">API Key</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {authType !== 'none' && (
                  <div>
                    <Label>
                      {authType === 'bearer'
                        ? 'Token'
                        : authType === 'basic'
                        ? 'Credentials'
                        : 'API Key'}
                    </Label>
                    <Input
                      placeholder={authType === 'basic' ? 'username:password' : 'Enter value'}
                      type={authType === 'basic' ? 'text' : 'password'}
                      value={authValue}
                      onChange={e => setAuthValue(e.target.value)}
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Response */}
        {response && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Response</CardTitle>
                <div className="flex items-center gap-4">
                  <Badge className={getStatusColor(response.status)} variant="outline">
                    {response.status} {response.statusText}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {response.time}ms
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="body">
                <TabsList>
                  <TabsTrigger value="body">Body</TabsTrigger>
                  <TabsTrigger value="headers">Headers</TabsTrigger>
                </TabsList>
                <TabsContent value="body">
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                      {JSON.stringify(response.body, null, 2)}
                    </pre>
                    <Button
                      className="absolute top-2 right-2"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        navigator.clipboard.writeText(JSON.stringify(response.body, null, 2))
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="headers">
                  <div className="space-y-2">
                    {Object.entries(response.headers).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-1">
                        <span className="font-mono text-sm font-medium">{key}:</span>
                        <span className="font-mono text-sm text-muted-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
