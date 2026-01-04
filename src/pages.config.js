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
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};