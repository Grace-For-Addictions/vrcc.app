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
import PeerMatching from './pages/PeerMatching';
import Quizzes from './pages/Quizzes';
import RecoveryGarden from './pages/RecoveryGarden';
import Residencies from './pages/Residencies';
import Resources from './pages/Resources';
import PeerCoachTraining from './pages/PeerCoachTraining';
import TeamChallenges from './pages/TeamChallenges';
import ProviderHub from './pages/ProviderHub';
import PeerCoachAnalytics from './pages/PeerCoachAnalytics';
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
    "PeerMatching": PeerMatching,
    "Quizzes": Quizzes,
    "RecoveryGarden": RecoveryGarden,
    "Residencies": Residencies,
    "Resources": Resources,
    "PeerCoachTraining": PeerCoachTraining,
    "TeamChallenges": TeamChallenges,
    "ProviderHub": ProviderHub,
    "PeerCoachAnalytics": PeerCoachAnalytics,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};