import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const BEEPURPLE_BASE_URL = 'https://awsna01.fivecrm.com/273529';
const CLIENT_ID = Deno.env.get("BEEPURPLE_CLIENT_ID");
const CLIENT_SECRET = Deno.env.get("BEEPURPLE_CLIENT_SECRET");

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get OAuth access token using Client Credentials flow
    const tokenResponse = await fetch(`${BEEPURPLE_BASE_URL}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        scope: 'openid profile read:clients write:sessions'
      })
    });

    if (!tokenResponse.ok) {
      return Response.json({ error: 'Failed to obtain access token' }, { status: 500 });
    }

    const tokenData = await tokenResponse.json();
    
    return Response.json({ 
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});