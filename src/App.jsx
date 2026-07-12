import React, { Suspense, lazy } from 'react';
import { ConfigProvider, Spin } from 'antd';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AppLayout from './layout/AppLayout.jsx';
import Login from './pages/Login.jsx';
import { useUser } from './context/UserContext.jsx';

const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Ports = lazy(() => import('./pages/Ports.jsx'));
const Suppliers = lazy(() => import('./pages/Suppliers.jsx'));
const Kanban = lazy(() => import('./pages/Kanban.jsx'));
const RiskMatrix = lazy(() => import('./pages/RiskMatrix.jsx'));
const Documents = lazy(() => import('./pages/Documents.jsx'));
const Team = lazy(() => import('./pages/Team.jsx'));
const Items = lazy(() => import('./pages/Items.jsx'));
const CostLog = lazy(() => import('./pages/CostLog.jsx'));
const Quotations = lazy(() => import('./pages/Quotations.jsx'));
const SCurve = lazy(() => import('./pages/SCurve.jsx'));
const Reports = lazy(() => import('./pages/Reports.jsx'));
const Projects = lazy(() => import('./pages/Projects.jsx'));
const Timeline = lazy(() => import('./pages/Timeline.jsx'));
const MyTasks = lazy(() => import('./pages/MyTasks.jsx'));
const DataEntry = lazy(() => import('./pages/DataEntry.jsx'));
const AISearch = lazy(() => import('./pages/AISearch.jsx'));

const PageLoader = (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
    <Spin size="large" />
  </div>
);

function ProtectedLayout() {
  const { isLoggedIn } = useUser();
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <AppLayout />;
}

export default function App() {
  const themeConfig = {
    token: {
      colorPrimary: '#2F5CE0',
      borderRadius: 16,
      fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
      colorBgLayout: '#F5F7FB',
      boxShadowSecondary: '0 4px 16px rgba(0, 0, 0, 0.06)',
    },
    components: {
      Card: { borderRadiusLG: 16 },
      Statistic: { titleFontSize: 13 },
      Table: { headerBg: '#fafafa', headerColor: '#595959', rowHoverBg: '#f0f4ff' },
      Menu: { itemBorderRadius: 10, itemMarginInline: 8 },
    },
  };

  return (
    <ConfigProvider theme={themeConfig}>
      <Suspense fallback={PageLoader}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/ports" element={<Ports />} />
            <Route path="/items" element={<Items />} />
            <Route path="/data-entry" element={<DataEntry />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/kanban" element={<Kanban />} />
            <Route path="/my-tasks" element={<MyTasks />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/risks" element={<RiskMatrix />} />
            <Route path="/cost-log" element={<CostLog />} />
            <Route path="/quotations" element={<Quotations />} />
            <Route path="/s-curve" element={<SCurve />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/team" element={<Team />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/ai-search" element={<AISearch />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ConfigProvider>
  );
}
