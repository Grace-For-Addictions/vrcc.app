// Role-based navigation helper
export const getRoleNavItems = (userRole, isAdmin, readinessLevel = 1, consentAcknowledged = false) => {
  // Public/Anonymous users
  if (!userRole) {
    return {
      show: ['Home', 'Community', 'Crisis', 'Resources'],
      hide: ['AdminDashboard', 'CoachDashboard', 'NavigatorDashboard', 'BeePurpleReporting', 'GovDashPortal']
    };
  }

  // Administrator (full access)
  if (isAdmin || userRole === 'administrator') {
    return {
      show: 'ALL',
      hide: []
    };
  }

  // Executive/Board (read-only)
  if (userRole === 'executive') {
    return {
      show: ['AdminDashboard', 'GovDashPortal', 'BeePurpleReporting'],
      hide: ['Community', 'GraceChat', 'CoachDashboard', 'NavigatorDashboard']
    };
  }

  // Program Staff
  if (userRole === 'program_staff') {
    return {
      show: ['NavigatorDashboard', 'Resources', 'CoachingLogger', 'BeePurpleReporting', 'DocumentOCR'],
      hide: ['AdminDashboard', 'GovDashPortal']
    };
  }

  // Peer Support/Coach
  if (userRole === 'peer_support') {
    return {
      show: ['CoachDashboard', 'Community', 'Resources', 'CoachingLogger', 'PeerCoachTraining', 'PeerCoachAnalytics'],
      hide: ['AdminDashboard', 'NavigatorDashboard', 'BeePurpleReporting', 'GovDashPortal']
    };
  }

  // Participant (default) - PILOT BUILD: ALL FEATURES UNLOCKED
  const participantNav = {
    show: ['Home', 'Community', 'Resources', 'CommunityWalls', 'Events', 'Crisis', 'GraceChat', 
           'Assessment', 'RecoveryGarden', 'Gamification', 'PeerMatching', 'Quizzes', 
           'TeamChallenges', 'RecoveryCapitalCafe', 'DigitalEquity', 'MeetingsHub',
           'Neuroplasticity', 'WorkforceDevelopment', 'SchoolPrevention', 'VideoLibrary',
           'NarcanTracker', 'GrantWriter', 'VRCheckoutHub', 'DailyReflection', 'ProviderHub',
           'ProviderAnalytics', 'IBHRSReporting'],
    hide: ['AdminDashboard', 'CoachDashboard', 'NavigatorDashboard', 'BeePurpleReporting', 
           'GovDashPortal', 'DocumentOCR', 'CoachingLogger', 'PeerCoachTraining', 'CoachingLogger']
  };

  // PILOT BUILD: All Transformation Hub features immediately accessible
  // No readiness or consent gating - encourage exploration and data gathering

  return participantNav;
};

export const canAccessPage = (pageName, userRole, isAdmin, readinessLevel, consentAcknowledged) => {
  const nav = getRoleNavItems(userRole, isAdmin, readinessLevel, consentAcknowledged);
  
  if (nav.show === 'ALL') return true;
  if (nav.hide.includes(pageName)) return false;
  if (nav.show.includes(pageName)) return true;
  
  return false;
};