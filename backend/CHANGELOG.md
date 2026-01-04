# Changelog

All notable changes to the Kefir Backend will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-01-04

### Added

#### Core Infrastructure
- Serverless Framework configuration with AWS Lambda and API Gateway
- DynamoDB single-table design for all entities
- S3 bucket for photo storage with presigned URLs
- Cognito User Pool with passwordless email OTP authentication
- EventBridge Scheduler for reminder notifications
- TypeScript with strict mode enabled
- ESLint and Prettier for code quality

#### Batch Management
- Create, read, update, and delete batches
- Two-stage batch lifecycle (stage1_open, stage2_bottled)
- Four batch statuses (active, in_fridge, ready, archived)
- Support for batch parameters (temperature, sugar, duration)
- Public batch sharing with optional public notes
- Photo upload via S3 presigned URLs
- Batch filtering by stage and status

#### Event Logging
- Create and list events for batches
- Five event types (stage_change, observation, photo_added, status_change, note)
- Timestamp-based event ordering
- Optional photo attachments
- Flexible metadata field for event-specific data

#### Reminder System
- AI-powered reminder suggestions based on batch parameters
- EventBridge Scheduler integration for reliable delivery
- User confirmation before scheduling
- List upcoming reminders
- Cancel scheduled reminders
- Different suggestion types (midpoint, completion, refrigeration)

#### User & Device Management
- Auto-create user records on first API access
- Device registration for push notifications
- Support for iOS (APNS) and Android (FCM) platforms
- Device activity tracking
- Unregister devices

#### Data Export
- CSV export of all user data
- Single file with recordType column
- Includes batches, events, reminders, and devices
- Automatic flattening of nested objects

#### Public API
- No-auth endpoint for viewing public batches
- Returns only safe public information
- 403 Forbidden for non-public batches

#### Local Development
- Serverless Offline integration
- Mock AWS services (DynamoDB, S3, EventBridge)
- Seed data for testing
- In-memory storage for rapid development

#### Documentation
- Comprehensive README
- API documentation with examples
- Deployment guide
- Local development guide
- Architecture diagrams in plan document

### Technical Details

#### Database Design
- Single DynamoDB table with composite keys (PK, SK)
- GSI1 for batch lookups by ID
- Optimized access patterns for all queries
- No N+1 query problems

#### Lambda Functions
- Domain-based organization (6 functions)
- Shared libraries for DynamoDB, S3, Auth, and Scheduler
- Consistent error handling
- Type-safe validation with Zod
- Structured logging

#### Security
- JWT authorization via API Gateway
- Row-level security (users can only access their own data)
- S3 bucket with public access blocks
- IAM roles with least privilege
- Presigned URLs for client-side uploads

#### Error Handling
- Custom error classes for different scenarios
- Consistent error response format
- Validation error details with field-level information
- CloudWatch logging for debugging

#### Code Quality
- TypeScript strict mode
- Zod schemas for runtime validation
- ESLint for code linting
- Prettier for code formatting
- Consistent naming conventions

### AWS Resources Created
- 6 Lambda functions
- 1 DynamoDB table with GSI
- 1 S3 bucket with lifecycle policies
- 1 Cognito User Pool with client
- 1 EventBridge Scheduler group
- 1 HTTP API Gateway with JWT authorizer
- Multiple IAM roles and policies
- CloudWatch log groups

### Known Limitations
- Push notifications not yet implemented (placeholder Lambda only)
- No batch templates
- No user preferences/settings
- No batch sharing with other users
- No batch comments/collaboration
- CSV export limited to 60-second Lambda timeout
- No batch analytics or statistics
- No image processing or thumbnails
- No real-time updates (websockets)

### Performance Considerations
- DynamoDB on-demand pricing (scales automatically)
- Lambda cold starts (~1-2 seconds for TypeScript)
- S3 presigned URLs expire after 1 hour
- EventBridge Scheduler has ~15 second accuracy
- API Gateway has 29-second timeout

### Future Enhancements
- [ ] Implement push notification delivery
- [ ] Add batch templates
- [ ] User preferences and settings
- [ ] Share batches with specific users
- [ ] Batch analytics dashboard
- [ ] Image thumbnails and processing
- [ ] WebSocket support for real-time updates
- [ ] Batch comparison features
- [ ] Recipe recommendations
- [ ] Community features
- [ ] Mobile app integration
- [ ] Multi-language support
- [ ] Advanced filtering and search
- [ ] Batch insights and tips
- [ ] Integration with IoT devices (temperature sensors)

## Version History

- **0.1.0** - Initial release with core functionality

