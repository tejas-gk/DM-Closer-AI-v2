# Instagram DM Integration Plan - MVP

**Version:** 1.0  
**Date:** June 19, 2025  
**Approach:** Lean MVP - Single inbox, universal settings

## Overview

Integrate Instagram Direct Messages into the existing conversation management system as a unified messaging platform. Instagram DMs will appear alongside internal conversations in a single inbox interface.

## Core Principles

- **Single Inbox:** All conversations (internal + Instagram) in one unified view
- **Universal AI Settings:** Same tone settings apply to all platforms
- **Minimal Changes:** Reuse existing UI components and backend logic
- **Text Only MVP:** Start with text messages, expand later if needed

## Architecture

### Database Changes (Minimal)
```sql
-- Extend existing tables only
ALTER TABLE conversations ADD COLUMN platform TEXT DEFAULT 'internal';
ALTER TABLE conversations ADD COLUMN instagram_conversation_id TEXT;
ALTER TABLE messages ADD COLUMN instagram_message_id TEXT;
ALTER TABLE user_preferences ADD COLUMN instagram_access_token TEXT;
ALTER TABLE user_preferences ADD COLUMN instagram_account_id TEXT;
```

### Backend Integration
**Single service file:** `server/lib/instagram.ts`
- Instagram OAuth connection flow
- Webhook processing for incoming messages
- Message sending via Instagram Graph API
- Format conversion between Instagram and internal schemas

### Frontend Changes (Minimal)
- Instagram connect button in settings page
- Platform indicator badge in conversation list
- Connection status display
- Same conversation interface for all platforms

## Implementation Phases

### Phase 1: Connect Instagram (3 days)
**Goal:** Establish Instagram account connection

**Tasks:**
1. Add Instagram OAuth flow to settings page
2. Store access token securely in user_preferences
3. Create webhook endpoint `/api/instagram/webhook`
4. Transform incoming Instagram messages to internal format
5. Store as regular conversations/messages with platform flag

**Deliverables:**
- User can connect their Instagram business account
- Instagram DMs appear in conversation list
- Messages are received and stored correctly

### Phase 2: Send Messages (2 days)
**Goal:** Enable outbound messaging to Instagram

**Tasks:**
1. Detect Instagram conversations (check platform field)
2. Route outgoing messages to Instagram Graph API
3. Handle Instagram's 24-hour response window
4. Update existing message send logic

**Deliverables:**
- Send replies to Instagram conversations
- AI-generated responses work for Instagram
- Respect Instagram messaging limitations

### Phase 3: Polish (2 days)
**Goal:** Production-ready integration

**Tasks:**
1. Add Instagram icon/badge to conversation list
2. Error handling for API failures and rate limits
3. Connection status monitoring
4. Basic testing and validation

**Deliverables:**
- Visual platform identification
- Robust error handling
- Stable Instagram integration

## Technical Requirements

### Instagram App Setup
**Required permissions:**
- `instagram_business_basic`
- `instagram_business_manage_messages`

**Environment variables:**
```
INSTAGRAM_APP_ID=your_app_id
INSTAGRAM_APP_SECRET=your_app_secret
INSTAGRAM_WEBHOOK_TOKEN=your_verify_token
```

### API Endpoints (New)
- `POST /api/instagram/connect` - OAuth connection flow
- `POST /api/instagram/webhook` - Receive Instagram messages
- Update existing `POST /api/messages` to handle Instagram routing

### Instagram API Integration Points
- **Receive messages:** Instagram webhook → Internal conversation format
- **Send messages:** Internal message → Instagram Graph API
- **OAuth flow:** User connects Instagram business account
- **Rate limiting:** 200 calls/hour per user

## Features Included

✅ **Instagram DM receiving and sending**  
✅ **Unified conversation view**  
✅ **AI responses for Instagram conversations**  
✅ **Universal tone settings**  
✅ **Instagram account connection**  
✅ **Platform identification in UI**

## Features Excluded (Future Scope)

❌ Instagram-specific UI or inbox  
❌ Instagram-specific AI settings  
❌ Media messages (images, videos, audio)  
❌ Instagram Stories or Comments  
❌ Advanced Instagram features  
❌ Multiple Instagram account support

## Success Criteria

### Functional Requirements
- Instagram business account can be connected
- Instagram DMs appear in main conversation list
- Messages can be sent and received via Instagram
- AI responses work for Instagram conversations
- Existing functionality remains unchanged

### Technical Requirements
- Instagram webhook processes messages reliably
- API rate limits are respected
- Error states are handled gracefully
- Platform identification is clear in UI

## Risk Mitigation

### Technical Risks
**Risk:** Instagram API rate limiting  
**Mitigation:** Implement request queuing and retry logic  
**Impact:** Low - MVP traffic unlikely to hit limits

**Risk:** Webhook delivery failures  
**Mitigation:** Implement webhook verification and retry handling  
**Impact:** Medium - Could miss messages

**Risk:** Token expiration  
**Mitigation:** Implement token refresh logic  
**Impact:** High - Would break Instagram integration

### Implementation Risks
**Risk:** Complex Instagram message format  
**Mitigation:** Start with text-only messages  
**Impact:** Low - Simplifies initial implementation

**Risk:** UI changes breaking existing functionality  
**Mitigation:** Minimal UI changes, reuse existing components  
**Impact:** Low - Leveraging proven components

## Timeline

**Total Duration:** 7 days  
**Week 1:** Complete MVP integration  
**Testing:** Continuous throughout implementation  
**Go-live:** End of week 1

## Success Metrics

- Instagram account successfully connected
- Instagram DMs visible in conversation list
- Messages sent/received through Instagram API
- AI responses generated for Instagram conversations
- Zero regression in existing functionality

This lean approach integrates Instagram DMs as another message channel within the existing system, requiring minimal changes while providing full Instagram messaging capability.