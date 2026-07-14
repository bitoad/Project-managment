import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import viVN from 'antd/locale/vi_VN';
import App from './App.jsx';
import { ProjectProvider } from './context/ProjectContext.jsx';
import { UserProvider } from './context/UserContext.jsx';
import './index.css';
import './theme.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
          fontFamily: "'Segoe UI', 'Inter', system-ui, sans-serif",
        },
        components: {
          Layout: { headerBg: '#fff', siderBg: '#001529' },
        },
      }}
    >
      <AntApp>
        <BrowserRouter>
          <UserProvider>
            <ProjectProvider>
              <App />
            </ProjectProvider>
          </UserProvider>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  </React.StrictMode>
);
