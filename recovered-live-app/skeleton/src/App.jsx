import { Routes, Route, Navigate } from 'react-router-dom';
import Shell from './components/Shell';
import Screen from './components/Screen';

// All 49 recovered routes share one param screen (see routes.js); Screen resolves
// the metadata by path. This keeps the router faithful to the recovered path table
// without hand-writing 49 identical <Route> lines.
export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Navigate to="/arrival" replace />} />
        <Route path="/:screen" element={<Screen />} />
        <Route path="*" element={<Screen />} />
      </Routes>
    </Shell>
  );
}
