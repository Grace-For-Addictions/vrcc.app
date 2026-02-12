/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminDashboard from './pages/AdminDashboard';
import AdminPortal from './pages/AdminPortal';
import Assessment from './pages/Assessment';
import BeePurpleReporting from './pages/BeePurpleReporting';
import CoachDashboard from './pages/CoachDashboard';
import CoachingLogger from './pages/CoachingLogger';
import Community from './pages/Community';
import CommunityForum from './pages/CommunityForum';
import CommunityWalls from './pages/CommunityWalls';
import Crisis from './pages/Crisis';
import DailyReflection from './pages/DailyReflection';
import DigitalEquity from './pages/DigitalEquity';
import DocumentOCR from './pages/DocumentOCR';
import Events from './pages/Events';
import Gamification from './pages/Gamification';
import GovDashPortal from './pages/GovDashPortal';
import GraceChat from './pages/GraceChat';
import GraceHouseManagement from './pages/GraceHouseManagement';
import GracePorchGatherings from './pages/GracePorchGatherings';
import GrantWriter from './pages/GrantWriter';
import GroupSessions from './pages/GroupSessions';
import Home from './pages/Home';
import IBHRSReporting from './pages/IBHRSReporting';
import IntakeCoordinatorDashboard from './pages/IntakeCoordinatorDashboard';
import MRCCHub from './pages/MRCCHub';
import ManageSessions from './pages/ManageSessions';
import MeetingManagement from './pages/MeetingManagement';
import MeetingsHub from './pages/MeetingsHub';
import MyGFAPlan from './pages/MyGFAPlan';
import MyPathway from './pages/MyPathway';
import MyServicePortal from './pages/MyServicePortal';
import NarcanTracker from './pages/NarcanTracker';
import NavigatorDashboard from './pages/NavigatorDashboard';
import Neuroplasticity from './pages/Neuroplasticity';
import ParticipantDashboard from './pages/ParticipantDashboard';
import PeerCoachAnalytics from './pages/PeerCoachAnalytics';
import PeerCoachTraining from './pages/PeerCoachTraining';
import PeerCoachingDetail from './pages/PeerCoachingDetail';
import PeerMatching from './pages/PeerMatching';
import ProviderAnalytics from './pages/ProviderAnalytics';
import ProviderHub from './pages/ProviderHub';
import Quizzes from './pages/Quizzes';
import RecoveryCapitalCafe from './pages/RecoveryCapitalCafe';
import RecoveryGarden from './pages/RecoveryGarden';
import Residencies from './pages/Residencies';
import ResourceNavigatorDashboard from './pages/ResourceNavigatorDashboard';
import Resources from './pages/Resources';
import SchoolPrevention from './pages/SchoolPrevention';
import ServiceCoordinationHub from './pages/ServiceCoordinationHub';
import SessionSummary from './pages/SessionSummary';
import StaffOnboarding from './pages/StaffOnboarding';
import StaffSOPs from './pages/StaffSOPs';
import TeamChallenges from './pages/TeamChallenges';
import VRCCDetail from './pages/VRCCDetail';
import VRCheckoutHub from './pages/VRCheckoutHub';
import VideoLibrary from './pages/VideoLibrary';
import VolunteerDashboard from './pages/VolunteerDashboard';
import VolunteerHub from './pages/VolunteerHub';
import WorkforceDevelopment from './pages/WorkforceDevelopment';
import ResourceModeration from './pages/ResourceModeration';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
    "AdminPortal": AdminPortal,
    "Assessment": Assessment,
    "BeePurpleReporting": BeePurpleReporting,
    "CoachDashboard": CoachDashboard,
    "CoachingLogger": CoachingLogger,
    "Community": Community,
    "CommunityForum": CommunityForum,
    "CommunityWalls": CommunityWalls,
    "Crisis": Crisis,
    "DailyReflection": DailyReflection,
    "DigitalEquity": DigitalEquity,
    "DocumentOCR": DocumentOCR,
    "Events": Events,
    "Gamification": Gamification,
    "GovDashPortal": GovDashPortal,
    "GraceChat": GraceChat,
    "GraceHouseManagement": GraceHouseManagement,
    "GracePorchGatherings": GracePorchGatherings,
    "GrantWriter": GrantWriter,
    "GroupSessions": GroupSessions,
    "Home": Home,
    "IBHRSReporting": IBHRSReporting,
    "IntakeCoordinatorDashboard": IntakeCoordinatorDashboard,
    "MRCCHub": MRCCHub,
    "ManageSessions": ManageSessions,
    "MeetingManagement": MeetingManagement,
    "MeetingsHub": MeetingsHub,
    "MyGFAPlan": MyGFAPlan,
    "MyPathway": MyPathway,
    "MyServicePortal": MyServicePortal,
    "NarcanTracker": NarcanTracker,
    "NavigatorDashboard": NavigatorDashboard,
    "Neuroplasticity": Neuroplasticity,
    "ParticipantDashboard": ParticipantDashboard,
    "PeerCoachAnalytics": PeerCoachAnalytics,
    "PeerCoachTraining": PeerCoachTraining,
    "PeerCoachingDetail": PeerCoachingDetail,
    "PeerMatching": PeerMatching,
    "ProviderAnalytics": ProviderAnalytics,
    "ProviderHub": ProviderHub,
    "Quizzes": Quizzes,
    "RecoveryCapitalCafe": RecoveryCapitalCafe,
    "RecoveryGarden": RecoveryGarden,
    "Residencies": Residencies,
    "ResourceNavigatorDashboard": ResourceNavigatorDashboard,
    "Resources": Resources,
    "SchoolPrevention": SchoolPrevention,
    "ServiceCoordinationHub": ServiceCoordinationHub,
    "SessionSummary": SessionSummary,
    "StaffOnboarding": StaffOnboarding,
    "StaffSOPs": StaffSOPs,
    "TeamChallenges": TeamChallenges,
    "VRCCDetail": VRCCDetail,
    "VRCheckoutHub": VRCheckoutHub,
    "VideoLibrary": VideoLibrary,
    "VolunteerDashboard": VolunteerDashboard,
    "VolunteerHub": VolunteerHub,
    "WorkforceDevelopment": WorkforceDevelopment,
    "ResourceModeration": ResourceModeration,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};