# Instagram App Configuration Guide

## The Problem
Your Instagram OAuth callback is failing because the redirect URI in your Instagram app settings doesn't match what's being used in the code.

**Error Message:** `Error validating verification code. Please make sure your redirect_uri is identical to the one you used in the OAuth dialog request.`

## Solution Steps

### 1. Access Your Instagram App Settings
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Log in with your account
3. Go to "My Apps" and select your DMCloser AI app
4. In the left sidebar, click on "Instagram" > "API setup with Instagram login"

### 2. Configure Business Login Settings
1. Scroll down to "3. Set up Instagram business login"
2. Click on "Business login settings"
3. In the **OAuth redirect URIs** section, add this exact URL:
   ```
   https://dm-closer-ai-hellocrossman.replit.app/api/instagram/callback
   ```

### 3. Verify App Status
1. Make sure your app status is set to "Live" (not "In Development")
2. If it's in development, you need to add test users or submit for app review

### 4. Check Required Permissions
Make sure your app has these permissions enabled:
- `instagram_business_basic`
- `instagram_business_manage_messages`

### 5. Test the Configuration
1. Go to your app's debug endpoint: https://dm-closer-ai-hellocrossman.replit.app/api/instagram/debug
2. Verify the configuration matches
3. Try the Instagram connection again

## Important Notes

- The redirect URI must be **exactly** the same in both:
  - Your Instagram app settings
  - The code that generates the OAuth URL
- Instagram requires HTTPS for redirect URIs
- If you're using a different domain, update the redirect URI in both places

## If Still Not Working

1. **Check App Review Status**: Some Instagram features require Advanced Access
2. **Verify App Type**: Make sure your app is set to "Business" type
3. **Check Rate Limits**: Instagram has strict rate limits
4. **Review App Permissions**: Ensure all required permissions are granted

## Alternative: Manual Token Setup (Temporary)
If you need to test quickly, you can use the manual setup endpoint:
```
POST /api/instagram/manual-setup
{
  "userId": "your-user-id",
  "accessToken": "your-instagram-access-token",
  "username": "your-instagram-username", 
  "instagramUserId": "your-instagram-user-id"
}
```

## Debug Information
You can check your current configuration at:
https://dm-closer-ai-hellocrossman.replit.app/api/instagram/debug