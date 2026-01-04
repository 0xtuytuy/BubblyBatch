# BubblyBatch - Cursor AI Rules

> Main entry point for AI assistants working on the BubblyBatch kefir batch tracking app.

## 🎯 Project Overview

**BubblyBatch** is a mobile-first kefir fermentation tracking application that helps users manage their water kefir batches through two fermentation stages, set reminders, and share batches via QR codes.

### Key Features
- Track kefir batches through Stage 1 (open container) and Stage 2 (hermetic bottle)
- Automated reminders for fermentation milestones
- Photo uploads and batch history
- Public QR code sharing
- CSV data export

## 📚 Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React Native (Expo 54), Expo Router, NativeWind 4, TailwindCSS 4, AWS Amplify 6 |
| **Backend** | Serverless Framework 3, TypeScript 5.3, Node.js 20, Zod 3 |
| **Infrastructure** | SST (Pulumi), AWS Lambda, DynamoDB, S3, Cognito, EventBridge |
| **Database** | DynamoDB single-table design |

## 📂 Monorepo Structure

```
BubblyBatch/
├── backend/          # Serverless backend (Lambda functions)
├── frontend/         # React Native mobile app (Expo)
├── infra/           # SST infrastructure as code (Pulumi)
└── .cursor/         # AI assistant rules (you are here)
```

## 🔗 Topic-Specific Rules

For detailed conventions in specific areas, see:
- **[Backend Rules](./backend.md)** - Lambda handlers, Zod validation, DynamoDB patterns
- **[Frontend Rules](./frontend.md)** - Expo components, NativeWind styling, routing
- **[Infrastructure Rules](./infra.md)** - SST stacks, AWS resources, IAM policies

## 🎨 Coding Conventions

### TypeScript
- Use TypeScript strict mode (`strict: true`)
- Prefer explicit return types for exported functions
- Use `type` for object shapes, `interface` for extensible contracts
- Avoid `any` - use `unknown` if type is truly unknown

### Naming Conventions
- **Files**: `kebab-case.ts` or `PascalCase.tsx` (components)
- **Functions**: `camelCase`
- **Types/Interfaces**: `PascalCase`
- **Constants**: `SCREAMING_SNAKE_CASE` (if truly constant)
- **Components**: `PascalCase`

### Code Organization
- Keep files under 300 lines when possible
- Extract complex logic into separate utility functions
- Use service layer pattern (handler → service → db/external APIs)
- Group related code in folders by feature, not by type

### Error Handling
- Use existing error utilities in `backend/src/utils/errors.ts`
- Always catch and log errors appropriately
- Return user-friendly error messages
- Don't expose internal details in error responses

### Documentation
- Use JSDoc for public API functions
- Add inline comments for complex business logic
- Keep comments up-to-date when code changes
- Document "why" not "what" (code shows what)

## 💾 Git Workflow

### Commit Messages (Gitmoji Style)

Use emojis to categorize commits, followed by a clear description:

```
✨ Add batch reminder notifications
🐛 Fix photo upload presigned URL expiration
🚀 Deploy production environment
📝 Update API documentation
♻️ Refactor DynamoDB query builders
✅ Add batch service unit tests
🔧 Update serverless configuration
💄 Improve batch list UI styling
🔒 Add IAM policy for S3 access
⚡️ Optimize batch list query performance
🌐 Add internationalization support
🗃️ Update DynamoDB table schema
📦 Update dependencies
```

**Common Gitmoji Categories:**
- ✨ `:sparkles:` - New feature
- 🐛 `:bug:` - Bug fix
- 🚀 `:rocket:` - Deployment
- 📝 `:memo:` - Documentation
- ♻️ `:recycle:` - Refactoring
- ✅ `:white_check_mark:` - Tests
- 🔧 `:wrench:` - Configuration
- 💄 `:lipstick:` - UI/styling
- 🔒 `:lock:` - Security
- ⚡️ `:zap:` - Performance
- 🌐 `:globe_with_meridians:` - i18n
- 🗃️ `:card_file_box:` - Database
- 📦 `:package:` - Dependencies

### Branch Strategy
- `main` - Production-ready code
- `dev` - Development branch (default)
- `feature/*` - Feature branches
- `fix/*` - Bug fix branches

## 🧪 Testing Approach

| Layer | Current Approach | Future Goal |
|-------|-----------------|-------------|
| Backend | Manual testing, Jest unit tests planned | Jest + integration tests |
| Frontend | Manual testing via Expo Go | Jest + React Native Testing Library |
| E2E | None yet | Detox or Maestro |

When writing tests:
- Test behavior, not implementation
- Use descriptive test names: `it('should create batch with valid data')`
- Mock external dependencies (AWS services, etc.)
- Prefer integration tests over unit tests where practical

## 🔐 Security Guidelines

- **Never** commit secrets, API keys, or credentials
- Use environment variables for all config
- Validate all user inputs with Zod schemas
- Use IAM least privilege principle
- Enable CloudWatch logging for all Lambdas
- Sanitize logs (no PII or sensitive data)

## 🎯 Development Priorities

### Current Focus
- Core batch tracking features
- Reminder system with push notifications
- Photo upload and management
- Public batch sharing via QR codes

### Quality Standards
- Type-safe code with minimal `any` usage
- DRY principle - reuse utilities and components
- Responsive mobile UI with proper loading states
- Graceful error handling with user feedback

## 📱 Mobile Development Notes

- Target iOS and Android (Expo managed workflow)
- Use Expo Go for development
- Support dark mode (future enhancement)
- Optimize for various screen sizes
- Handle offline scenarios gracefully

## ☁️ AWS Resource Naming

Follow this pattern for consistency:
```
kefir-app-{stage}-{resource-name}
```

Examples:
- `kefir-app-dev-handleBatches`
- `kefir-app-prod-photos-bucket`
- `kefir-app-dev-batches-table`

## 🤝 General Guidelines for AI Assistants

1. **Read existing code first** - Understand patterns before suggesting changes
2. **Follow established patterns** - Match the style and architecture already in use
3. **Ask clarifying questions** - When requirements are ambiguous
4. **Suggest improvements** - But respect that this is a solo project in development
5. **Keep it simple** - Avoid over-engineering for a solo MVP
6. **Test your changes** - Verify code compiles and follows patterns
7. **Document decisions** - Especially architectural changes
8. **Never run local dev servers** - See below ⚠️

## ⚠️ CRITICAL: Do Not Run Local Development Servers

**AI Assistants must NEVER run local development servers or deployment commands!**

### What NOT to Do:
- ❌ `npm start` / `expo start` (frontend)
- ❌ `npm run dev` / `serverless offline` (backend)
- ❌ `sst dev` / `sst deploy` (infrastructure)
- ❌ Starting simulators or emulators
- ❌ Deploying to AWS without explicit permission

### What TO Do Instead:
- ✅ Ask the user to start the dev server
- ✅ Provide clear instructions on which commands to run
- ✅ Explain what needs to be tested
- ✅ Wait for user to confirm the server is running

**Why?**
- Local servers require specific environment setup
- May need AWS credentials, secrets, or API keys
- Can conflict with user's running processes
- Deployment has cost implications
- User should control when/how services start

**Example Response:**
```
I've made changes to the batch handler. To test these:

1. In the backend directory, run:
   npm run dev

2. The API will be available at http://localhost:3000

3. Test with: curl http://localhost:3000/batches
```

## 📊 Project Status

This is a **solo project in active development**. Some areas are work-in-progress:
- ✅ Core architecture defined
- ✅ Backend API structure in place
- ✅ Frontend component patterns established
- 🚧 Authentication flow (Cognito)
- 🚧 Reminder scheduling (EventBridge)
- 🚧 Photo upload to S3
- 📝 Testing infrastructure (planned)
- 📝 CI/CD pipeline (planned)

---

**Remember:** These are **guidelines**, not strict rules. Use your judgment, and when in doubt, favor simplicity and maintainability over cleverness.

