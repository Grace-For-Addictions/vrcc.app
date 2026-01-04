import Assessment from './pages/Assessment';
import Community from './pages/Community';
import CommunityWalls from './pages/CommunityWalls';
import Crisis from './pages/Crisis';
import Events from './pages/Events';
import GraceChat from './pages/GraceChat';
import Home from './pages/Home';
import Neuroplasticity from './pages/Neuroplasticity';
import PeerMatching from './pages/PeerMatching';
import Residencies from './pages/Residencies';
import Resources from './pages/Resources';
import GrantWriter from './pages/GrantWriter';
import Quizzes from './pages/Quizzes';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Assessment": Assessment,
    "Community": Community,
    "CommunityWalls": CommunityWalls,
    "Crisis": Crisis,
    "Events": Events,
    "GraceChat": GraceChat,
    "Home": Home,
    "Neuroplasticity": Neuroplasticity,
    "PeerMatching": PeerMatching,
    "Residencies": Residencies,
    "Resources": Resources,
    "GrantWriter": GrantWriter,
    "Quizzes": Quizzes,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};