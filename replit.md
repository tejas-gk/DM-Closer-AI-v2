# replit.md

## Overview

DMCloser AI is a comprehensive Instagram DM automation SaaS platform built with React, Express, and Supabase. The application helps businesses automate their direct message responses using AI while maintaining brand voice consistency. The platform features a professional dashboard-centric design with subscription management, AI response generation, and conversation management capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React 18.3.1 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state
- **UI Framework**: Radix UI primitives with Tailwind CSS and shadcn/ui components
- **Build Tool**: Vite with ESBuild for production bundling
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js 20 with TypeScript
- **Framework**: Express.js with custom middleware
- **Authentication**: Supabase Auth with session management
- **Database**: Supabase PostgreSQL with Row Level Security
- **API Design**: RESTful endpoints with JSON responses
- **Build System**: ESBuild for server bundling

### Data Storage Solutions
- **Primary Database**: Supabase PostgreSQL with automated migrations
- **Schema Management**: Drizzle ORM with TypeScript schema definitions
- **File Storage**: Supabase Storage for avatar images and attachments
- **Session Storage**: Supabase Auth handles session persistence
- **Cache Strategy**: In-memory storage for usage quotas and real-time data

## Key Components

### Authentication System
- Email/password authentication via Supabase Auth
- User profile management with automatic profile creation triggers
- Row-level security policies for data isolation
- Session persistence and automatic token refresh

### AI Response Engine
- OpenAI GPT-4 integration for intelligent response generation
- Multiple tone configurations (friendly, professional, casual, girlfriend_experience)
- Business profile integration (fitlife_coaching, onlyfans_model, product_sales)
- Conversation context awareness and history preservation
- Custom instruction support for business-specific AI training
- Auto-reply toggle functionality per conversation

### Subscription Management
- Stripe integration with checkout sessions and billing portal
- Four pricing tiers: Starter (€39), Pro (€79), Agency (€199), Flex (€0.049/reply)
- Interactive Flex plan with slider for 5,000-50,000 replies
- 7-day free trial system using Stripe's trial_period_days
- Usage quota tracking and billing cycle management
- Webhook handlers for subscription lifecycle events

### Conversation Management
- Real-time conversation interface with Instagram-style threading
- Message status tracking (read/unread, AI/manual, pending)
- Search and filtering capabilities across conversations
- Manual override capabilities for AI-generated responses

### Dashboard Analytics
- Usage tracking and quota monitoring
- Response quality metrics and performance trends
- Customer engagement analytics
- Visual data representation with Recharts

## Data Flow

### User Authentication Flow
1. User signs up/logs in through Supabase Auth
2. Profile automatically created via database trigger
3. Session established with JWT token
4. Row-level security enforces data access control

### AI Response Generation Flow
1. User selects conversation requiring response
2. System analyzes conversation context and history
3. OpenAI API generates response based on configured tone
4. User can preview, edit, or send AI-generated response
5. Usage quota updated and billing tracked

### Subscription Flow
1. User selects pricing plan on membership page
2. Stripe checkout session created with 7-day trial
3. Successful payment triggers profile update with subscription data
4. Billing portal provides self-service subscription management

## External Dependencies

### Core Services
- **Supabase**: Authentication, database, and file storage
- **Stripe**: Payment processing and subscription management
- **OpenAI**: AI response generation via GPT-4 API
- **Resend**: Transactional email delivery

### Development Tools
- **Replit**: Development environment and deployment platform
- **Playwright**: End-to-end testing framework
- **Jest/Vitest**: Unit and integration testing
- **ESLint/Prettier**: Code formatting and linting

### UI Libraries
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling framework
- **Lucide React**: Icon library
- **Recharts**: Data visualization components

## Deployment Strategy

### Production Environment
- **Platform**: Replit Autoscale deployment
- **Build Process**: Vite builds frontend to `dist/public`, ESBuild bundles server
- **Environment Variables**: Managed through Replit secrets
- **Port Configuration**: Internal port 5000, external port 80
- **Process Management**: Single Node.js process serving both API and static files

### Development Environment
- **Hot Reload**: Vite dev server with HMR for frontend changes
- **API Proxy**: Express server runs alongside Vite dev server
- **Database**: Supabase cloud instance with local CLI tools
- **Testing**: Jest for unit tests, Playwright for E2E testing

### Environment Configuration
- **Development**: `npm run dev` starts both frontend and backend in parallel
- **Production**: `npm run build` creates optimized bundles, `npm run start` serves production build
- **Database Migrations**: Supabase CLI manages schema changes

## Instagram API Implementation Guide

### Instagram Platform Overview
The Instagram Platform provides two API configurations:
1. **Instagram API with Facebook Login** - For accounts linked to Facebook Pages
2. **Instagram API with Business Login** - For Instagram-only professional accounts

### Key Authentication Components
- **Access Levels**: Standard Access (for own accounts) vs Advanced Access (for third-party accounts requiring App Review)
- **Token Flow**: Authorization Code → Short-lived Access Token (1 hour) → Long-lived Access Token (60 days)
- **Base URLs**: `graph.instagram.com` (Instagram Login) or `graph.facebook.com` (Facebook Login)

### Required Permissions
- `instagram_business_basic` - Basic account access
- `instagram_business_manage_messages` - Send/receive messages
- `instagram_business_content_publish` - Content publishing
- `instagram_business_manage_comments` - Comment moderation

### Rate Limiting Structure
- **General API**: 4800 × Number of Impressions per 24 hours
- **Messaging API**: 
  - Conversations: 2 calls/second per account
  - Send Messages: 100 calls/second (text), 10 calls/second (media)
  - Private Replies: 750 calls/hour

### Messaging Flow Architecture
1. **Webhook Reception**: Instagram sends message to webhook endpoint
2. **Message Processing**: Convert Instagram format to internal format
3. **AI Generation**: Process through OpenAI with business context
4. **Response Delivery**: Send via Instagram Graph API
5. **Status Tracking**: Update conversation state and usage metrics

### Technical Implementation Requirements
- **OAuth Flow**: Handle authorization code exchange and token refresh
- **Webhook Verification**: Secure webhook endpoint with verification token
- **Error Handling**: Rate limit management and API failure recovery
- **Data Mapping**: Instagram message format to internal conversation schema

### Instagram-Specific Features
- **Inbox Management**: Primary, General, and Requests folder behavior
- **Message Types**: Text, media, reactions, story replies, shares
- **User Scoping**: Instagram-scoped User IDs for conversation threading
- **Human Agent Tag**: 7-day response window for complex issues

### Webhook Architecture Requirements
- **Security**: Must use HTTPS with valid TLS/SSL certificate (no self-signed)
- **Dual Request Handling**: Verification requests (GET) + Event notifications (POST)
- **Subscription Management**: POST to `/me/subscribed_apps` with `subscribed_fields` parameter
- **App Status**: Must be set to "Live" in App Dashboard to receive notifications

### Webhook Field Subscriptions
**Core Messaging Fields:**
- `messages` - Direct message notifications
- `message_reactions` - Message reaction events
- `messaging_seen` - Read status updates
- `messaging_optins` - User opt-in events

**Comment Management Fields:**
- `comments` - Comments on media (includes mentions)
- `live_comments` - Live video comments
- `mentions` - User @mentions (included in comments field)

**Advanced Features:**
- `messaging_handover` - Multi-app conversation handoff
- `messaging_postbacks` - Button/quick reply interactions
- `story_insights` - Story metrics (24-hour window only)

### Webhook Limitations & Constraints
- **Account Level**: No per-account customization - all subscribed fields apply to all users
- **Public Account Requirement**: Must be public to receive comment/mention notifications
- **Advanced Access Required**: For comments and live_comments webhooks
- **Album ID Exclusion**: Not included in notifications - use Comment ID to retrieve
- **Story Metrics**: Only first 24 hours available, even for highlights
- **Live Comments**: Only sent during active broadcast

## Changelog

- July 2, 2025: Implemented hardcoded Instagram testing configuration
  - Added HARDCODED_INSTAGRAM_CONFIG object for testing purposes
  - Modified OAuth callback to use hardcoded app secret and bypass database storage
  - Updated webhook verification to use hardcoded verify token
  - Modified Instagram status endpoint to return hardcoded test data
  - Added /api/instagram/test-config endpoint for configuration validation
  - Created INSTAGRAM_TESTING_HARDCODE.md documentation for easy rollback
  - All changes marked with "HARDCODE TESTING" comments for easy identification
- July 1, 2025: Fixed Instagram OAuth callback redirect URI issue
  - Resolved TypeScript syntax error in server/routes.ts (line 1090)
  - Made redirect URI configuration consistent across all OAuth endpoints
  - Added environment-aware redirect URI handling for deployment vs development
  - Created comprehensive Instagram app setup guide (INSTAGRAM_SETUP_GUIDE.md)
  - Fixed duplicated HTML response blocks and orphaned object properties
- June 25, 2025: Documented comprehensive Instagram API implementation guide
  - Detailed authentication flow and token management
  - Rate limiting specifications and messaging architecture
  - Technical requirements for OAuth, webhooks, and data mapping  
  - Instagram-specific features and inbox management behavior
  - Webhook architecture requirements and field subscriptions
  - Security constraints and implementation limitations
- June 24, 2025: Implemented comprehensive feature updates
  - Added manual auto-reply toggle per conversation
  - Added business profile selection (Fitlife Coaching, OnlyFans Model, Product Sales)
  - Added "Girlfriend Experience" tone for OnlyFans model profile
  - Updated pricing plans to EUR with new tiers (Starter €39, Pro €79, Agency €199, Flex €0.049/reply)
  - Added interactive Flex plan slider (5,000-50,000 replies)
  - Enhanced AI response system with business profile context
- June 24, 2025: Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.