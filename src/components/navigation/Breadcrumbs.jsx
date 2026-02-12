// ============================================================================
// DOMAIN: Cross-Cutting Infrastructure
// PURPOSE: Breadcrumb navigation showing domain context (Home > Domain > Page)
// DEPENDENCIES: Navigation domain mapping
// ============================================================================

import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronRight, Home } from 'lucide-react';

// Map pages to their domains
const pageToDomainMap = {
  // Participant Journey
  'Home': 'My Journey',
  'MyGFAPlan': 'My Journey',
  'MyServicePortal': 'My Journey',
  'DailyReflection': 'My Journey',
  
  // Community & Peer Support
  'Community': 'Connect',
  'CommunityWalls': 'Connect',
  'Events': 'Connect',
  'PeerMatching': 'Connect',
  'TeamChallenges': 'Connect',
  'RecoveryCapitalCafe': 'Connect',
  
  // Resources
  'Resources': 'Resources',
  'ResourceModeration': 'Resources',
  'DigitalEquity': 'Resources',
  
  // Learning & Growth
  'Neuroplasticity': 'Learn & Grow',
  'RecoveryGarden': 'Learn & Grow',
  'Gamification': 'Learn & Grow',
  'Assessment': 'Learn & Grow',
  'VideoLibrary': 'Learn & Grow',
  'Quizzes': 'Learn & Grow',
  
  // AI & Grace Companion
  'GraceChat': 'AI Support',
  
  // Care Coordination
  'ServiceCoordinationHub': 'Care Coordination',
  'IntakeCoordinatorDashboard': 'Care Coordination',
  'NavigatorDashboard': 'Care Coordination',
  'ResourceNavigatorDashboard': 'Care Coordination',
  
  // Coaching & Services
  'CoachDashboard': 'Services',
  'PeerCoachTraining': 'Services',
  'PeerCoachAnalytics': 'Services',
  'CoachingLogger': 'Services',
  'MeetingsHub': 'Services',
  'GroupSessions': 'Services',
  'ManageSessions': 'Services',
  
  // Provider Network
  'ProviderHub': 'Provider Network',
  'ProviderAnalytics': 'Provider Network',
  
  // Harm Reduction
  'NarcanTracker': 'Harm Reduction',
  'SchoolPrevention': 'Harm Reduction',
  
  // Administration
  'AdminDashboard': 'Analytics',
  'GovDashPortal': 'Analytics',
  'AdminPortal': 'Administration',
  'GrantWriter': 'Administration',
  'IBHRSReporting': 'Administration',
  'BeePurpleReporting': 'Administration',
  
  // Specialized Programs
  'GraceHouseManagement': 'Programs',
  'Residencies': 'Programs',
  'VRCheckoutHub': 'Programs',
  'WorkforceDevelopment': 'Programs',
  'MRCCHub': 'Programs',
  
  // Crisis (standalone)
  'Crisis': 'Crisis Support'
};

// Friendly page names
const pageNameMap = {
  'MyGFAPlan': 'My GFA Plan',
  'MyServicePortal': 'My Services',
  'CommunityWalls': 'Walls of Grace',
  'PeerMatching': 'Grace Match',
  'RecoveryGarden': 'Recovery Garden',
  'Neuroplasticity': 'Brain Science',
  'RecoveryCapitalCafe': 'Recovery Café',
  'ServiceCoordinationHub': 'Coordination Hub',
  'IntakeCoordinatorDashboard': 'Intake Dashboard',
  'NavigatorDashboard': 'Navigator Dashboard',
  'ResourceNavigatorDashboard': 'Resource Navigator',
  'CoachDashboard': 'Coach Dashboard',
  'PeerCoachTraining': 'Coach Training',
  'PeerCoachAnalytics': 'Coach Analytics',
  'CoachingLogger': 'Coaching Logger',
  'MeetingsHub': 'Meetings Hub',
  'GroupSessions': 'Group Sessions',
  'ManageSessions': 'Manage Sessions',
  'ProviderHub': 'Provider Portal',
  'ProviderAnalytics': 'Provider Analytics',
  'NarcanTracker': 'Narcan Tracker',
  'SchoolPrevention': 'School Prevention',
  'AdminDashboard': 'Admin Analytics',
  'GovDashPortal': 'RecoveryCon Portal',
  'AdminPortal': 'Admin Portal',
  'GrantWriter': 'Grant Writer',
  'IBHRSReporting': 'IBHRS Reporting',
  'BeePurpleReporting': 'BeePurple Reporting',
  'GraceHouseManagement': 'Grace House',
  'VRCheckoutHub': 'VR Checkout',
  'WorkforceDevelopment': 'Workforce Center',
  'MRCCHub': 'MRCC Hub',
  'DigitalEquity': 'Digital Equity',
  'TeamChallenges': 'Team Challenges',
  'VideoLibrary': 'Video Library',
  'DailyReflection': 'Daily Reflection',
  'GraceChat': 'Chat with Grace'
};

export default function Breadcrumbs({ currentPageName }) {
  // Don't show breadcrumbs on home page
  if (!currentPageName || currentPageName === 'Home') {
    return null;
  }

  const domain = pageToDomainMap[currentPageName];
  const pageName = pageNameMap[currentPageName] || currentPageName;

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center space-x-2 text-sm">
        <li>
          <Link 
            to={createPageUrl('Home')}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>
        </li>
        
        {domain && (
          <>
            <li>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </li>
            <li>
              <span className="text-gray-600 font-medium">{domain}</span>
            </li>
          </>
        )}
        
        <li>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </li>
        <li>
          <span className="text-gray-900 font-semibold">{pageName}</span>
        </li>
      </ol>
    </nav>
  );
}