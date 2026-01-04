import Home from './pages/Home';
import Community from './pages/Community';
import Resources from './pages/Resources';
import CommunityWalls from './pages/CommunityWalls';
import Assessment from './pages/Assessment';
import Events from './pages/Events';
import GraceChat from './pages/GraceChat';
import Crisis from './pages/Crisis';
import Neuroplasticity from './pages/Neuroplasticity';
import PeerMatching from './pages/PeerMatching';
import Residencies from './pages/Residencies';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Community": Community,
    "Resources": Resources,
    "CommunityWalls": CommunityWalls,
    "Assessment": Assessment,
    "Events": Events,
    "GraceChat": GraceChat,
    "Crisis": Crisis,
    "Neuroplasticity": Neuroplasticity,
    "PeerMatching": PeerMatching,
    "Residencies": Residencies,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};