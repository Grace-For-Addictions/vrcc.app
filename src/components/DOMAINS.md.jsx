# Components by Domain

This file lists all components grouped by their primary domain.

## Cross-Cutting (UI Components - Used by All Domains)
All components in `components/ui/`:
- Button, Card, Badge, Input, Textarea, Select, Tabs, Dialog, etc.

## Domain 1: Participant Journey
- IntakeRequired (`components/intake/IntakeRequired.jsx`)
- MandatoryIntakeModal (`components/intake/MandatoryIntakeModal.jsx`)
- UniversalActivityForm (`components/intake/UniversalActivityForm.jsx`)
- CareAlertMonitor (`components/rbac/CareAlertMonitor.jsx`)
- DailyGraceCheckIn (`components/checkin/DailyGraceCheckIn.jsx`)
- GFAPlanCard (`components/gfaplan/GFAPlanCard.jsx`)
- GFAPlanExport (`components/gfaplan/GFAPlanExport.jsx`)
- MyGrowthGarden (`components/gfaplan/MyGrowthGarden.jsx`)
- ParticipantOnboarding (`components/onboarding/ParticipantOnboarding.jsx`)
- WelcomeCard (`components/onboarding/WelcomeCard.jsx`)
- PostRegistrationNudge (`components/onboarding/PostRegistrationNudge.jsx`)
- GuidedTour (`components/onboarding/GuidedTour.jsx`)
- CelebrationCard (`components/onboarding/CelebrationCard.jsx`)
- GFAPlanInvitation (`components/onboarding/GFAPlanInvitation.jsx`)

## Domain 2: Service Coordination
- TransportationRequestForm (`components/transportation/TransportationRequestForm.jsx`)
- TransportationCoordinator (`components/transportation/TransportationCoordinator.jsx`)
- ROIMetricSelector (`components/referrals/ROIMetricSelector.jsx`)
- UnifiedCapacityDashboard (`components/admin/UnifiedCapacityDashboard.jsx`)
- ResourceRequestManager (`components/admin/ResourceRequestManager.jsx`)
- ClosedLoopCoordination (`components/admin/ClosedLoopCoordination.jsx`)
- VRCCMRCCIntegration (`components/unified/VRCCMRCCIntegration.jsx`)

## Domain 3: Direct Services
- SessionEntryForm (`components/coaching/SessionEntryForm.jsx`)
- SessionHistory (`components/coaching/SessionHistory.jsx`)
- CoachingAnalytics (`components/coaching/CoachingAnalytics.jsx`)
- EnhancedCoachingAnalytics (`components/coaching/EnhancedCoachingAnalytics.jsx`)
- PeerMatchingCard (`components/peer/PeerMatchingCard.jsx`)
- SponsorConnection (`components/community/SponsorConnection.jsx`)
- AIMeetingSupport (`components/meetings/AIMeetingSupport.jsx`)
- AISessionSummarizer (`components/govdash/AISessionSummarizer.jsx`)

## Domain 4: Community & Engagement
- CommunityForum (`components/community/CommunityForum.jsx`)
- EnhancedForum (`components/community/EnhancedForum.jsx`)
- PostCard (`components/community/PostCard.jsx`)
- BadgeDisplay (`components/common/BadgeDisplay.jsx`)
- PointsDisplay (`components/common/PointsDisplay.jsx`)
- StreakCounter (`components/common/StreakCounter.jsx`)
- CommunityChallenges (`components/community/CommunityChallenges.jsx`)
- ChallengeHub (`components/gamification/ChallengeHub.jsx`)
- EnhancedPointsSystem (`components/gamification/EnhancedPointsSystem.jsx`)
- Leaderboard (`components/gamification/Leaderboard.jsx`)
- GardenCanvas (`components/garden/GardenCanvas.jsx`)
- PlantGifting (`components/garden/PlantGifting.jsx`)
- UnlockableDecorations (`components/garden/UnlockableDecorations.jsx`)
- AIPlantSuggestions (`components/garden/AIPlantSuggestions.jsx`)
- CommunityGardenView (`components/garden/CommunityGardenView.jsx`)
- GardenLeaderboards (`components/garden/GardenLeaderboards.jsx`)
- GrowingGroups (`components/garden/GrowingGroups.jsx`)
- CommunityGardenVisual (`components/community/CommunityGardenVisual.jsx`)
- BiomeEnhancements (`components/community/BiomeEnhancements.jsx`)
- AIIcebreakers (`components/community/AIIcebreakers.jsx`)

## Domain 5: Education & Resources
- VideoCard (`components/video/VideoCard.jsx`)
- VideoPlayer (`components/video/VideoPlayer.jsx`)
- AIResourceNavigator (`components/resources/AIResourceNavigator.jsx`)
- EnhancedResourceBrowser (`components/resources/EnhancedResourceBrowser.jsx`)
- ResourceSuggestionForm (`components/resources/ResourceSuggestionForm.jsx`)
- ResourceEditForm (`components/resources/ResourceEditForm.jsx`)
- PersonalizedRecommendations (`components/resources/PersonalizedRecommendations.jsx`)
- CuratedResourceLists (`components/resources/CuratedResourceLists.jsx`)
- DailyReflectionCardDisplay (`components/reflection/DailyReflectionCardDisplay.jsx`)

## Domain 6: Outcomes & Analytics
- ROIMetricsDashboard (`components/dashboard/ROIMetricsDashboard.jsx`)
- CustomReportBuilder (`components/admin/CustomReportBuilder.jsx`)
- AdvancedPredictiveAnalytics (`components/ai/AdvancedPredictiveAnalytics.jsx`)
- PredictiveAnalytics (`components/ai/PredictiveAnalytics.jsx`)
- ProgressAnalytics (`components/admin/ProgressAnalytics.jsx`)
- ActivityMonitoring (`components/admin/ActivityMonitoring.jsx`)
- RealTimeAnalytics (`components/govdash/RealTimeAnalytics.jsx`)
- OutcomeTracker (`components/govdash/OutcomeTracker.jsx`)
- ResourceDensityAnalytics (`components/admin/ResourceDensityAnalytics.jsx`)
- ClientProgressionDashboard (`components/govdash/ClientProgressionDashboard.jsx`)

## Domain 7: Compliance & Funding
- FunderRelationshipManager (`components/admin/FunderRelationshipManager.jsx`)
- AutoGrantProposalGenerator (`components/admin/AutoGrantProposalGenerator.jsx`)
- GenerateGrantReport (`components/admin/GenerateGrantReport.jsx`)
- GrantProposalGenerator (`components/govdash/GrantProposalGenerator.jsx`)
- GrantReportGenerator (`components/govdash/GrantReportGenerator.jsx`)
- ComplianceMonitor (`components/govdash/ComplianceMonitor.jsx`)
- FundingPipeline (`components/govdash/FundingPipeline.jsx`)
- PolicyTracker (`components/govdash/PolicyTracker.jsx`)
- IBHRSLogger (`components/ibhrs/IBHRSLogger.jsx`)
- IBHRSOutcomeSuggester (`components/ai/IBHRSOutcomeSuggester.jsx`)

## Domain 8: Staff & Volunteer Tools
- VolunteerMatching (`components/volunteer/VolunteerMatching.jsx`)
- VolunteerDashboard (`components/volunteer/VolunteerDashboard.jsx`)
- PerformanceFeedback (`components/volunteer/PerformanceFeedback.jsx`)

## Domain 9: Crisis & Safety
- CrisisHotlineButtons (`components/crisis/CrisisHotlineButtons.jsx`)
- SafetyPlanBuilder (`components/crisis/SafetyPlanBuilder.jsx`)
- NarcanInfoWidget (`components/crisis/NarcanInfoWidget.jsx`)
- CrisisProtocolGuide (`components/crisis/CrisisProtocolGuide.jsx`)

## Domain 10: AI & Chat Support
- GraceChatWidget (`components/chat/GraceChatWidget.jsx`)
- EnhancedGraceCapabilities (`components/chat/EnhancedGraceCapabilities.jsx`)
- GraceChatInterface (`components/chat/GraceChatInterface.jsx`)
- AIRecoveryJourney (`components/ai/AIRecoveryJourney.jsx`)
- GoalSettingAssistant (`components/ai/GoalSettingAssistant.jsx`)
- ProactiveNudges (`components/ai/ProactiveNudges.jsx`)
- GoalProgressNudges (`components/ai/GoalProgressNudges.jsx`)
- PersonalizedContentEngine (`components/ai/PersonalizedContentEngine.jsx`)
- ProgressAnalysis (`components/ai/ProgressAnalysis.jsx`)
- RecoveryPlanAI (`components/ai/RecoveryPlanAI.jsx`)
- SessionAnalyzer (`components/ai/SessionAnalyzer.jsx`)
- YourWhyGenerator (`components/ai/YourWhyGenerator.jsx`)
- RecoveryCapitalOptimizer (`components/ai/RecoveryCapitalOptimizer.jsx`)
- ProactiveOutreach (`components/ai/ProactiveOutreach.jsx`)

## Domain 11: Integration & Infrastructure
- BeepurpleSync (`components/beepurple/BeepurpleSync.jsx`)
- BeepurpleActivityLogger (`components/beepurple/BeepurpleActivityLogger.jsx`)
- CommunicationLogger (`components/beepurple/CommunicationLogger.jsx`)

## Common / Shared
- GraceHeader (`components/common/GraceHeader.jsx`)
- GraceCard (`components/common/GraceCard.jsx`)
- QuickActions (`components/dashboard/QuickActions.jsx`)
- DailyChallenge (`components/dashboard/DailyChallenge.jsx`)
- WelcomeHero (`components/dashboard/WelcomeHero.jsx`)
- LighthouseBeacon (`components/dashboard/LighthouseBeacon.jsx`)
- QuizCard (`components/quiz/QuizCard.jsx`)

## RBAC & Navigation
- ReadinessGate (`components/navigation/ReadinessGate.jsx`)
- RoleBasedNav (`components/navigation/RoleBasedNav.jsx`)
- RoleGuard (`components/navigation/RoleGuard.jsx`)
- PermissionCheck (`components/rbac/PermissionCheck.jsx`)
- PermissionHelper (`components/rbac/PermissionHelper.jsx`)
- TooltipWrapper (`components/rbac/TooltipWrapper.jsx`)
- TraumaInformedInput (`components/rbac/TraumaInformedInput.jsx`)

## Recovery House Management
- EventLogger (`components/residency/EventLogger.jsx`)
- PaymentsBilling (`components/residency/PaymentsBilling.jsx`)
- ProgressDashboard (`components/residency/ProgressDashboard.jsx`)
- ResidentForms (`components/residency/ResidentForms.jsx`)
- ResidentGoals (`components/residency/ResidentGoals.jsx`)
- ResidentMessaging (`components/residency/ResidentMessaging.jsx`)
- HouseManagement (`components/admin/HouseManagement.jsx`)
- ResidentApprovals (`components/admin/ResidentApprovals.jsx`)

## Provider Network
- ProviderDashboard (`components/provider/ProviderDashboard.jsx`)
- ProviderRegistration (`components/provider/ProviderRegistration.jsx`)
- ProviderNotifications (`components/provider/ProviderNotifications.jsx`)
- ReferralManager (`components/provider/ReferralManager.jsx`)
- ProviderReporting (`components/provider/ProviderReporting.jsx`)

## Prevention & Outreach
- PreventionCampaignManager (`components/admin/PreventionCampaignManager.jsx`)
- NeuroplasticityWorkshopGenerator (`components/admin/NeuroplasticityWorkshopGenerator.jsx`)
- MRCCTechHub (`components/mrcc/MRCCTechHub.jsx`)
- MobileOutreachTracker (`components/mobile/MobileOutreachTracker.jsx`)

## VR & Immersive
- BudgetingVRModule (`components/vr/BudgetingVRModule.jsx`)
- ConflictResolutionSimulator (`components/vr/ConflictResolutionSimulator.jsx`)
- JobInterviewSimulator (`components/vr/JobInterviewSimulator.jsx`)
- MultiUserVRSimulator (`components/vr/MultiUserVRSimulator.jsx`)
- RelationshipBuildingVR (`components/vr/RelationshipBuildingVR.jsx`)
- SocialServicesNavigationVR (`components/vr/SocialServicesNavigationVR.jsx`)

## Other Specialized
- AIDocumentationAutomation (`components/admin/AIDocumentationAutomation.jsx`)
- AutomatedOutreach (`components/govdash/AutomatedOutreach.jsx`)
- RecoveryConAssistant (`components/govdash/RecoveryConAssistant.jsx`)
- ParticipantJourneyMap (`components/admin/ParticipantJourneyMap.jsx`)
- GFARCMeetingTrackerDashboard (`components/admin/GFARCMeetingTrackerDashboard.jsx`)
- ReportGenerator (`components/admin/ReportGenerator.jsx`)
- ROIDashboard (`components/admin/ROIDashboard.jsx`)
- FormManagement (`components/admin/FormManagement.jsx`)
- UserNotRegisteredError (`components/UserNotRegisteredError.jsx`)

---
**Last Updated**: 2026-02-12  
**Note**: This list will be refined in Phase 2 when domain headers are added to all component files.