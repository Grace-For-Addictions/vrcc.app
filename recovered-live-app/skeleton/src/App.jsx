import { Routes, Route, Navigate } from 'react-router-dom';
import Shell from './components/Shell';
import Screen from './components/Screen';
import Lobby from './screens/Lobby';
import IcarePlan from './screens/IcarePlan';
import CheckIn from './screens/CheckIn';

// Three screens are fleshed out and wired to the real backend; the remaining 46
// render through the generic Screen stub (which documents their data wiring).
export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Navigate to="/arrival" replace />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/icare-plan" element={<IcarePlan />} />
        <Route path="/check-in" element={<CheckIn />} />
        <Route path="/:screen" element={<Screen />} />
        <Route path="*" element={<Screen />} />
      </Routes>
    </Shell>
  );
}
