import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const BEEPURPLE_API_URL = 'https://awsna01.fivecrm.com/273529/api';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // This is a webhook endpoint - use service role for processing
    console.log('syncToBeepurple: Received request');
    
    // First, process the intake form data if this is from the form submission
    const contentType = req.headers.get('content-type') || '';
    let formData = {};
    
    if (contentType.includes('application/json')) {
      formData = await req.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const body = await req.text();
      const params = new URLSearchParams(body);
      for (const [key, value] of params) {
        formData[key] = value;
      }
    }
    
    console.log('Form data received:', Object.keys(formData));
    
    // Process intake form through our intake processor
    if (formData['EMAIL-CONT']) {
      console.log('Processing intake form for:', formData['EMAIL-CONT']);
      
      const processResponse = await fetch(Deno.env.get('BASE44_FUNCTION_URL') + '/processIntakeForm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const processResult = await processResponse.json();
      console.log('Intake processing result:', processResult);
    }
    
    // Get access token for BeePurple
    const tokenRes = await base44.asServiceRole.functions.invoke('beepurpleAuth');
    const { access_token } = tokenRes.data;
    
    // Determine the endpoint and data to send to BeePurple
    const { endpoint, data, method = 'POST' } = formData.beepurple_config || { 
      endpoint: '/contacts',
      data: formData,
      method: 'POST'
    };

    // Make API call to BeePurple
    const response = await fetch(`${BEEPURPLE_API_URL}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: method !== 'GET' ? JSON.stringify(data || formData) : undefined
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('BeePurple API error:', errorText);
      return Response.json({ 
        error: 'BeePurple API error', 
        details: errorText,
        base44_processing: 'completed'
      }, { status: response.status });
    }

    const result = await response.json();
    console.log('BeePurple sync successful');
    
    return Response.json({ 
      success: true, 
      data: result,
      base44_processing: 'completed'
    });
    
  } catch (error) {
    console.error('syncToBeepurple error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});