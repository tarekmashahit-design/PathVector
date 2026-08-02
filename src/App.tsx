import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/shell/AppShell';
import { ToastProvider } from './components/primitives/ToastProvider';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { Topology } from './pages/Topology';
import { Analytics } from './pages/Analytics';
import { Devices } from './pages/Devices';
import { Security } from './pages/Security';
import { Automations } from './pages/Automations';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="topology" element={<Topology />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="devices" element={<Devices />} />
          <Route path="security" element={<Security />} />
          <Route path="automations" element={<Automations />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
