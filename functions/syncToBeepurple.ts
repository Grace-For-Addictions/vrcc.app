import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const BEEPURPLE_API_URL = 'https://awsna01.fivecrm.com/273529/api';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { endpoint, data, method = 'POST' } = await req.json();
    
    // Get access token
    const tokenRes = await base44.functions.invoke('beepurpleAuth');
    const { access_token } = tokenRes.data;

    // Make API call to BeePurple
    const response = await fetch(`${BEEPURPLE_API_URL}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: method !== 'GET' ? JSON.stringify(data) : undefined
    });

    if (!response.ok) {
      const errorText = await response.text();
      return Response.json({ 
        error: 'BeePurple API error', 
        details: errorText 
      }, { status: response.status });
    }

    const result = await response.json();
    return Response.json({ success: true, data: result });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});