# Instagram Testing Hardcode Configuration

## Overview
This document tracks hardcoded Instagram credentials added for testing purposes. These changes must be reverted before going live.

## Changes Made (Date: July 2, 2025)

### 1. Hardcoded Credentials Location
File: `server/routes.ts`

### 2. Hardcoded Values Added
```javascript
// TESTING HARDCODED VALUES - REMOVE BEFORE PRODUCTION
const HARDCODED_INSTAGRAM_CONFIG = {
  appId: '1737792583503765',
  appSecret: 'PLACEHOLDER_APP_SECRET', // Replace with your actual app secret
  webhookVerifyToken: 'PLACEHOLDER_VERIFY_TOKEN', // Replace with your webhook verify token
  testUserId: 'PLACEHOLDER_INSTAGRAM_USER_ID', // Replace with your Instagram user ID
  testAccessToken: 'PLACEHOLDER_ACCESS_TOKEN', // Replace with your long-lived access token
  testUsername: 'PLACEHOLDER_USERNAME' // Replace with your Instagram username
};
```

### 3. Routes Modified
- `/api/instagram/callback` - ✅ Uses hardcoded app secret for token exchange
- `/api/instagram/webhook` - ✅ Uses hardcoded verify token  
- `/api/instagram/connect` - ✅ Already using hardcoded app ID
- `/api/instagram/status` - ✅ Returns hardcoded connection status
- `/api/instagram/test-config` - ✅ New endpoint to check configuration

### 4. Database Bypass
- ✅ Token storage bypassed during testing (logs data instead)
- ✅ User lookup bypassed for Instagram operations
- ✅ Connection status hardcoded for test user
- ✅ OAuth callback skips database writes

### 5. Test Endpoints Added
- `/api/instagram/test-config` - Check if all placeholders are replaced
- `/api/instagram/debug` - Compare OAuth URLs (existing)
- `/api/instagram/webhook` - Test webhook verification with hardcoded token

## Rollback Instructions

### To Remove Hardcoded Testing:
1. Remove `HARDCODED_INSTAGRAM_CONFIG` object
2. Restore database lookups for user tokens
3. Restore environment variable usage for app secret
4. Restore webhook verify token from environment
5. Remove hardcoded user data in API calls

### Search for this comment to find all hardcoded sections:
```
// HARDCODE TESTING - REMOVE BEFORE PRODUCTION
```

## Production Requirements
- Move app secret to environment variables
- Implement proper token storage/retrieval
- Add user authentication checks
- Enable webhook verification from environment
- Remove all hardcoded user data

## Test Data Needed
You need to provide:
1. Instagram app secret from Meta Developer Console
2. Webhook verify token (your choice, must match webhook config)
3. Your Instagram business account user ID
4. A long-lived access token for your account
5. Your Instagram business username