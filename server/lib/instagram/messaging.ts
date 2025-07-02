// Instagram messaging API functions

export interface InstagramMessage {
  recipient: {
    id: string;
  };
  message: {
    text?: string;
    attachment?: {
      type: string;
      payload: {
        url: string;
      };
    };
  };
}

export async function sendInstagramMessage(
  recipientId: string,
  message: string,
  accessToken: string
): Promise<{ message_id: string }> {
  const messageData: InstagramMessage = {
    recipient: {
      id: recipientId,
    },
    message: {
      text: message,
    },
  };

  const response = await fetch(`https://graph.instagram.com/v21.0/me/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(messageData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send Instagram message: ${error}`);
  }

  return response.json();
}

export async function getInstagramConversations(accessToken: string, limit = 25) {
  const response = await fetch(
    `https://graph.instagram.com/v21.0/me/conversations?fields=participants,messages{message,from,created_time}&limit=${limit}&access_token=${accessToken}`,
    {
      method: 'GET',
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Instagram conversations: ${error}`);
  }

  return response.json();
}

export async function markInstagramMessageAsRead(messageId: string, accessToken: string) {
  const response = await fetch(`https://graph.instagram.com/v21.0/${messageId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      read: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to mark message as read: ${error}`);
  }

  return response.json();
}