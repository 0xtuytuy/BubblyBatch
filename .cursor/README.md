# Cursor AI Rules for BubblyBatch

This folder contains AI assistant rules that help maintain consistency and quality across the BubblyBatch project.

## 📁 Files

| File | Purpose | When to Reference |
|------|---------|-------------------|
| **[rules.md](./rules.md)** | Main entry point with project overview, tech stack, and general guidelines | Start here for project context |
| **[backend.md](./backend.md)** | Backend patterns: Lambda handlers, Zod validation, DynamoDB single-table design | Working on API endpoints, services, or database queries |
| **[frontend.md](./frontend.md)** | Frontend patterns: Expo Router, NativeWind styling, React Native components | Building UI screens, components, or navigation |
| **[infra.md](./infra.md)** | Infrastructure patterns: SST stacks, AWS resources, IAM policies | Modifying infrastructure or adding AWS resources |

## 🎯 How Cursor Uses These Rules

Cursor AI automatically reads files in the `.cursor` folder to understand your project's conventions. These rules help the AI:

1. **Match your coding style** - Follow established patterns for consistency
2. **Use the right tools** - Know when to use Zod vs manual validation, NativeWind vs inline styles
3. **Follow best practices** - Security, performance, and maintainability guidelines
4. **Understand architecture** - Service layers, single-table design, file-based routing
5. **Write better commits** - Gitmoji style with clear descriptions

## 🚀 Quick Start

### For AI Assistants

When starting work on BubblyBatch:
1. Read `rules.md` for project context
2. Reference the relevant topic file (`backend.md`, `frontend.md`, or `infra.md`)
3. Follow the patterns and conventions described
4. When in doubt, check existing code for examples

### For Developers

These rules are also useful for:
- **Onboarding** - Quick reference for project conventions
- **Code reviews** - Ensure consistency across the codebase
- **Documentation** - Single source of truth for patterns
- **Decision making** - Understand the "why" behind architectural choices

## 🎨 What's Covered

### General (rules.md)
- Tech stack overview
- Monorepo structure
- Gitmoji commit conventions
- TypeScript guidelines
- Testing approach
- Security guidelines

### Backend (backend.md)
- Handler → Service → Data layer architecture
- Zod validation patterns
- Response utilities
- DynamoDB single-table design
- AWS SDK v3 usage
- Error handling
- IAM permissions

### Frontend (frontend.md)
- Expo Router navigation
- NativeWind/TailwindCSS styling
- Component patterns
- State management
- API integration
- TypeScript conventions
- Lists and ScrollViews

### Infrastructure (infra.md)
- SST stack organization
- IAM roles and policies
- DynamoDB configuration
- S3 bucket security
- Lambda configuration
- API Gateway setup
- Cognito authentication
- Resource naming conventions

## 📝 Maintaining These Rules

As the project evolves, update these rules to reflect:
- New architectural patterns
- Updated dependencies
- Lessons learned
- Team decisions

Keep rules:
- **Concise** - Guidelines, not exhaustive documentation
- **Practical** - Include code examples
- **Current** - Update when patterns change
- **Helpful** - Explain the "why" behind decisions

## 🤝 Contributing

When you establish a new pattern or convention:
1. Update the relevant rule file
2. Add code examples
3. Explain the reasoning
4. Keep it consistent with existing rules

## 💡 Tips for AI Assistants

- **Read before writing** - Check existing code patterns first
- **Follow, don't fight** - Match established conventions
- **Ask when unclear** - Better to clarify than assume
- **Suggest improvements** - But respect that this is a solo MVP
- **Keep it simple** - Avoid over-engineering

---

**Last Updated:** January 2026

**Project Status:** Active Development (Solo Project)

**Maintainer:** See main README.md

