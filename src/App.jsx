import React from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AppLayout from './layout/AppLayout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Ports from './pages/Ports.jsx';
import Suppliers from './pages/Suppliers.jsx';
import Kanban from './pages/Kanban.jsx';
import RiskMatrix from './pages/RiskMatrix.jsx';
import Documents from './pages/Documents.jsx';
import Team from './pages/Team.jsx';
import Items from './pages/Items.jsx';
import CostLog from './pages/CostLog.jsx';
import Quotations from './pages/Quotations.jsx';
import SCurve from './pages/SCurve.jsx';
import Reports from './pages/Reports.jsx';
import Projects from './pages/Projects.jsx';
import Timeline from './pages/Timeline.jsx';
import MyTasks from './pages/MyTasks.jsx';
import DataEntry from './pages/DataEntry.jsx';
import { useUser } from './context/UserContext.jsx';

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
      colorPrimary: '#1677ff',
      borderRadius: 10,
      fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
      colorBgLayout: '#f0f2f5',
      boxShadowSecondary: '0 4px 16px rgba(0, 0, 0, 0.06)',
    },
    components: {
      Card: { borderRadiusLG: 14 },
      Statistic: { titleFontSize: 13 },
      Table: { headerBg: '#fafafa', headerColor: '#595959', rowHoverBg: '#f5f8ff' },
      Menu: { itemBorderRadius: 8, itemMarginInline: 8 },
    },
  };

  return (
    <ConfigProvider theme={themeConfig}>
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
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ConfigProvider>
  );
}
