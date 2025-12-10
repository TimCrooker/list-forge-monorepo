# ListForge Monorepo - Claude Context File

> **Purpose**: This file provides comprehensive context about the ListForge monorepo architecture, patterns, and conventions to help Claude understand the codebase structure and make better suggestions.

---

## 📋 Table of Contents

1. [Monorepo Structure](#monorepo-structure)
2. [Shared Packages & Types](#shared-packages--types)
3. [Backend Architecture (NestJS)](#backend-architecture-nestjs)
4. [Frontend Architecture (React)](#frontend-architecture-react)
5. [Mobile App Architecture (React Native)](#mobile-app-architecture-react-native)
6. [Authentication & Authorization](#authentication--authorization)
7. [Real-Time Architecture (WebSocket)](#real-time-architecture-websocket)
8. [Job Queues (BullMQ)](#job-queues-bullmq)
9. [AI Workflows (LangGraph)](#ai-workflows-langgraph)
10. [Error Handling](#error-handling)
11. [Marketplace Integrations](#marketplace-integrations)
12. [Development Workflow](#development-workflow)

---

## Monorepo Structure

### Technology Stack

- **Monorepo Manager**: pnpm workspaces with Turborepo
- **Language**: TypeScript 5.3+ (strict mode)
- **Node Version**: 18+
- **Package Manager**: pnpm 8+

### Workspace Layout

```
list-forge-monorepo/
├── apps/
│   ├── listforge-api/      # NestJS backend
│   ├── listforge-web/      # React frontend (Vite)
│   └── listforge-mobile/   # React Native (Expo SDK 54)
├── packages/
│   ├── api-rtk/           # RTK Query API definitions
│   ├── api-types/         # Request/response DTOs
│   ├── core-types/        # Domain entity types
│   ├── socket-types/      # WebSocket event definitions
│   ├── queue-types/       # BullMQ job definitions
│   ├── marketplace-adapters/  # eBay/Amazon adapters
│   ├── ui/                # Shared React components
│   └── config/            # Shared configs (tsconfig, eslint)
└── docs/                  # Documentation files
```

### Root Scripts

```bash
pnpm dev          # Start all apps (API, Web, Mobile)
pnpm build        # Build all packages
pnpm lint         # Lint all packages
pnpm type-check   # TypeScript check all packages
pnpm db:migrate   # Run database migrations
pnpm db:seed      # Seed initial data
```

---

## Shared Packages & Types

### Package Import Conventions

All shared packages use `@listforge/*` namespace:

```typescript
import { Item, LifecycleStatus } from '@listforge/core-types';
import { CreateItemDto } from '@listforge/api-types';
import { SocketEvents } from '@listforge/socket-types';
import { QUEUE_AI_WORKFLOW } from '@listforge/queue-types';
```

### @listforge/core-types

**Purpose**: Canonical domain entity types shared across frontend, backend, and mobile.

**Key Types**:

- `Item` - Unified item model with lifecycle tracking
- `ItemResearchData` - Structured research results
- `ChatSession`, `ChatMessage` - Chat system types
- `EvidenceBundle` - Research evidence tracking
- `Organization`, `UserRole` - Multi-tenancy types

**Type Hierarchies**:

```typescript
// Item Lifecycle
LifecycleStatus: 'draft' | 'ready' | 'listed' | 'sold' | 'archived'
AiReviewState: 'none' | 'pending' | 'researching' | 'ai_reviewed' |
               'approved' | 'rejected'
ItemSource: 'ai_capture' | 'manual'

// Research System
ResearchRunType: 'initial_intake' | 'pricing_refresh' | 'manual_request'
FieldDataSource: 'upc_lookup' | 'vision_ai' | 'web_search' | 'keepa' |
                 'amazon_catalog' | 'user_input' | 'inference'
```

**Important**: Export order matters - `research.ts` must export before `evidence.ts` due to type dependencies.

### @listforge/api-types

**Purpose**: Request/response DTOs for API endpoints.

**Pattern**: Each feature has dedicated DTOs:

- `CreateItemDto`, `UpdateItemDto`, `ItemDto`
- `StartResearchDto`, `ResearchRunDto`
- `SendChatMessageDto`, `ChatMessageDto`

**Validation**: Uses `class-validator` decorators for request validation.

### @listforge/socket-types

**Purpose**: Type-safe WebSocket event definitions.

**Pattern**:

```typescript
// Event names
export const SocketEvents = {
  ITEM_CREATED: 'item:created',
  RESEARCH_NODE_STARTED: 'research:node-started',
  CHAT_MESSAGE: 'chat:message',
  // ...
} as const;

// Payload types
export interface ItemCreatedPayload {
  id: string;
  organizationId: string;
  // ...
}

// Type map
export interface SocketEventPayloads {
  [SocketEvents.ITEM_CREATED]: ItemCreatedPayload;
  // ...
}
```

**Room Naming Helpers**:

```typescript
Rooms.org(orgId)              // "org:abc123"
Rooms.item(itemId)            // "item:xyz789"
Rooms.user(userId)            // "user:user456"
Rooms.researchRun(runId)      // "research-run:run789"
Rooms.chatSession(sessionId)  // "chat-session:chat456"
```

### @listforge/queue-types

**Purpose**: BullMQ job type definitions.

**Queues**:

- `QUEUE_AI_WORKFLOW` - AI workflow jobs (intake, research)
- `QUEUE_MARKETPLACE_PUBLISH` - Publishing to marketplaces
- `QUEUE_MARKETPLACE_SYNC` - Syncing listing status

**Job Types**:

```typescript
StartResearchRunJob: {
  runId: string;
  runType: 'initial_intake' | 'pricing_refresh' | 'manual_request';
}
```

---

## Backend Architecture (NestJS)

### Module Organization

**Pattern**: Feature-based modules, not layer-based.

**Core Modules**:

- `AppModule` - Entry point, global config
- `ConfigModule` - Environment variables (global)
- `ThrottlerModule` - Rate limiting (20 req/min default)

**Feature Modules**:

- `AuthModule` - JWT authentication
- `UsersModule` - User management + push notification tokens
- `OrganizationsModule` - Multi-tenant org management
- `ItemsModule` - Unified item CRUD
- `ResearchModule` - Research orchestration
- `ChatModule` - Chat sessions + WebSocket gateway
- `AiWorkflowsModule` - LangGraph workflows
- `MarketplacesModule` - eBay/Amazon integrations
- `EvidenceModule` - Research evidence
- `StorageModule` - S3/MinIO uploads
- `EventsModule` - Socket.IO event emission
- `AdminModule` - Admin operations

### Module Structure Pattern

```
feature-module/
├── dto/                    # Request/response DTOs
│   ├── create-*.dto.ts
│   ├── update-*.dto.ts
│   └── query-*.dto.ts
├── entities/              # TypeORM entities
│   └── *.entity.ts
├── services/              # Business logic
│   └── *.service.ts
├── controllers/           # HTTP endpoints
│   └── *.controller.ts
├── processors/            # BullMQ job processors
│   └── *.processor.ts
├── guards/                # Custom guards
├── feature.module.ts      # Module definition
└── feature.gateway.ts     # Socket.IO gateway (if needed)
```

### Entity Patterns

**TypeORM Conventions**:

```typescript
@Entity('table_name')
export class EntityName {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Index(['organizationId', 'createdAt'])
  @Column('uuid')
  organizationId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**Key Patterns**:

- Use JSONB for nested data (attributes, media, research results)
- Composite indexes for filtered queries: `[organizationId, createdAt]`
- UUID primary keys
- Timestamps with TypeORM decorators
- Explicit foreign key columns for filtering

### Service Layer Pattern

```typescript
@Injectable()
export class FeatureService {
  private readonly logger = new Logger(FeatureService.name);

  constructor(
    @InjectRepository(Entity)
    private entityRepository: Repository<Entity>,
    private dataSource: DataSource, // For transactions
    private configService: ConfigService,
  ) {}

  async create(ctx: RequestContext, dto: CreateDto): Promise<Entity> {
    // Business logic here
  }
}
```

### Controller Patterns

```typescript
@Controller('feature')
@UseGuards(JwtAuthGuard, OrgGuard)
export class FeatureController {
  constructor(private featureService: FeatureService) {}

  @Get()
  async list(@ReqCtx() ctx: RequestContext): Promise<ListResponse> {
    return this.featureService.list(ctx);
  }

  @Post()
  @UseInterceptors(FilesInterceptor('photos', 10))
  async create(
    @ReqCtx() ctx: RequestContext,
    @Body() dto: CreateDto,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<CreateResponse> {
    return this.featureService.create(ctx, dto, files);
  }
}
```

**Key Patterns**:

- Use `@ReqCtx()` for request context (user, org)
- Guards applied at controller level
- DTOs for request validation
- Return typed responses

### Request Context Pattern

```typescript
export interface RequestContext {
  user: User;
  organization: Organization;
}

// Usage in controller
@Post()
async create(@ReqCtx() ctx: RequestContext, @Body() dto: CreateDto) {
  // ctx.user and ctx.organization available
}
```

---

## Frontend Architecture (React)

### Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **State Management**: Redux Toolkit
- **Data Fetching**: RTK Query
- **Routing**: TanStack Router (type-safe)
- **UI Library**: ShadCN UI + Radix UI + Tailwind CSS
- **Real-Time**: Socket.IO client

### Redux Store Structure

```typescript
store:
  [api.reducerPath]: api.reducer  // RTK Query
  auth: authReducer               // User, org, token
```

### RTK Query API Pattern

**Location**: `packages/api-rtk/src/api.ts`

```typescript
export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Item', 'Research', 'Chat', 'Organization'],
  endpoints: (builder) => ({
    listItems: builder.query<ListItemsResponse, ListItemsRequest>({
      query: (params) => ({
        url: '/items',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'Item' as const, id })),
              { type: 'Item', id: 'LIST' },
            ]
          : [{ type: 'Item', id: 'LIST' }],
    }),

    updateItem: builder.mutation<ItemDto, { id: string; updates: UpdateItemDto }>({
      query: ({ id, updates }) => ({
        url: `/items/${id}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Item', id }],
    }),
  }),
});

export const {
  useListItemsQuery,
  useUpdateItemMutation,
} = api;
```

**Cache Invalidation**: Use `invalidatesTags` to trigger refetches.

### TanStack Router Patterns

**File-Based Routing**:

```
src/routes/
├── _authenticated/          # Protected routes layout
│   ├── items/
│   │   ├── index.tsx       # /items
│   │   └── $id.tsx         # /items/:id
│   ├── capture/
│   │   └── index.tsx       # /capture
│   └── settings/
│       └── index.tsx       # /settings
└── login.tsx               # /login
```

**Route Definition**:

```typescript
export const Route = createFileRoute('/_authenticated/items/$id')({
  component: ItemDetailPage,
  loader: async ({ context, params }) => {
    // Pre-load data
    const item = await context.queryClient.ensureQueryData({
      queryKey: ['item', params.id],
      queryFn: () => fetchItem(params.id),
    });
    return { item };
  },
});
```

### Component Organization

```
src/
├── components/
│   ├── chat/              # Chat UI components
│   ├── research/          # Research panels
│   ├── items/             # Item management
│   ├── capture/           # Capture workflow
│   ├── review/            # Review queue
│   ├── settings/          # Settings pages
│   └── common/            # Shared components
├── routes/                # TanStack Router routes
├── store/                 # Redux slices
├── layouts/               # App layouts
├── hooks/                 # Custom hooks
├── contexts/              # React contexts
└── utils/                 # Utilities
```

### Socket Integration

**Custom Hook Pattern**:

```typescript
export function useChatSocket(sessionId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    socket.emit('join', { room: Rooms.chatSession(sessionId) });

    socket.on(SocketEvents.CHAT_MESSAGE, (payload) => {
      setMessages((prev) => [...prev, payload.message]);
    });

    return () => {
      socket.off(SocketEvents.CHAT_MESSAGE);
    };
  }, [sessionId]);

  return { messages, isTyping };
}
```

---

## Mobile App Architecture (React Native)

### Tech Stack

- **Framework**: React Native via Expo SDK 54
- **Styling**: NativeWind (Tailwind for RN)
- **Navigation**: React Navigation (bottom tabs + stack)
- **State**: Redux Toolkit + RTK Query
- **Offline Storage**: SQLite (expo-sqlite)
- **Real-Time**: Socket.IO client
- **Camera**: expo-camera with barcode scanning
- **Notifications**: expo-notifications

### Offline-First Architecture

**SQLite Database Pattern**:

```typescript
// database.ts
export class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init() {
    this.db = await SQLite.openDatabaseAsync('listforge.db');

    // Enable WAL for performance
    await this.db.execAsync('PRAGMA journal_mode = WAL');

    // Create tables
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS pending_captures (
        id TEXT PRIMARY KEY,
        title TEXT,
        description TEXT,
        created_at INTEGER,
        sync_status TEXT,
        retry_count INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS capture_photos (
        id TEXT PRIMARY KEY,
        capture_id TEXT,
        uri TEXT,
        file_size INTEGER,
        created_at INTEGER,
        FOREIGN KEY(capture_id) REFERENCES pending_captures(id)
      );
    `);
  }

  async createCapture(data: CaptureData): Promise<string> {
    const id = uuid.v4();
    await this.db.runAsync(
      'INSERT INTO pending_captures (id, title, ...) VALUES (?, ?, ...)',
      [id, data.title, ...]
    );
    return id;
  }
}
```

### Background Sync Pattern

**Sync Service**:

```typescript
// syncService.ts
export class SyncService {
  private isSyncing = false;
  private retryDelays = [1000, 5000, 30000]; // Exponential backoff

  async syncAll() {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const pending = await db.getPendingCaptures();

      for (const capture of pending) {
        await this.syncCapture(capture);
      }
    } finally {
      this.isSyncing = false;
    }
  }

  async syncCapture(capture: Capture) {
    try {
      // Upload photos
      const formData = new FormData();
      for (const photo of capture.photos) {
        formData.append('photos', {
          uri: photo.uri,
          type: 'image/jpeg',
          name: 'photo.jpg',
        });
      }

      // Create item on server
      const result = await api.createItem(formData);

      // Mark as synced
      await db.updateCaptureStatus(capture.id, 'synced');
    } catch (error) {
      // Increment retry count
      await db.incrementRetryCount(capture.id);
    }
  }
}

// Register background task
TaskManager.defineTask('background-sync', async () => {
  await syncService.syncAll();
  return BackgroundFetch.BackgroundFetchResult.NewData;
});
```

### Redux Integration

```typescript
// store/index.ts
export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth: authReducer,
    sync: syncReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

// store/slices/authSlice.ts
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: null,
    userId: null,
    isAuthenticated: false,
  },
  reducers: {
    setCredentials: (state, action) => {
      state.token = action.payload.token;
      state.userId = action.payload.userId;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.token = null;
      state.userId = null;
      state.isAuthenticated = false;
    },
  },
});

// store/slices/syncSlice.ts
const syncSlice = createSlice({
  name: 'sync',
  initialState: {
    isSyncing: false,
    pendingCount: 0,
    lastSyncAt: null,
    isOnline: true,
  },
  reducers: {
    setSyncing: (state, action) => {
      state.isSyncing = action.payload;
    },
    setPendingCount: (state, action) => {
      state.pendingCount = action.payload;
    },
    setOnlineStatus: (state, action) => {
      state.isOnline = action.payload;
    },
  },
});
```

### Camera & Quick Eval Pattern

```typescript
// screens/QuickEvalScreen.tsx
export default function QuickEvalScreen() {
  const [screenState, setScreenState] = useState<'camera' | 'preview' | 'evaluating' | 'results'>('camera');
  const [photo, setPhoto] = useState<string | null>(null);
  const [quickEval] = useQuickEvalMutation();

  const handlePhotoTaken = (uri: string) => {
    setPhoto(uri);
    setScreenState('preview');
  };

  const handleEvaluate = async () => {
    setScreenState('evaluating');
    const formData = new FormData();
    formData.append('photos', { uri: photo, ... });

    const result = await quickEval(formData).unwrap();
    setScreenState('results');
  };

  return (
    <View>
      {screenState === 'camera' && (
        <CameraView onPhotoTaken={handlePhotoTaken} />
      )}
      {screenState === 'results' && (
        <QuickEvalResults result={result} />
      )}
    </View>
  );
}
```

### Push Notifications Pattern

```typescript
// services/notificationService.ts
class NotificationService {
  async initialize(): Promise<string | null> {
    // Request permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return null;

    // Get push token
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });

    // Register token with backend
    await api.registerDeviceToken({
      token: token.data,
      platform: Platform.OS,
    });

    return token.data;
  }

  async sendToUser(userId: string, notification: Notification) {
    const tokens = await getDeviceTokens(userId);
    for (const token of tokens) {
      await expo.sendPushNotificationsAsync([{
        to: token,
        title: notification.title,
        body: notification.body,
        data: notification.data,
      }]);
    }
  }
}
```

---

## Authentication & Authorization

### JWT Authentication Flow

**Token Structure**:

```typescript
interface JwtPayload {
  userId: string;
  globalRole: 'user' | 'staff' | 'superadmin';
  currentOrgId: string;
}
```

**Backend Strategy**:

```typescript
// strategies/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.usersService.findOne(payload.userId);
    if (!user || user.disabled) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
```

### Authorization Guards

**JWT Auth Guard**:

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
```

**Org Access Guard**:

```typescript
@Injectable()
export class OrgGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const orgId = request.params.orgId || request.body.organizationId;

    const membership = await this.userOrgService.findMembership(user.id, orgId);
    if (!membership) {
      throw new ForbiddenException('Not a member of this organization');
    }

    request.organization = membership.organization;
    return true;
  }
}
```

**Admin Guard**:

```typescript
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user.globalRole !== 'superadmin' && user.globalRole !== 'staff') {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
```

### Custom Decorator Pattern

```typescript
// decorators/req-ctx.decorator.ts
export const ReqCtx = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): RequestContext => {
    const request = ctx.switchToHttp().getRequest();
    return {
      user: request.user,
      organization: request.organization,
    };
  },
);

// Usage in controller
@Get()
async list(@ReqCtx() ctx: RequestContext) {
  return this.service.list(ctx);
}
```

---

## Real-Time Architecture (WebSocket)

### Socket.IO Server Setup

**Chat Gateway**:

```typescript
@WebSocketGateway({ namespace: '/chat', cors: true })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Authenticate via token
      const token = client.handshake.auth.token;
      const payload = this.jwtService.verify(token);

      // Attach user to socket
      client.data.userId = payload.userId;
      client.data.user = await this.usersService.findOne(payload.userId);

      // Join user room
      client.join(Rooms.user(payload.userId));
    } catch (error) {
      client.disconnect();
    }
  }

  @SubscribeMessage('send_message')
  async handleMessage(client: Socket, payload: SendMessagePayload) {
    const message = await this.chatService.processMessage(
      client.data.userId,
      payload,
    );

    // Emit to session room
    this.server
      .to(Rooms.chatSession(payload.sessionId))
      .emit(SocketEvents.CHAT_MESSAGE, { message });
  }
}
```

### Event Emission Service

**Pattern**:

```typescript
@Injectable()
export class EventsService {
  constructor(
    @InjectGateway() private chatGateway: ChatGateway,
  ) {}

  emitToOrg(orgId: string, event: string, payload: any) {
    this.chatGateway.server
      .to(Rooms.org(orgId))
      .emit(event, payload);
  }

  emitToUser(userId: string, event: string, payload: any) {
    this.chatGateway.server
      .to(Rooms.user(userId))
      .emit(event, payload);
  }

  emitResearchProgress(runId: string, payload: ResearchNodeStartedPayload) {
    this.chatGateway.server
      .to(Rooms.researchRun(runId))
      .emit(SocketEvents.RESEARCH_NODE_STARTED, payload);
  }
}
```

### Frontend Socket Integration

**Socket Manager (Singleton)**:

```typescript
// socketManager.ts
class SocketManager {
  private socket: Socket | null = null;
  private refCount = 0;

  connect(token: string): Socket {
    if (!this.socket) {
      this.socket = io(WS_URL, {
        auth: { token },
        transports: ['websocket'],
      });
    }
    this.refCount++;
    return this.socket;
  }

  disconnect() {
    this.refCount--;
    if (this.refCount === 0 && this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketManager = new SocketManager();
```

**React Hook**:

```typescript
export function useSocket() {
  const token = useSelector((state) => state.auth.token);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    const s = socketManager.connect(token);
    setSocket(s);

    return () => {
      socketManager.disconnect();
    };
  }, [token]);

  return socket;
}
```

---

## Job Queues (BullMQ)

### Queue Registration

**App Module**:

```typescript
@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: configService.get('REDIS_HOST'),
        port: configService.get('REDIS_PORT'),
      },
    }),
    BullModule.registerQueue({
      name: QUEUE_AI_WORKFLOW,
    }),
    BullModule.registerQueue({
      name: QUEUE_MARKETPLACE_PUBLISH,
    }),
  ],
})
export class AppModule {}
```

### Processor Pattern

```typescript
@Processor(QUEUE_AI_WORKFLOW)
export class AiWorkflowProcessor extends WorkerHost {
  private readonly logger = new Logger(AiWorkflowProcessor.name);

  constructor(
    private researchGraphService: ResearchGraphService,
  ) {
    super();
  }

  @Process()
  async process(job: Job<StartResearchRunJob>) {
    this.logger.log(`Processing research run: ${job.data.runId}`);

    try {
      await job.updateProgress(10);

      const result = await this.researchGraphService.runResearch(job.data);

      await job.updateProgress(100);
      return result;
    } catch (error) {
      this.logger.error(`Job failed: ${error.message}`);
      throw error; // Trigger retry
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);
  }
}
```

### Adding Jobs

```typescript
@Injectable()
export class ResearchService {
  constructor(
    @InjectQueue(QUEUE_AI_WORKFLOW)
    private aiWorkflowQueue: Queue<StartResearchRunJob>,
  ) {}

  async startResearch(runId: string, runType: ResearchRunType) {
    await this.aiWorkflowQueue.add('start-research', {
      runId,
      runType,
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }
}
```

---

## AI Workflows (LangGraph)

### Research Graph Architecture

**State Definition**:

```typescript
const ResearchGraphAnnotation = Annotation.Root({
  runId: Annotation<string>(),
  itemId: Annotation<string>(),
  organizationId: Annotation<string>(),
  identifiedAs: Annotation<ProductIdentification | null>(),
  comparables: Annotation<Comparable[]>({
    reducer: (state, update) => [...state, ...update],
  }),
  pricingAnalysis: Annotation<PricingAnalysis | null>(),
  listingData: Annotation<ListingData | null>(),
  errors: Annotation<string[]>({
    reducer: (state, update) => [...state, ...update],
  }),
});
```

**Graph Builder**:

```typescript
export class ResearchGraphBuilder {
  build(): StateGraph {
    const workflow = new StateGraph(ResearchGraphAnnotation)
      // Phase 1: Context & Identification
      .addNode('loadContext', loadContextNode)
      .addNode('analyzeMedia', analyzeMediaNode)
      .addNode('extractIdentifiers', extractIdentifiersNode)

      // Phase 2: Deep Identification
      .addNode('deepIdentify', deepIdentifyNode)
      .addNode('shouldContinueIdentification', shouldContinueIdentificationRouter)

      // Phase 3: Market Research
      .addNode('searchComps', searchCompsNode)
      .addNode('analyzeComps', analyzeCompsNode)
      .addNode('calculatePrice', calculatePriceNode)

      // Phase 4: Listing Assembly
      .addNode('detectMarketplaceSchema', detectMarketplaceSchemaNode)
      .addNode('assembleListing', assembleListingNode)

      // Edges
      .addEdge('__start__', 'loadContext')
      .addEdge('loadContext', 'analyzeMedia')
      .addEdge('analyzeMedia', 'extractIdentifiers')
      .addConditionalEdges(
        'deepIdentify',
        shouldContinueIdentificationRouter,
        {
          continue: 'deepIdentify',
          proceed: 'searchComps',
        }
      )
      .addEdge('assembleListing', '__end__');

    return workflow.compile({
      checkpointer: new PostgresSaver(dataSource),
    });
  }
}
```

**Node Pattern**:

```typescript
async function deepIdentifyNode(
  state: typeof ResearchGraphAnnotation.State,
): Promise<Partial<typeof ResearchGraphAnnotation.State>> {
  const { itemId, organizationId } = state;

  // Emit progress event
  await eventsService.emitResearchProgress(state.runId, {
    node: 'deepIdentify',
    status: 'started',
  });

  try {
    const result = await openaiService.identify({
      images: state.images,
      hints: state.hints,
    });

    return {
      identifiedAs: result,
    };
  } catch (error) {
    return {
      errors: [`Deep identify failed: ${error.message}`],
    };
  }
}
```

**Router Pattern**:

```typescript
function shouldContinueIdentificationRouter(
  state: typeof ResearchGraphAnnotation.State,
): 'continue' | 'proceed' {
  if (!state.identifiedAs) {
    return 'continue';
  }

  if (state.identifiedAs.confidence < 0.9) {
    return 'continue';
  }

  return 'proceed';
}
```

---

## Error Handling

### Error Code System

**Definition** (`@listforge/api-types/src/errors.ts`):

```typescript
export enum ErrorCode {
  // Auth (401)
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',

  // Forbidden (403)
  FORBIDDEN = 'FORBIDDEN',
  ORG_ACCESS_DENIED = 'ORG_ACCESS_DENIED',

  // Not Found (404)
  NOT_FOUND = 'NOT_FOUND',
  ITEM_NOT_FOUND = 'ITEM_NOT_FOUND',

  // Validation (400)
  BAD_REQUEST = 'BAD_REQUEST',
  VALIDATION_ERROR = 'VALIDATION_ERROR',

  // Business Logic (422)
  UNPROCESSABLE = 'UNPROCESSABLE',
  LISTING_NOT_READY = 'LISTING_NOT_READY',

  // External Services (502)
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  EBAY_API_ERROR = 'EBAY_API_ERROR',

  // Server (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}
```

### Custom Exception

```typescript
export class AppException extends HttpException {
  constructor(
    public readonly errorCode: ErrorCode,
    public readonly statusCode: HttpStatus,
    message?: string,
    public readonly details?: string[],
  ) {
    super(
      {
        errorCode,
        message: message || ErrorMessages[errorCode],
        details,
      },
      statusCode,
    );
  }
}
```

### Global Exception Filter

```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('GlobalExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = ErrorCode.INTERNAL_ERROR;
    let message = 'Internal server error';
    let details: string[] | undefined;

    if (exception instanceof AppException) {
      status = exception.statusCode;
      errorCode = exception.errorCode;
      message = exception.message;
      details = exception.details;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message;
    }

    // Log full error server-side
    this.logger.error({
      errorCode,
      message,
      details,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    // Send sanitized error to client
    response.status(status).json({
      errorCode,
      message,
      details,
      timestamp: new Date().toISOString(),
    });
  }
}
```

---

## Marketplace Integrations

### Adapter Pattern

**Interface**:

```typescript
export interface MarketplaceAdapter {
  type: MarketplaceType;

  searchComps(params: SearchCompsParams): Promise<CompResult[]>;

  createListing(params: CreateListingParams): Promise<CreateListingResult>;

  syncListingStatus(listingId: string): Promise<ListingStatus>;
}
```

**eBay Implementation**:

```typescript
@Injectable()
export class EbayAdapter implements MarketplaceAdapter {
  type = 'EBAY' as const;

  constructor(
    private configService: ConfigService,
  ) {}

  async searchComps(params: SearchCompsParams): Promise<CompResult[]> {
    const ebay = new EBayApi({
      appId: this.configService.get('EBAY_APP_ID'),
      certId: this.configService.get('EBAY_CERT_ID'),
      sandbox: this.configService.get('EBAY_SANDBOX') === 'true',
    });

    const response = await ebay.buy.browse.search({
      q: params.keywords,
      limit: params.limit,
      filter: params.soldOnly ? 'conditionIds:{1000},buyingOptions:{AUCTION}' : undefined,
    });

    return response.itemSummaries.map((item) => ({
      listingId: item.itemId,
      title: item.title,
      price: parseFloat(item.price.value),
      currency: item.price.currency,
      condition: this.mapCondition(item.condition),
      soldDate: item.itemEndDate,
      url: item.itemWebUrl,
      relevanceScore: 0.8,
    }));
  }
}
```

---

## Development Workflow

### Environment Configuration

**Required Variables** (see `.env.example` in each app):

**API**:

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/listforge_dev

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your-secret-key
ENCRYPTION_KEY=generate-with-openssl-rand-hex-32

# AI
OPENAI_API_KEY=sk-your-key

# Storage (MinIO for local dev)
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET=listforge-uploads
```

**Web**:

```bash
VITE_API_URL=http://localhost:3001
```

**Mobile**:

```bash
EXPO_PUBLIC_API_URL=http://localhost:3001
EXPO_PUBLIC_WS_URL=ws://localhost:3001
```

### Starting Development

```bash
# 1. Start infrastructure
docker-compose up -d

# 2. Install dependencies
pnpm install

# 3. Run migrations
pnpm db:migrate

# 4. Start all apps
pnpm dev
```

Servers:

- API: <http://localhost:3001>
- Web: <http://localhost:3000>
- Mobile: Expo dev server (scan QR code)

### Testing on Physical Mobile Device

**Network Setup**:

1. Ensure device and computer are on same WiFi
2. Find your local IP: `ifconfig | grep "inet " | grep -v 127.0.0.1`
3. Update `apps/listforge-mobile/.env`:

   ```bash
   EXPO_PUBLIC_API_URL=http://192.168.1.XXX:3001
   EXPO_PUBLIC_WS_URL=ws://192.168.1.XXX:3001
   ```

### Database Migrations

**Create Migration**:

```bash
cd apps/listforge-api
pnpm migration:create src/migrations/AddNewField
```

**Run Migrations**:

```bash
pnpm db:migrate
```

---

## Key Architectural Decisions

### 1. Unified Item Model (Phase 6)

Replaced separate `draft` and `inventory` entities with single `Item` entity tracked by `lifecycleStatus` and `aiReviewState`.

**Rationale**: Simplified state management, eliminated data duplication, clearer lifecycle tracking.

### 2. LangGraph for AI Workflows

Chose LangGraph over custom orchestration for AI research workflows.

**Rationale**: Built-in checkpointing for resumability, standardized state management, conditional routing support.

### 3. Field-Driven Research

Research system tracks confidence and data source per field, not just at item level.

**Rationale**: Enables targeted re-research of low-confidence fields, tracks data provenance, supports adaptive research strategies.

### 4. Multi-Tenant Organization Model

All data scoped to `organizationId` with role-based access control.

**Rationale**: Supports teams/businesses, clear data isolation, flexible permission management.

### 5. Offline-First Mobile Architecture

SQLite + background sync for mobile app instead of online-only.

**Rationale**: Allows item capture in warehouses/stores with poor connectivity, better UX, reduced server load.

### 6. Type-Safe Socket Events

Centralized event definitions in `@listforge/socket-types` with type-safe payloads.

**Rationale**: Prevents runtime errors from event name typos, enforces payload structure, improves DX.

### 7. Adapter Pattern for Marketplaces

Abstraction layer for marketplace-specific implementations.

**Rationale**: Easy to add new marketplaces, consistent interface across adapters, marketplace logic isolated.

### 8. Monorepo with Shared Packages

Pnpm workspaces with shared type/utility packages.

**Rationale**: Single source of truth for types, code reuse across apps, synchronized releases.

---

## Common Patterns & Best Practices

### TypeScript

- Use strict mode (`strict: true` in tsconfig)
- Explicit return types on public functions
- Union types for status/state (`type Status = 'pending' | 'active'`)
- Avoid `any` - use `unknown` or proper types
- Interfaces for object shapes, types for unions/primitives

### Naming Conventions

- **Files**: kebab-case (`user-profile.service.ts`)
- **Classes**: PascalCase (`UserProfileService`)
- **Functions/Variables**: camelCase (`getUserProfile`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`)
- **Types/Interfaces**: PascalCase (`UserProfile`)

### Database

- UUID primary keys
- Composite indexes for filtered queries
- JSONB for nested/flexible data
- Soft deletes where appropriate
- Always filter by `organizationId` for multi-tenant data

### Error Handling

- Use `AppException` for business logic errors
- Log full errors server-side
- Return sanitized errors to client
- Use error codes, not just messages
- Include request context in logs

### Performance

- Lazy load modules in NestJS
- Use pagination for list endpoints
- Cache frequently accessed data in Redis
- Optimize database queries with indexes
- Use `SELECT` specific columns, not `SELECT *`

### Security

- Validate all user input with DTOs
- Use parameterized queries (TypeORM does this)
- Encrypt sensitive data (OAuth tokens)
- Rate limit API endpoints
- Audit log sensitive operations

---

## Quick Reference

### Common Commands

```bash
# Development
pnpm dev              # Start all apps
pnpm build            # Build all packages
pnpm type-check       # Check TypeScript
pnpm lint             # Run linters

# Database
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed data

# Mobile
cd apps/listforge-mobile
pnpm ios              # iOS simulator
pnpm android          # Android emulator
```

### Common Imports

```typescript
// Backend
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from '@listforge/core-types';
import { CreateItemDto } from '@listforge/api-types';

// Frontend
import { useSelector, useDispatch } from 'react-redux';
import { useListItemsQuery, useUpdateItemMutation } from '@listforge/api-rtk';
import { Item, LifecycleStatus } from '@listforge/core-types';

// Mobile
import { View, Text } from 'react-native';
import { useSelector } from 'react-redux';
import { useListItemsQuery } from '../services/api';
```

### File Templates

**NestJS Service**:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Entity } from './entities/entity.entity';

@Injectable()
export class FeatureService {
  private readonly logger = new Logger(FeatureService.name);

  constructor(
    @InjectRepository(Entity)
    private entityRepository: Repository<Entity>,
  ) {}

  async findAll(ctx: RequestContext): Promise<Entity[]> {
    return this.entityRepository.find({
      where: { organizationId: ctx.organization.id },
    });
  }
}
```

**React Component**:

```typescript
import { useListItemsQuery } from '@listforge/api-rtk';
import { Item } from '@listforge/core-types';

export function ItemList() {
  const { data, isLoading, error } = useListItemsQuery({
    status: 'draft',
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
```

---

**Last Updated**: 2025-12-09
**Version**: 1.0.0
