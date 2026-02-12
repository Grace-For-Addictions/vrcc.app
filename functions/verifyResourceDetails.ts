import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || (user.role !== 'admin' && user.user_role !== 'navigator')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { resource_id } = await req.json();
    
    if (!resource_id) {
      return Response.json({ error: 'resource_id required' }, { status: 400 });
    }

    // Fetch resource
    const resource = await base44.asServiceRole.entities.Resource.get(resource_id);
    
    if (!resource) {
      return Response.json({ error: 'Resource not found' }, { status: 404 });
    }

    // Search for resource online
    const searchQuery = `${resource.name} ${resource.city || ''} ${resource.state || 'Iowa'} contact information`;
    const searchResults = await base44.asServiceRole.integrations.Core.SearchWeb({ query: searchQuery, limit: 3 });

    let verificationData = {
      online_presence_found: searchResults.results && searchResults.results.length > 0,
      discrepancies: [],
      status: 'verified'
    };

    if (!verificationData.online_presence_found) {
      verificationData.status = 'offline';
      verificationData.discrepancies.push('No active online presence found');
    } else {
      // Fetch website content if available
      let webContent = '';
      if (resource.website) {
        try {
          const websiteData = await base44.asServiceRole.integrations.Core.FetchWebsite({
            url: resource.website,
            formats: ['markdown']
          });
          webContent = websiteData.markdown || '';
        } catch (e) {
          verificationData.discrepancies.push('Website inaccessible or invalid');
        }
      }

      // Use AI to compare stored data with found information
      const comparisonPrompt = `
You are verifying a community resource's contact information.

**Stored Resource Data:**
- Name: ${resource.name}
- Phone: ${resource.phone || 'N/A'}
- Email: ${resource.email || 'N/A'}
- Address: ${resource.address || 'N/A'}, ${resource.city || 'N/A'}, ${resource.state || 'N/A'}
- Website: ${resource.website || 'N/A'}
- Hours: ${resource.hours || 'N/A'}

**Online Search Results:**
${searchResults.results.map(r => `- ${r.title}: ${r.description} (${r.url})`).join('\n')}

**Website Content (if available):**
${webContent.substring(0, 2000)}

Compare the stored data with online information. Identify discrepancies in phone numbers, addresses, emails, hours, or if the organization appears to no longer exist.

Return your findings.
`;

      const aiComparison = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: comparisonPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            discrepancies_found: { type: "boolean" },
            discrepancy_details: {
              type: "array",
              items: { type: "string" }
            },
            confidence_level: { type: "string", enum: ["high", "medium", "low"] },
            recommended_action: { type: "string" }
          }
        }
      });

      if (aiComparison.discrepancies_found) {
        verificationData.status = 'discrepancy_found';
        verificationData.discrepancies = aiComparison.discrepancy_details || [];
      }

      verificationData.ai_confidence = aiComparison.confidence_level;
      verificationData.ai_recommendation = aiComparison.recommended_action;
    }

    // Update resource with verification results
    await base44.asServiceRole.entities.Resource.update(resource_id, {
      verification_status: verificationData.status,
      last_verified: new Date().toISOString().split('T')[0],
      verification_notes: JSON.stringify(verificationData),
      is_verified: verificationData.status === 'verified'
    });

    // If discrepancies found, create alert for navigators
    if (verificationData.status !== 'verified') {
      await base44.asServiceRole.entities.FeedbackAlert.create({
        alert_type: 'resource_verification_issue',
        entity_type: 'Resource',
        entity_id: resource_id,
        severity: verificationData.status === 'offline' ? 'high' : 'medium',
        message: `Resource verification found issues: ${verificationData.discrepancies.join(', ')}`,
        requires_action: true
      });
    }

    return Response.json({
      success: true,
      resource_id,
      verification_result: verificationData
    });

  } catch (error) {
    console.error('Verification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});