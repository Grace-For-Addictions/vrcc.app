import Assessment from './pages/Assessment';
import Community from './pages/Community';
import CommunityWalls from './pages/CommunityWalls';
import Crisis from './pages/Crisis';
import DigitalEquity from './pages/DigitalEquity';
import Events from './pages/Events';
import GraceChat from './pages/GraceChat';
import GrantWriter from './pages/GrantWriter';
import Home from './pages/Home';
import Neuroplasticity from './pages/Neuroplasticity';
import PeerCoachAnalytics from './pages/PeerCoachAnalytics';
import PeerCoachTraining from './pages/PeerCoachTraining';
import PeerMatching from './pages/PeerMatching';
import ProviderHub from './pages/ProviderHub';
import Quizzes from './pages/Quizzes';
import RecoveryGarden from './pages/RecoveryGarden';
import Residencies from './pages/Residencies';
import Resources from './pages/Resources';
import TeamChallenges from './pages/TeamChallenges';
import VideoLibrary from './pages/VideoLibrary';
import NarcanTracker from './pages/NarcanTracker';
import RecoveryCapitalCafe from './pages/RecoveryCapitalCafe';
import WorkforceDevelopment from './pages/WorkforceDevelopment';
import SchoolPrevention from './pages/SchoolPrevention';
import MeetingsHub from './pages/MeetingsHub';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Assessment": Assessment,
    "Community": Community,
    "CommunityWalls": CommunityWalls,
    "Crisis": Crisis,
    "DigitalEquity": DigitalEquity,
    "Events": Events,
    "GraceChat": GraceChat,
    "GrantWriter": GrantWriter,
    "Home": Home,
    "Neuroplasticity": Neuroplasticity,
    "PeerCoachAnalytics": PeerCoachAnalytics,
    "PeerCoachTraining": PeerCoachTraining,
    "PeerMatching": PeerMatching,
    "ProviderHub": ProviderHub,
    "Quizzes": Quizzes,
    "RecoveryGarden": RecoveryGarden,
    "Residencies": Residencies,
    "Resources": Resources,
    "TeamChallenges": TeamChallenges,
    "VideoLibrary": VideoLibrary,
    "NarcanTracker": NarcanTracker,
    "RecoveryCapitalCafe": RecoveryCapitalCafe,
    "WorkforceDevelopment": WorkforceDevelopment,
    "SchoolPrevention": SchoolPrevention,
    "MeetingsHub": MeetingsHub,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};