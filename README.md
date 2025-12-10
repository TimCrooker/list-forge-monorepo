# ListForge

**AI-powered listing automation for resellers** – Capture product photos, let AI handle research and listing creation across multiple marketplaces.

<p align="center">
  <strong>📸 Capture</strong> → <strong>🤖 AI Research</strong> → <strong>💰 List & Sell</strong>
</p>

---

## 🌟 What is ListForge?

ListForge streamlines the entire reselling workflow using AI:

1. **Capture**: Take photos of items with your phone
2. **AI Analysis**: Automatic product identification via image recognition and OCR
3. **Smart Research**: AI-powered pricing research across Amazon, eBay, and more
4. **AI Chat Assistant**: Natural language interface to review, edit, and optimize listings
5. **Multi-Marketplace Publishing**: One-click publishing to eBay, Amazon, and other platforms
6. **Automated Workflows**: Let AI handle the tedious work while you focus on sourcing

Perfect for resellers, liquidators, thrift store owners, and anyone managing inventory across marketplaces.

---

## ✨ Key Features

### 🤖 AI-Powered Research
- **Product Identification**: Image analysis with OCR to extract UPC, model numbers, and identifiers
- **Web Search Integration**: Deep product research using AI-powered web search
- **Amazon Price Intelligence**: Historical pricing via Keepa API (90+ day trends, BSR tracking)
- **Competitive Analysis**: Find comparable listings across marketplaces
- **Smart Pricing**: AI-recommended pricing based on market data and condition
- **Category Detection**: Automatic marketplace category and schema detection

### 💬 AI Chat Assistant
- **Conversational Interface**: Natural language chat to manage items and listings
- **Context-Aware**: Understands what item you're working on
- **Action Tools**: Execute actions like "research this item" or "update the price"
- **Review & Optimize**: Ask AI to improve titles, descriptions, and attributes
- **Research Summaries**: Get AI-generated insights from research data

### 🛒 Marketplace Integrations
- **eBay**: Full OAuth integration, listing creation, sold listings research
- **Amazon**: SP-API support for catalog access and real-time data
- **Extensible**: Built-in adapter pattern for adding new marketplaces

### 📊 Research Workflows
- **LangGraph-Powered**: Sophisticated AI workflows using LangGraph for orchestration
- **Multi-Stage Pipeline**:
  - Deep identification (web search + image analysis)
  - Comparable product search
  - Price analysis and recommendations
  - Listing assembly with marketplace-specific schemas
- **Real-Time Progress**: Live updates via WebSocket as research progresses
- **Quality Validation**: Confidence scoring and missing field detection

### 📱 Modern Tech Stack
- **Backend**: NestJS with TypeORM, BullMQ job queues, Redis caching
- **Frontend**: React + Vite with Redux Toolkit, TanStack Router, ShadCN UI
- **AI/ML**: OpenAI GPT-4o for vision, chat, and analysis
- **Real-Time**: Socket.io for live updates and chat
- **Multi-Tenant**: Organization-based architecture with role management

---

## 📚 Documentation

### Getting Started
- **[Setup Guide](#getting-started)** - Initial setup and configuration
- **[eBay Integration](./docs/EBAY_SETUP.md)** - Complete eBay OAuth setup guide
- **[Amazon Integration](./docs/AMAZON_SETUP.md)** - Keepa + Amazon SP-API setup
- **[Admin Access](./docs/ADMIN_ACCESS.md)** - ListForge employee admin access
- **[Mobile Web Guide](./docs/MOBILE_WEB.md)** - Mobile browser optimization
- **[Mobile App Spec](./docs/MOBILE_APP_SPEC.md)** - Native app specification

### Deployment
- **[Production Deployment](./docs/DEPLOYMENT.md)** - Deploy to production (Vercel, AWS, etc.)
- **[Local Storage Setup](./docs/LOCAL_STORAGE_SETUP.md)** - Use MinIO for local development

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **pnpm** 8+
- **Docker** & Docker Compose (for local Postgres/Redis)
- **OpenAI API Key** (for AI features)

### Quick Start

1. **Clone and install**:
   ```bash
   git clone <your-repo-url>
   cd list-forge-monorepo
   pnpm install
   ```

2. **Start infrastructure** (Postgres + Redis):
   ```bash
   docker-compose up -d
   ```

3. **Configure environment**:
   ```bash
   # API configuration
   cp apps/listforge-api/.env.example apps/listforge-api/.env

   # Web configuration
   cp apps/listforge-web/.env.example apps/listforge-web/.env
   ```

4. **Set required environment variables** in `apps/listforge-api/.env`:
   ```bash
   # Database (auto-configured if using docker-compose)
   DATABASE_URL=postgresql://listforge:listforge@localhost:5432/listforge_dev

   # Redis (required for job queues)
   REDIS_URL=redis://localhost:6379

   # Auth
   JWT_SECRET=your-secret-key-here
   ENCRYPTION_KEY=generate-with-openssl-rand-hex-32

   # AI (required for research features)
   OPENAI_API_KEY=sk-your-openai-api-key

   # Storage (for local dev, use MinIO - see docs/LOCAL_STORAGE_SETUP.md)
   S3_ENDPOINT=http://localhost:9000
   S3_ACCESS_KEY_ID=minioadmin
   S3_SECRET_ACCESS_KEY=minioadmin
   S3_BUCKET=listforge-uploads
   ```

5. **Run database migrations**:
   ```bash
   pnpm db:migrate
   ```

6. **Start development servers**:
   ```bash
   pnpm dev
   ```

   This starts:
   - 🔧 API server at `http://localhost:3001`
   - 🌐 Web app at `http://localhost:3000`

7. **Create your first account**:
   - Navigate to `http://localhost:3000`
   - Sign up with email/password
   - Start capturing items!

---

## 🔧 Architecture

This is a Turborepo monorepo with shared packages and multiple applications.

### Applications

- **`apps/listforge-api`** - NestJS backend
  - REST API with Passport.js JWT authentication
  - TypeORM with PostgreSQL for data persistence
  - BullMQ job queues for async processing
  - Socket.io for real-time updates
  - LangGraph workflows for AI research
  - Multi-tenant organization architecture

- **`apps/listforge-web`** - React frontend
  - Vite build system for fast development
  - Redux Toolkit + RTK Query for state management
  - TanStack Router for type-safe routing
  - ShadCN UI components with Tailwind CSS
  - Socket.io client for real-time features

### Shared Packages

- **`@listforge/ui`** - Shared UI components (ShadCN-wrapped)
- **`@listforge/core-types`** - Domain types and interfaces
- **`@listforge/api-types`** - API request/response DTOs
- **`@listforge/api-client`** - Node.js fetch wrapper
- **`@listforge/api-rtk`** - RTK Query API slice
- **`@listforge/queue-types`** - BullMQ job type definitions
- **`@listforge/socket-types`** - Socket.io event types
- **`@listforge/marketplace-adapters`** - Marketplace integration adapters
- **`@listforge/config`** - Shared configs (ESLint, TypeScript, Tailwind)

### Project Structure

```
listforge/
├── apps/
│   ├── listforge-api/           # NestJS backend
│   │   ├── src/
│   │   │   ├── ai-workflows/    # LangGraph research workflows
│   │   │   ├── chat/            # AI chat assistant
│   │   │   ├── items/           # Item management
│   │   │   ├── research/        # Research orchestration
│   │   │   ├── marketplaces/    # Marketplace integrations
│   │   │   ├── organizations/   # Multi-tenant org management
│   │   │   └── auth/            # Authentication & authorization
│   │   └── .env.example
│   │
│   └── listforge-web/           # React frontend
│       ├── src/
│       │   ├── routes/          # TanStack Router pages
│       │   ├── components/      # React components
│       │   ├── store/           # Redux store
│       │   └── hooks/           # Custom React hooks
│       └── .env.example
│
├── packages/
│   ├── ui/                      # Shared UI components
│   ├── core-types/              # Domain types
│   ├── api-types/               # API types
│   ├── api-rtk/                 # RTK Query
│   ├── marketplace-adapters/    # Marketplace integrations
│   └── config/                  # Shared configs
│
└── docs/                        # Documentation
    ├── EBAY_SETUP.md
    ├── AMAZON_SETUP.md
    ├── AWS_SETUP.md
    └── ...
```

---

## 📦 Available Scripts

### Monorepo Commands

```bash
# Development
pnpm dev              # Run all apps in development mode
pnpm build            # Build all packages and apps for production
pnpm lint             # Lint entire monorepo
pnpm type-check       # Type check all TypeScript packages
pnpm clean            # Clean all build artifacts

# Database
pnpm db:migrate       # Run TypeORM migrations
pnpm db:seed          # Seed development data

# Individual apps
pnpm --filter listforge-api dev     # Run API only
pnpm --filter listforge-web dev     # Run web app only
```

### Backend-Specific Commands

```bash
cd apps/listforge-api

# Database
pnpm db:migrate              # Run migrations
pnpm db:migration:create     # Create new migration
pnpm db:migration:revert     # Revert last migration

# CLI Tools
pnpm cli:rotate-keys         # Rotate encryption keys
pnpm cli:admin               # Admin utilities (see code)

# Build & Deploy
pnpm build                   # Build for production
pnpm start:prod              # Start production server
```

---

## 🔌 Marketplace Integration Setup

### eBay
See **[eBay Setup Guide](./docs/EBAY_SETUP.md)** for complete instructions.

**Quick setup:**
1. Create eBay developer account
2. Get App ID and Cert ID from developer portal
3. Add to `.env`:
   ```bash
   EBAY_APP_ID=your-app-id
   EBAY_CERT_ID=your-cert-id
   EBAY_SANDBOX=true  # Use sandbox for testing
   ```
4. Connect via UI at `/settings/marketplaces`

### Amazon Research (Keepa)
See **[Amazon Setup Guide](./docs/AMAZON_SETUP.md)** for complete instructions.

**Recommended setup (Keepa only):**
1. Sign up at [Keepa.com](https://keepa.com)
2. Purchase API access
3. Add to `.env`:
   ```bash
   KEEPA_API_KEY=your-keepa-api-key
   ```

This provides:
- ✅ Historical Amazon pricing (90+ days)
- ✅ Sales rank (BSR) trends
- ✅ UPC to ASIN lookups
- ✅ Price statistics and recommendations

**Optional: Amazon SP-API** for real-time catalog data (more complex setup - see docs).

---

## 🤖 AI Features & Configuration

### Required: OpenAI API

All AI features require an OpenAI API key:

```bash
OPENAI_API_KEY=sk-your-api-key-here
```

**Used for:**
- 📸 Image analysis and OCR (product identification)
- 💬 AI chat assistant
- 🔍 Web search and product research
- 📝 Listing optimization and text generation

**Cost estimates:** ~$0.10-0.50 per item researched (varies with image count and research depth)

### Optional: Enhanced Research

```bash
# Keepa - Amazon price history
KEEPA_API_KEY=your-key

# UPC Database - Barcode lookups
UPC_DATABASE_API_KEY=your-key

# Amazon SP-API - Real-time catalog
AMAZON_CLIENT_ID=your-client-id
AMAZON_CLIENT_SECRET=your-secret
# ... (see docs/AMAZON_SETUP.md)
```

---

## 🧪 Development Tips

### Local Development with MinIO (S3 Alternative)

Instead of AWS S3, use MinIO for local file storage:

```bash
# Already configured in docker-compose.yml
docker-compose up -d minio

# Add to .env
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET=listforge-uploads
```

See **[Local Storage Setup](./docs/LOCAL_STORAGE_SETUP.md)** for details.

### Testing Marketplace Integrations

Both eBay and Amazon offer sandbox/test environments:

- **eBay Sandbox**: Set `EBAY_SANDBOX=true`
- **Amazon**: Use test credentials during development

Always test in sandbox before using production credentials.

### Debugging AI Workflows

Enable detailed logging for AI workflows:

```bash
# In .env
LOG_LEVEL=debug
```

Watch the console for:
- LangGraph node execution
- AI model calls and token usage
- Research progress updates
- Tool invocations

### Working with the Chat Assistant

The AI chat assistant is context-aware:

1. Navigate to an item's detail page
2. Open the chat panel
3. Ask questions like:
   - "Research this item"
   - "What's the best price?"
   - "Improve the title"
   - "Show me the comparable listings"

The assistant has access to tools that can read and modify items, run research, and more.

---

## 🔐 Security Notes

### Required for Production

1. **Change default secrets**:
   ```bash
   # Generate strong secrets
   openssl rand -base64 32  # For JWT_SECRET
   openssl rand -hex 32     # For ENCRYPTION_KEY
   ```

2. **Never commit `.env` files** - Already in `.gitignore`

3. **Encryption key rotation**: Use `pnpm cli:rotate-keys` for secure key rotation

4. **Marketplace credentials**:
   - Store in secure vault (AWS Secrets Manager, Vault, etc.)
   - Use different credentials for dev/staging/prod
   - Enable IP whitelisting where possible

5. **HTTPS only in production** - Configure SSL/TLS properly

See **[Deployment Guide](./docs/DEPLOYMENT.md)** for production security checklist.

---

## 🤝 Contributing

This is a private project, but contributions from team members are welcome!

### Development Workflow

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes with meaningful commits
3. Test thoroughly (unit tests + manual testing)
4. Update documentation if needed
5. Submit a pull request

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Run `pnpm lint` before committing
- **Prettier**: Formatting enforced via ESLint
- **Imports**: Use absolute imports with `@/` prefix

### Adding Dependencies

```bash
# Workspace dependencies
pnpm add <package> -w

# App-specific dependencies
pnpm add <package> --filter listforge-api
pnpm add <package> --filter listforge-web

# Shared package dependencies
pnpm add <package> --filter @listforge/ui
```

---

## 📝 License

Private - All Rights Reserved

---

## 🆘 Support & Resources

### Common Issues

**"Cannot connect to database"**
- Ensure Docker containers are running: `docker-compose ps`
- Check DATABASE_URL in `.env`

**"OPENAI_API_KEY not configured"**
- Add your OpenAI API key to `apps/listforge-api/.env`
- Restart the API server

**"Redis connection failed"**
- Ensure Redis is running: `docker-compose up -d redis`
- Check REDIS_URL in `.env`

**"eBay OAuth redirect mismatch"**
- See [eBay Setup Guide](./docs/EBAY_SETUP.md) troubleshooting section
- Verify redirect URI matches exactly in eBay Developer Portal

### Documentation

- 📖 [eBay Integration Guide](./docs/EBAY_SETUP.md)
- 📖 [Amazon & Research Setup](./docs/AMAZON_SETUP.md)
- 📖 [Admin Access Guide](./docs/ADMIN_ACCESS.md)
- 📖 [Mobile Web Guide](./docs/MOBILE_WEB.md) 📱 Touch-optimized
- 📖 [Production Deployment](./docs/DEPLOYMENT.md)
- 📖 [Local Storage (MinIO)](./docs/LOCAL_STORAGE_SETUP.md)
- 📖 [Mobile App Spec](./docs/MOBILE_APP_SPEC.md) ⚠️ Planning doc

### External Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [React Documentation](https://react.dev/)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [eBay API Documentation](https://developer.ebay.com/docs)
- [Keepa API Documentation](https://keepa.com/#!discuss/t/product-data-api-documentation/1)

---

<p align="center">
  Built with ❤️ for resellers everywhere
</p>
