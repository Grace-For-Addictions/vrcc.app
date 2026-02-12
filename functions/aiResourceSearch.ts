import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchQuery, userLocation } = await req.json();

    if (!searchQuery || searchQuery.trim().length === 0) {
      return Response.json({ error: 'Search query required' }, { status: 400 });
    }

    // Get all resources
    const allResources = await base44.entities.Resource.list();

    // Use AI to understand the search intent and match resources
    const searchAnalysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this resource search query and extract search criteria:

Query: "${searchQuery}"
User location: ${userLocation || 'Iowa'}

Extract:
1. Primary need category (treatment, housing, employment, legal, family, crisis, peer_support, healthcare, education, food, transportation, mental_health, narcan)
2. Special requirements (e.g., veterans, LGBTQ+, family-friendly, accepts medicaid, free, specific county)
3. Keywords to match in descriptions
4. Geographic preference (county, city, or statewide)
5. Urgency level (immediate, within_week, routine)

Return a structured analysis that will help match the best resources.`,
      response_json_schema: {
        type: "object",
        properties: {
          primary_categories: {
            type: "array",
            items: { type: "string" }
          },
          special_requirements: {
            type: "array",
            items: { type: "string" }
          },
          keywords: {
            type: "array",
            items: { type: "string" }
          },
          geographic_area: { type: "string" },
          urgency: { type: "string" },
          search_explanation: { type: "string" }
        }
      }
    });

    // Score and rank resources based on AI analysis
    const scoredResources = await Promise.all(allResources.map(async (resource) => {
      const matchScore = await base44.integrations.Core.InvokeLLM({
        prompt: `Rate how well this resource matches the user's search:

Search Intent:
- Categories: ${searchAnalysis.primary_categories?.join(', ')}
- Requirements: ${searchAnalysis.special_requirements?.join(', ')}
- Keywords: ${searchAnalysis.keywords?.join(', ')}
- Location: ${searchAnalysis.geographic_area}
- Urgency: ${searchAnalysis.urgency}

Resource:
- Name: ${resource.name}
- Category: ${resource.category}
- Description: ${resource.description || 'N/A'}
- County: ${resource.county || 'Statewide'}
- City: ${resource.city || 'N/A'}
- Is Free: ${resource.is_free}
- Accepts Medicaid: ${resource.accepts_medicaid}
- Accepts Uninsured: ${resource.accepts_uninsured}

Score this match from 0-100, where:
- 90-100: Perfect match
- 70-89: Strong match
- 50-69: Good match
- 30-49: Partial match
- 0-29: Poor match

Also provide a brief explanation of why this resource matches (or doesn't).`,
        response_json_schema: {
          type: "object",
          properties: {
            score: { type: "number" },
            match_reason: { type: "string" },
            relevance_tags: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      return {
        ...resource,
        match_score: matchScore.score,
        match_reason: matchScore.match_reason,
        relevance_tags: matchScore.relevance_tags
      };
    }));

    // Sort by match score
    const rankedResources = scoredResources
      .filter(r => r.match_score >= 30)
      .sort((a, b) => b.match_score - a.match_score);

    return Response.json({
      query: searchQuery,
      searchAnalysis,
      results: rankedResources.slice(0, 20), // Top 20 matches
      totalMatches: rankedResources.length
    });

  } catch (error) {
    console.error('AI Resource Search Error:', error);
    return Response.json({ 
      error: error.message || 'Search failed'
    }, { status: 500 });
  }
});