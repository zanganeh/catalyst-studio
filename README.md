# Catalyst Studio - AI Chat Application

A streamlined AI chat application built with Next.js and the Vercel AI SDK, powered by OpenRouter.

## Features

- 🤖 AI-powered chat interface
- 💬 Real-time streaming responses
- 🎨 Beautiful UI with shadcn/ui components
- ⚡ Built with Next.js 15 and React 19
- 🔄 OpenRouter integration for multiple AI models
- 🔌 **Epic 7**: Universal CMS Content Type Architecture (New!)
  - Universal type system with platform-agnostic content modeling
  - AI-powered content type generation with confidence scoring
  - Provider-based CMS integration (Optimizely, Mock, and more)
  - Automatic type transformation and validation
  - Dynamic type discovery and duplicate prevention

## Getting Started

### Epic 7 - Universal CMS Integration

Epic 7 introduces a revolutionary Universal Type System that provides platform-agnostic content modeling with AI-powered generation and validation.

#### Architecture Overview

The Universal Type System consists of three layers:
1. **Universal Types**: Platform-agnostic content definitions
2. **Provider Interface**: Abstraction layer for CMS operations
3. **Platform Providers**: CMS-specific implementations (Optimizely, Contentful, etc.)

#### Key Components

- **Type System Facade** (`lib/providers/universal/type-system.ts`): Main entry point
- **Provider Registry** (`lib/providers/universal/registry/`): Provider management
- **Transformation Engine**: Bidirectional type transformations
- **Validation System**: Confidence-based validation with 0-100% scoring
- **AI Integration**: Intelligent type generation and duplicate prevention

#### Quick Start

1. **Setup Environment**: Configure your provider in `.env.local`
   ```bash
   CMS_PROVIDER=mock  # Start with mock provider
   UNIVERSAL_TYPE_CONFIDENCE_THRESHOLD=70
   ```

2. **Generate Content Types**: Use AI-powered generation
   ```typescript
   const type = await typeSystem.generateContentType({
     category: 'page',
     purpose: 'Blog articles with rich content'
   });
   ```

3. **Transform Types**: Convert between universal and platform formats
   ```typescript
   const universal = await provider.transformToUniversal(cmsType);
   const platform = await provider.transformFromUniversal(universal);
   ```

#### Documentation

1. **Provider Development**: [Provider Development Guide](./docs/provider-development-guide.md)
2. **API Documentation**: [Provider API Patterns](./docs/api/provider-patterns.md)
3. **Transformation Examples**: [Transformation Catalog](./docs/transformation-examples-catalog.md)
4. **AI Integration**: [CLAUDE.md](./CLAUDE.md) - AI assistant guidelines
5. **Environment Setup**: [.env.example](./.env.example) - All configuration options

#### Provider Configuration

The application now uses a provider-based architecture for CMS integration:

**Environment Variables:**
```bash
# .env.local
CMS_PROVIDER=optimizely  # Options: optimizely, mock
USE_MOCK_PROVIDER=false   # Set to true for testing without real CMS

# For Optimizely provider
OPTIMIZELY_APP_KEY=your_app_key
OPTIMIZELY_SECRET=your_secret
```

**Available Providers:**
- `optimizely`: Production Optimizely CMS integration
- `mock`: Mock provider for testing and development (no credentials required)

**Provider Selection:**
The provider is selected based on the following priority:
1. `CMS_PROVIDER` environment variable
2. Fallback to `mock` if no provider is specified or on error

**Using Mock Provider:**
```bash
# Quick start with mock data (no credentials needed)
CMS_PROVIDER=mock npm run dev
```

**Switching Providers:**
Providers can be switched at runtime by updating the environment variable and restarting the application. The provider abstraction ensures all functionality works identically regardless of the selected provider.

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher (comes with Node.js)
- An OpenRouter API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/catalyst-studio.git
   cd catalyst-studio
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy the example environment file:
     ```bash
     cp .env.example .env.local
     ```
   - Update the following required variables in `.env.local`:
     ```env
     # OpenRouter Configuration (Required)
     OPENROUTER_API_KEY=sk-or-v1-your-actual-api-key-here
     
     # Optional: Specify a different AI model (defaults to Claude 3.5 Sonnet)
     OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
     
     # Database Configuration (default: SQLite)
     DATABASE_URL="file:./dev.db"
     ```

4. **Initialize the database**
   ```bash
   # Quick setup - generates client, runs migrations, and seeds data
   npm run db:setup
   
   # Or step by step:
   npm run db:generate  # Generate Prisma client
   npm run db:migrate   # Run database migrations
   npm run db:seed      # Seed with sample data
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the application**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser

### Database Setup

The application uses Prisma ORM with SQLite for development. For production, you can switch to PostgreSQL or MySQL.

#### Database Commands

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate Prisma client from schema |
| `npm run db:migrate` | Run database migrations |
| `npm run db:migrate:create` | Create a new migration without applying |
| `npm run db:migrate:deploy` | Deploy migrations (production) |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:reset` | Reset database (interactive) |
| `npm run db:fresh` | Reset and reseed database |
| `npm run db:setup` | Complete setup (generate, migrate, seed) |
| `npm run db:studio` | Open Prisma Studio (database viewer) |

#### Database Reset Options

For more control over database resets, use the reset utility:

```bash
# Interactive reset
npx tsx scripts/reset-db.ts

# Force reset with seeding
npx tsx scripts/reset-db.ts --force --seed

# Clean SQLite file only
npx tsx scripts/reset-db.ts --clean

# Reset with migrations and seeding
npx tsx scripts/reset-db.ts --migrate --seed
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENROUTER_API_KEY` | ✅ Yes | - | Your OpenRouter API key. Get one at [OpenRouter](https://openrouter.ai/keys) |
| `OPENROUTER_MODEL` | No | `anthropic/claude-3.5-sonnet` | AI model to use. See [available models](https://openrouter.ai/models) |

### Available Models

You can use any model available on OpenRouter. Popular options include:
- `anthropic/claude-3.5-sonnet` - Claude 3.5 Sonnet (default)
- `openai/gpt-4-turbo` - GPT-4 Turbo
- `google/gemini-pro` - Google Gemini Pro
- `meta-llama/llama-3-70b-instruct` - Llama 3 70B

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **UI**: shadcn/ui components
- **Styling**: Tailwind CSS
- **AI**: Vercel AI SDK with OpenRouter
- **Language**: TypeScript
- **Database**: Prisma ORM with PostgreSQL/SQLite
- **CMS Integration**: Universal Type System with provider pattern
- **Testing**: Jest, Playwright, comprehensive test coverage

## Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server

### Code Quality
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run test:e2e` - Run end-to-end tests with Playwright
- `npm run test:performance` - Run performance tests

### Database Management
- `npm run db:setup` - Complete database setup (generate, migrate, seed)
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:reset` - Reset database
- `npm run db:fresh` - Reset and reseed database
- `npm run db:studio` - Open Prisma Studio (visual database browser)

## Testing

### Epic 5 - AI-Powered Content Management Tools

The application includes comprehensive testing for AI-powered content management features:

#### Test Structure
- **Unit/Integration Tests** (`/tests/epic-5/`)
  - `ai-tools.test.ts` - POC scenario adaptations
  - `website-tools.test.ts` - Website management tool tests
  - `content-type-tools.test.ts` - Content type tool tests
  - `content-item-tools.test.ts` - Content item tool tests
  - `error-recovery.test.ts` - Error handling and rollback tests
  - `performance.test.ts` - Performance benchmarks

- **E2E Tests** (`/tests/e2e/`)
  - `epic-5-ai-tools.spec.ts` - Complete user workflows

#### Running Tests

```bash
# Run all tests
npm test

# Run Epic 5 tests only
npm test -- tests/epic-5

# Run specific test file
npm test -- ai-tools.test.ts

# Run E2E tests
npm run test:e2e

# Run performance tests
npm test -- performance.test.ts

# Generate coverage report
npm run test:coverage
```

#### Performance Benchmarks
- Simple operations: < 1 second
- Complex operations: < 2 seconds
- Context loading: < 500ms for large websites
- Bulk operations: Linear scaling

See `/docs/epic-5-testing-guide.md` for detailed testing documentation.

### Database Viewer

We recommend using **Prisma Studio** for viewing and editing your database:

```bash
npm run db:studio
```

This opens a web-based interface at `http://localhost:5555` where you can:
- Browse all tables and data
- Create, edit, and delete records
- Export data
- Run queries

Alternative desktop tools for SQLite:
- [TablePlus](https://tableplus.com/) - Modern, native tool (free tier available)
- [DBeaver](https://dbeaver.io/) - Free, open-source, cross-platform
- [SQLiteStudio](https://sqlitestudio.pl/) - Free, SQLite-specific tool

## License

This project is licensed under the **Creative Commons Attribution-NonCommercial 4.0 International License (CC BY-NC 4.0)**.

### You are free to:
- **Share** — copy and redistribute the material in any medium or format
- **Adapt** — remix, transform, and build upon the material

### Under the following terms:
- **Attribution** — You must give appropriate credit
- **NonCommercial** — You may not use the material for commercial purposes

For commercial licensing options, please contact the maintainers.

See the [LICENSE](LICENSE) file for the full license text.