import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's data
    const [intakeSubmissions, assessments, checkIns, profile] = await Promise.all([
      base44.entities.IntakeSubmission.filter({ email: user.email }),
      base44.entities.Assessment.filter({ created_by: user.email }),
      base44.entities.DailyCheckIn.filter({ created_by: user.email }).catch(() => []),
      base44.entities.UserProfile.filter({ created_by: user.email })
    ]);

    const userProfile = profile[0] || null;
    const latestIntake = intakeSubmissions.sort((a, b) => 
      new Date(b.created_date) - new Date(a.created_date)
    )[0];
    const latestAssessment = assessments.sort((a, b) => 
      new Date(b.created_date) - new Date(a.created_date)
    )[0];
    
    // Get recent check-ins (last 7 days)
    const recentCheckIns = checkIns
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
      .slice(0, 7);

    // Fetch available content
    const [allVideos, allResources, allEvents] = await Promise.all([
      base44.asServiceRole.entities.VideoContent.list(),
      base44.asServiceRole.entities.Resource.list(),
      base44.asServiceRole.entities.Event.list()
    ]);

    // Prepare context for AI analysis
    const analysisContext = {
      intake: latestIntake ? {
        primaryConcern: latestIntake.primaryConcern,
        housingStatus: latestIntake.housingStatus,
        urgencyLevel: latestIntake.urgencyLevel
      } : null,
      assessment: latestAssessment ? {
        readiness_score: latestAssessment.readiness_score,
        recovery_capital_score: latestAssessment.recovery_capital_score,
        support_network_score: latestAssessment.support_network_score,
        current_challenges: latestAssessment.current_challenges,
        strengths: latestAssessment.strengths
      } : null,
      profile: userProfile ? {
        primary_pathway: userProfile.primary_pathway,
        readiness_level: userProfile.readiness_level,
        recovery_stage: userProfile.recovery_stage
      } : null,
      recentMoods: recentCheckIns.map(c => ({
        mood: c.mood,
        trigger_level: c.trigger_level,
        coping_used: c.coping_used
      })),
      availableContent: {
        videoCategories: [...new Set(allVideos.map(v => v.category))],
        resourceCategories: [...new Set(allResources.map(r => r.category))],
        eventTypes: [...new Set(allEvents.map(e => e.event_type))]
      }
    };

    // Use AI to generate personalized recommendations
    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a compassionate recovery pathway designer. Based on the participant's data below, create a personalized recovery pathway with specific recommendations.

Participant Data:
${JSON.stringify(analysisContext, null, 2)}

Create a structured pathway with:
1. A personalized message acknowledging their journey and strengths
2. Priority Focus Areas (2-3 key areas to work on)
3. Recommended Video Content (select 3-5 specific categories that match their needs)
4. Recommended Resources (select 3-5 specific categories that address their concerns)
5. Recommended Events (select 2-3 specific event types they should attend)
6. Next Steps (3-4 actionable steps they can take this week)
7. Progress Milestones (what success looks like in 1 week, 1 month, 3 months)

Be specific, encouraging, and trauma-informed. Use person-first language.`,
      response_json_schema: {
        type: "object",
        properties: {
          personalMessage: { type: "string" },
          priorityFocusAreas: {
            type: "array",
            items: { type: "string" }
          },
          recommendedVideos: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                reason: { type: "string" }
              }
            }
          },
          recommendedResources: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                reason: { type: "string" }
              }
            }
          },
          recommendedEvents: {
            type: "array",
            items: {
              type: "object",
              properties: {
                eventType: { type: "string" },
                reason: { type: "string" }
              }
            }
          },
          nextSteps: {
            type: "array",
            items: { type: "string" }
          },
          milestones: {
            type: "object",
            properties: {
              oneWeek: { type: "string" },
              oneMonth: { type: "string" },
              threeMonths: { type: "string" }
            }
          }
        }
      }
    });

    // Match AI recommendations with actual content
    const matchedVideos = allVideos.filter(v => 
      aiResponse.recommendedVideos.some(rec => 
        rec.category.toLowerCase() === v.category.toLowerCase()
      )
    ).slice(0, 6);

    const matchedResources = allResources.filter(r => 
      aiResponse.recommendedResources.some(rec => 
        rec.category.toLowerCase() === r.category.toLowerCase()
      )
    ).slice(0, 8);

    const matchedEvents = allEvents.filter(e => 
      aiResponse.recommendedEvents.some(rec => 
        rec.eventType.toLowerCase().replace(/_/g, ' ') === e.event_type.toLowerCase().replace(/_/g, ' ')
      ) && new Date(e.start_time) > new Date()
    ).slice(0, 5);

    return Response.json({
      pathway: {
        ...aiResponse,
        contentMatches: {
          videos: matchedVideos,
          resources: matchedResources,
          events: matchedEvents
        }
      },
      userContext: {
        hasIntake: !!latestIntake,
        hasAssessment: !!latestAssessment,
        checkInStreak: recentCheckIns.length
      }
    });

  } catch (error) {
    console.error('Pathway generation error:', error);
    return Response.json({ 
      error: error.message,
      fallback: true 
    }, { status: 500 });
  }
});