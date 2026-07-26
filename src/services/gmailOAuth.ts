/**
 * gmailOAuth.ts
 * Enterprise Google OAuth2 & Gmail API Client for Multi-Tenant SaaS.
 * Handles OAuth2 authorization, token exchange, and fetching UNREAD PDF invoice attachments.
 */

export interface GoogleOAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiryDate?: number;
  email: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  payload?: any;
}

const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';

/**
 * Generates the official Google OAuth2 Login URL for multi-tenant users.
 */
export function getGoogleOAuthAuthUrl(clientId: string, redirectUri: string, stateCompanyId: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GMAIL_SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    state: stateCompanyId,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchanges authorization code for Access & Refresh Tokens.
 */
export async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<GoogleOAuthTokens> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error_description || 'Google OAuth token exchange failed');
  }

  const data = await res.json();

  // Fetch user info to get connected email address
  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${data.access_token}` },
  });
  const userInfo = await userRes.json().catch(() => ({ email: 'connected@company.com' }));

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiryDate: Date.now() + (data.expires_in || 3600) * 1000,
    email: userInfo.email || 'connected@company.com',
  };
}

/**
 * Fetches UNREAD messages with PDF attachments from Gmail API.
 */
export async function fetchUnreadInvoicesFromGmail(accessToken: string): Promise<Array<{ id: string; subject: string; sender: string; filename: string; attachmentData: ArrayBuffer }>> {
  // Query unread messages with pdf attachments
  const query = encodeURIComponent('is:unread has:attachment filename:pdf');
  const listRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!listRes.ok) {
    throw new Error('Failed to query messages from Gmail API');
  }

  const listData = await listRes.json();
  if (!listData.messages || listData.messages.length === 0) {
    return [];
  }

  const results = [];

  for (const msgRef of listData.messages.slice(0, 10)) {
    const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgRef.id}?format=full`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!msgRes.ok) continue;

    const msg = await msgRes.json();
    const headers = msg.payload?.headers || [];
    const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || 'Purchase Invoice';
    const sender = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Vendor';

    // Find PDF parts
    const parts = msg.payload?.parts || [];
    for (const part of parts) {
      if (part.filename && part.filename.toLowerCase().endsWith('.pdf') && part.body?.attachmentId) {
        const attRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgRef.id}/attachments/${part.body.attachmentId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (attRes.ok) {
          const attData = await attRes.json();
          const binaryStr = atob(attData.data.replace(/-/g, '+').replace(/_/g, '/'));
          const len = binaryStr.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }

          results.push({
            id: msgRef.id,
            subject,
            sender,
            filename: part.filename,
            attachmentData: bytes.buffer,
          });
        }
      }
    }

    // Mark message as READ (remove UNREAD label)
    await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgRef.id}/modify`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ removeLabelIds: ['UNREAD'] }),
    });
  }

  return results;
}
