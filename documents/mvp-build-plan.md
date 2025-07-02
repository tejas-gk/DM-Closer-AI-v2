# DMCloser AI MVP Build Plan

**Plan Type:** MVP Feature Implementation  
**Created:** June 19, 2025  
**Version:** 1.0  
**Status:** Ready for Implementation  
**Estimated Duration:** 4-5 weeks  

## MVP Scope Analysis

Based on the provided user stories, this MVP focuses on core Instagram DM automation functionality rather than a generic conversation management interface. The current Epic 1 implementation needs significant refocusing to align with these specific requirements.

## Current Boilerplate Coverage Assessment

### ✅ Already Implemented
- **Authentication System:** Supabase auth with email/password signup and login
- **User Profiles:** Profile management with name/email editing
- **Subscription Management:** Stripe integration with billing portal
- **Frontend Framework:** React + TypeScript with Tailwind CSS + shadcn/ui
- **Backend Infrastructure:** Express + TypeScript server with Supabase integration
- **Email System:** Resend integration for transactional emails

### ⚠️ Partially Implemented
- **Conversation Interface:** UI exists but needs refocus for Instagram DM context
- **Database Schema:** Basic tables exist but need Instagram-specific modifications
- **Dashboard:** Home page exists but lacks DM management functionality

### ❌ Missing for MVP
- **Instagram Business API Integration:** OAuth connection and DM access
- **AI Response Generation:** OpenAI GPT-4 integration for reply generation
- **Tone Configuration System:** User preference settings for AI personality
- **Usage Tracking:** Quota monitoring and billing cycle management
- **Trial Management:** Free trial logic and expiration handling

## New Features Required for MVP

### Feature 1: Instagram Business Connection
**User Stories Covered:**
- Connect Instagram Business account via OAuth
- See connection status (active/expired)
- Disconnect/reconnect Instagram account

**Implementation Requirements:**
- Instagram Business API OAuth flow
- Webhook endpoint for DM notifications
- Connection status monitoring
- Token refresh mechanism

### Feature 2: AI Tone Configuration
**User Stories Covered:**
- Set preferred tone (Friendly, Professional, Casual)
- AI responses match brand personality

**Implementation Requirements:**
- Tone preference settings page
- AI prompt engineering for different tones
- Tone application in response generation
- Preview functionality for tone testing

### Feature 3: AI Response Generation & Management
**User Stories Covered:**
- See AI-generated responses in message view
- Override or edit AI responses
- Track auto-sent vs manual replies

**Implementation Requirements:**
- OpenAI GPT-4 integration
- Response generation with conversation context
- Manual override and editing interface
- Response status tracking (auto/manual)

### Feature 4: DM Dashboard & Management
**User Stories Covered:**
- Dashboard showing recent conversations and reply status
- Distinguish between auto-sent and manual replies

**Implementation Requirements:**
- Instagram DM conversation synchronization
- Dashboard with conversation list and status indicators
- Real-time updates for new DMs
- Reply status visualization

### Feature 5: Usage Tracking & Quotas
**User Stories Covered:**
- See AI reply usage for current billing cycle
- Warnings when near usage cap
- Trial expiration notifications

**Implementation Requirements:**
- Usage tracking database schema
- Billing cycle calculation logic
- Email and in-app notifications for limits
- Trial period management

## High-Level Architecture Changes

### Database Schema Modifications
```sql
-- Instagram connection tracking
CREATE TABLE instagram_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  instagram_business_id VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User tone preferences
CREATE TABLE tone_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tone_type VARCHAR(50) NOT NULL DEFAULT 'friendly',
  custom_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI usage tracking
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_month DATE NOT NULL,
  replies_generated INTEGER DEFAULT 0,
  replies_sent INTEGER DEFAULT 0,
  quota_limit INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Modified messages table for Instagram integration
ALTER TABLE messages ADD COLUMN instagram_thread_id VARCHAR(255);
ALTER TABLE messages ADD COLUMN reply_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE messages ADD COLUMN generated_by VARCHAR(20) DEFAULT 'manual';
```

### API Endpoints Required

#### Instagram Integration
- `POST /api/instagram/connect` - Initiate OAuth flow
- `GET /api/instagram/callback` - Handle OAuth callback
- `GET /api/instagram/status` - Check connection status
- `DELETE /api/instagram/disconnect` - Remove connection
- `POST /api/instagram/webhook` - Receive DM notifications

#### AI & Tone Management
- `GET /api/tone-settings` - Get user tone preferences
- `PUT /api/tone-settings` - Update tone preferences
- `POST /api/ai/generate-reply` - Generate AI response
- `POST /api/ai/send-reply` - Send approved response

#### Usage & Quotas
- `GET /api/usage/current` - Get current month usage
- `GET /api/usage/history` - Get usage history
- `POST /api/usage/track` - Record usage event

#### Dashboard
- `GET /api/dashboard/conversations` - Get DM conversations with status
- `GET /api/dashboard/stats` - Get dashboard statistics

## Build Sequence & Phases

### Phase 1: Instagram Integration Foundation (Week 1)
**Priority:** Critical - Core platform dependency

#### Task 1.1: Instagram Business API Setup
- Configure Instagram Business API application
- Implement OAuth 2.0 flow for business accounts
- Create webhook endpoint for DM notifications
- Add connection status monitoring

#### Task 1.2: Database Schema Updates
- Modify existing schema for Instagram integration
- Add Instagram connection tracking
- Update conversation and message tables
- Implement data migration scripts

#### Task 1.3: Basic Dashboard Refactor
- Convert generic conversation interface to Instagram DM context
- Add Instagram branding and visual elements
- Implement connection status indicators
- Basic DM list functionality

### Phase 2: AI Response Engine (Week 2)
**Priority:** High - Core value proposition

#### Task 2.1: OpenAI Integration
- Set up OpenAI GPT-4 API integration
- Implement conversation context building
- Add response generation with error handling
- Create response quality validation

#### Task 2.2: Tone Configuration System
- Build tone preference settings interface
- Implement prompt engineering for different tones
- Add tone preview functionality
- Create default tone templates

#### Task 2.3: Response Management Interface
- Build AI response review and editing interface
- Add manual override capabilities
- Implement response approval workflow
- Track response generation vs sending

### Phase 3: Usage Tracking & Quotas (Week 3)
**Priority:** Medium - Business model enforcement

#### Task 3.1: Usage Tracking Implementation
- Build usage tracking database schema
- Implement quota monitoring logic
- Add billing cycle calculations
- Create usage analytics

#### Task 3.2: Trial Management System
- Implement free trial logic
- Add trial expiration handling
- Create trial-to-paid conversion flow
- Email notifications for trial status

#### Task 3.3: Quota Warning System
- Build usage threshold monitoring
- Implement email warnings for limits
- Add in-app usage notifications
- Create quota upgrade prompts

### Phase 4: Dashboard & User Experience (Week 4)
**Priority:** Medium - User engagement

#### Task 4.1: Comprehensive Dashboard
- Build main dashboard with conversation overview
- Add reply status indicators (auto/manual)
- Implement real-time updates for new DMs
- Create usage statistics display

#### Task 4.2: Settings & Profile Enhancement
- Enhance profile management with Instagram connection
- Add account deletion with Instagram disconnection
- Implement comprehensive settings interface
- Add password change functionality

#### Task 4.3: Email Integration & Notifications
- Set up Resend email templates
- Implement signup confirmation emails
- Add usage warning and trial expiration emails
- Create subscription confirmation emails

### Phase 5: Testing & Production Readiness (Week 5)
**Priority:** High - Quality assurance

#### Task 5.1: Integration Testing
- Test Instagram OAuth flow end-to-end
- Validate AI response generation accuracy
- Test usage tracking and quota enforcement
- Verify email notification delivery

#### Task 5.2: Security & Performance
- Instagram API rate limiting implementation
- OpenAI API cost optimization
- Database query optimization
- Security audit for API endpoints

#### Task 5.3: Production Deployment
- Environment configuration for production
- Instagram webhook SSL certificate setup
- Error monitoring and logging
- Performance monitoring dashboard

## Dependencies & Risks

### External API Dependencies
**Instagram Business API**
- Risk: API changes or restrictions
- Mitigation: Follow Instagram developer guidelines strictly
- Fallback: Manual DM management interface

**OpenAI API**
- Risk: Cost scaling with usage
- Mitigation: Implement response caching and optimization
- Fallback: Template-based responses with customization

**Stripe Integration**
- Risk: Payment processing complexity
- Mitigation: Use existing boilerplate implementation
- Fallback: Manual billing management

### Technical Risks
**Real-time DM Synchronization**
- Risk: Webhook reliability and processing delays
- Mitigation: Implement retry logic and queue processing
- Fallback: Polling-based synchronization

**AI Response Quality**
- Risk: Inappropriate or low-quality responses
- Mitigation: Implement content filtering and quality scoring
- Fallback: Manual review required for all responses

**Usage Tracking Accuracy**
- Risk: Incorrect quota calculations
- Mitigation: Implement audit logging and reconciliation
- Fallback: Manual usage adjustment capabilities

## Success Metrics

### Core Functionality
- Users can successfully connect Instagram Business accounts
- AI generates appropriate responses based on tone settings
- Usage tracking accurately reflects API consumption
- Dashboard provides clear overview of DM management

### Performance Requirements
- Instagram OAuth flow completes within 30 seconds
- AI response generation takes less than 5 seconds
- Dashboard loads in under 2 seconds
- Webhook processing handles 100+ concurrent DMs

### Business Metrics
- Free trial to paid conversion tracking
- Usage quota effectiveness in driving upgrades
- Customer satisfaction with AI response quality
- Instagram connection success rate above 95%

## MVP Limitations & Future Enhancements

### Intentionally Excluded from MVP
- Multi-Instagram account management
- Advanced analytics and reporting
- Team collaboration features
- Custom AI model training
- Bulk message operations
- Advanced workflow automation

### Post-MVP Enhancement Opportunities
- Integration with other social platforms
- Advanced conversation routing rules
- Custom AI personality training
- Enterprise team management
- API access for third-party integrations
- Advanced analytics and ROI reporting

---

**Document Status:** Ready for Implementation  
**Technical Review:** Required for Instagram API integration approach  
**Business Review:** Required for trial and quota logic validation  
**Implementation Priority:** Phase 1 (Instagram Integration) is critical path  

**Prepared by:** Senior Software Architect  
**Timestamp:** June 19, 2025 - 14:21 UTC  
**Next Review:** Upon completion of Phase 1 milestone  
**Escalation:** Instagram Business API approval and OpenAI cost management