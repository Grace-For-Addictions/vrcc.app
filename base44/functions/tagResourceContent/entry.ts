import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { resource_id } = await req.json();
    
    if (!resource_id) {
      return Response.json({ error: 'resource_id required' }, { status: 400 });
    }

    // Fetch resource (using service role for automation)
    const resource = await base44.asServiceRole.entities.Resource.get(resource_id);
    
    if (!resource) {
      return Response.json({ error: 'Resource not found' }, { status: 404 });
    }

    // Use AI to analyze content and generate tags
    const taggingPrompt = `
Analyze this community resource and generate relevant tags, pathways, and topics.

**Resource Details:**
- Name: ${resource.name}
- Category: ${resource.category}
- Description: ${resource.description || 'N/A'}
- Services: ${resource.subcategory || 'N/A'}

**Instructions:**
1. Generate 5-10 specific tags that describe the services, populations served, and specialties
2. Identify which recovery pathways this resource supports (substance_use, mental_health, justice_involved, family_ally, youth, provider)
3. Suggest relevant session topics this resource relates to
4. Consider keywords that users might search for

Be specific and practical. Focus on what makes this resource unique or particularly helpful.
`;

    const aiAnalysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: taggingPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          tags: {
            type: "array",
            items: { type: "string" }
          },
          pathways: {
            type: "array",
            items: { type: "string" }
          },
          session_topics: {
            type: "array",
            items: { type: "string" }
          },
          search_keywords: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    });

    // Update resource with AI-generated tags
    const updates = {
      ai_tags: aiAnalysis.tags || [],
      session_topics: aiAnalysis.session_topics || []
    };

    // Merge pathways (keep existing, add new)
    if (aiAnalysis.pathways && aiAnalysis.pathways.length > 0) {
      const existingPathways = resource.pathways || [];
      const mergedPathways = [...new Set([...existingPathways, ...aiAnalysis.pathways])];
      updates.pathways = mergedPathways;
    }

    await base44.asServiceRole.entities.Resource.update(resource_id, updates);

    return Response.json({
      success: true,
      resource_id,
      tags_generated: aiAnalysis
    });

  } catch (error) {
    console.error('Tagging error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});