import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/shell/AppShell';
import { DemoShell } from './components/demo/DemoShell';
import { ToastProvider } from './components/primitives/ToastProvider';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Onboarding } from './pages/Onboarding';
import { ModeSelect } from './pages/ModeSelect';
import { LiveConnect } from './pages/LiveConnect';
import { DemoUpload } from './pages/DemoUpload';
import { DemoAnalysis } from './pages/DemoAnalysis';
import { Dashboard } from './pages/Dashboard';
import { Topology } from './pages/Topology';
import { Analytics } from './pages/Analytics';
import { Devices } from './pages/Devices';
import { Security } from './pages/Security';
import { Automations } from './pages/Automations';
import { DemoDashboardPage } from './pages/demo/DemoDashboardPage';
import { DemoTopologyPage } from './pages/demo/DemoTopologyPage';
import { DemoFindingsPage } from './pages/demo/DemoFindingsPage';
import { DemoDevicesPage } from './pages/demo/DemoDevicesPage';
import { DemoVemoPage } from './pages/demo/DemoVemoPage';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/app/mode" element={<ModeSelect />} />
        <Route path="/app/live/connect" element={<LiveConnect />} />
        <Route path="/app/demo" element={<DemoUpload />} />
        <Route path="/app/demo/:sessionId/analysis" element={<DemoAnalysis />} />
        <Route path="/app/demo/:sessionId" element={<DemoShell />}>
          <Route index element={<DemoDashboardPage />} />
          <Route path="topology" element={<DemoTopologyPage />} />
          <Route path="findings" element={<DemoFindingsPage />} />
          <Route path="devices" element={<DemoDevicesPage />} />
          <Route path="vemo" element={<DemoVemoPage />} />
        </Route>
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
