// Instagram OAuth and API authentication functions

interface InstagramTokenResponse {
  access_token: string;
  user_id: string;
  permissions: string;
}

interface InstagramLongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<InstagramTokenResponse> {
  // Use the exact same app ID as in the authorization request
  const instagramAppId = '1737792583503765';
  
  console.log('Exchanging code for token:', {
    code: code ? 'present' : 'missing',
    redirectUri,
    appId: instagramAppId,
    appSecret: process.env.INSTAGRAM_APP_SECRET ? 'present' : 'missing'
  });

  // Instagram Business Login uses instagram.com OAuth endpoint
  const url = 'https://api.instagram.com/oauth/access_token';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: instagramAppId,
      client_secret: process.env.INSTAGRAM_APP_SECRET!,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code: code,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.log('Instagram token exchange failed:', {
      status: response.status,
      statusText: response.statusText,
      error: error,
      url,
      redirectUri,
      appId: instagramAppId,
      requestBody: {
        client_id: instagramAppId,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code: code ? 'present' : 'missing'
      }
    });
    throw new Error(`Failed to exchange code for token: ${error}`);
  }

  const data = await response.json();
  console.log('Instagram token exchange response:', data);
  
  // Instagram Business Login API returns data in a "data" array (line 176 in documentation)
  if (data.data && data.data.length > 0) {
    return data.data[0];
  }
  
  // Fallback: if data is returned directly
  return data;
}

export async function getLongLivedToken(shortLivedToken: string): Promise<InstagramLongLivedTokenResponse> {
  const response = await fetch(`https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_APP_SECRET}&access_token=${shortLivedToken}`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get long-lived token: ${error}`);
  }

  return response.json();
}

export async function refreshLongLivedToken(longLivedToken: string): Promise<InstagramLongLivedTokenResponse> {
  const response = await fetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${longLivedToken}`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  return response.json();
}

export async function getUserInfo(accessToken: string) {
  const response = await fetch(`https://graph.instagram.com/me?fields=id,username,account_type&access_token=${accessToken}`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to get Instagram user info:', error);
    throw new Error(`Failed to get user info: ${error}`);
  }

  const data = await response.json();
  console.log('Instagram user info response:', data);
  return data;
}