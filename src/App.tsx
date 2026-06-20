
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Onboarding from './routes/onboarding';
import Dashboard from './routes/dashboard';
import HashLab from './routes/hash-lab';
import ChainExplorer from './routes/chain-explorer';
import SignaturePanel from './routes/signature-panel';
import Missions from './routes/missions';
import MissionDetail from './routes/mission-detail';
import MissionReplay from './routes/mission-replay';
import Analytics from './routes/analytics';
import Educator from './routes/educator';
import { Layout } from './components/Layout';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Onboarding page (Unauthenticated/Initial) */}
        <Route path="/" element={<Onboarding />} />

        {/* Authenticated workspace wrapper */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tools/hash-lab" element={<HashLab />} />
          <Route path="/tools/chain-explorer" element={<ChainExplorer />} />
          <Route path="/tools/signature-panel" element={<SignaturePanel />} />
          <Route path="/missions" element={<Missions />} />
          <Route path="/missions/:missionId" element={<MissionDetail />} />
          <Route path="/missions/:missionId/replay" element={<MissionReplay />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/educator" element={<Educator />} />
        </Route>

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
