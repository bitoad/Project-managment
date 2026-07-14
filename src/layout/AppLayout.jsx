import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import companyLogo from '../assets/company-logo.png';
import { Layout, Menu, Avatar, Badge, Dropdown, Typography, Select, Modal, Input, Spin, Button, Tag, Popover, List, Empty, Drawer, Grid } from 'antd';
import {
  DashboardOutlined,
  AppstoreOutlined,
  TeamOutlined,
  ShopOutlined,
  ContainerOutlined,
  FormOutlined,
  ScheduleOutlined,
  WarningOutlined,
  DollarOutlined,
  FileSearchOutlined,
  LineChartOutlined,
  FolderOpenOutlined,
  SolutionOutlined,
  FilePdfOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  EyeOutlined,
  UserOutlined,
  ProjectOutlined,
  GlobalOutlined,
  PlusOutlined,
  LogoutOutlined,
  CheckSquareOutlined,
  FieldTimeOutlined,
  RobotOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useProject } from '../context/ProjectContext.jsx';
import { useUser } from '../context/UserContext.jsx';
import { tasksApi, searchApi } from '../api/api.js';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

function getDaysUntil(dateValue) {
  if (!dateValue) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateValue);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

const menuItems = [
  {
    key: 'grp-overview',
    type: 'group',
    label: 'TỔNG QUAN',
    children: [
      { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
      { key: '/my-tasks', icon: <CheckSquareOutlined />, label: 'Việc của tôi' },
      { key: '/projects', icon: <ProjectOutlined />, label: 'Quản lý Dự án' },
    ],
  },
  {
    key: 'grp-execution',
    type: 'group',
    label: 'THỰC HIỆN DỰ ÁN',
    children: [
      { key: '/ports', icon: <AppstoreOutlined />, label: 'Hạng mục (Ports)' },
      { key: '/kanban', icon: <ScheduleOutlined />, label: 'Kanban Công việc' },
      { key: '/timeline', icon: <FieldTimeOutlined />, label: 'Timeline (Gantt)' },
      { key: '/risks', icon: <WarningOutlined />, label: 'Ma trận Rủi ro' },
    ],
  },
  {
    key: 'grp-cost',
    type: 'group',
    label: 'VẬT TƯ & CHI PHÍ',
    children: [
      { key: '/items', icon: <ContainerOutlined />, label: 'Item Master' },
      { key: '/data-entry', icon: <FormOutlined />, label: 'Nhập liệu nhanh' },
      { key: '/cost-log', icon: <DollarOutlined />, label: 'Cost Log' },
      { key: '/quotations', icon: <FileSearchOutlined />, label: 'So sánh Báo giá' },
      { key: '/item-watchlist', icon: <EyeOutlined />, label: 'Item Watchlist' },
      { key: '/s-curve', icon: <LineChartOutlined />, label: 'S-Curve (EV)' },
    ],
  },
  {
    key: 'grp-partners',
    type: 'group',
    label: 'ĐỐI TÁC & NHÂN SỰ',
    children: [
      { key: '/suppliers', icon: <ShopOutlined />, label: 'Nhà cung cấp' },
      { key: '/team', icon: <TeamOutlined />, label: 'Team' },
    ],
  },
  {
    key: 'grp-docs',
    type: 'group',
    label: 'TÀI LIỆU & BÁO CÁO',
    children: [
      { key: '/documents', icon: <FolderOpenOutlined />, label: 'Bản vẽ & Tài liệu' },
      { key: '/reports', icon: <FilePdfOutlined />, label: 'Xuất Báo cáo PDF' },
      { key: '/ai-search', icon: <RobotOutlined />, label: 'AI Search' },
    ],
  },
];

const SIDEBAR_COLLAPSED_KEY = 'gp-sidebar-collapsed';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { projects, currentProject, currentProjectId, portfolioView, selectProject, selectAllProjects, createProject, loading } = useProject();
  const { currentUser, logout } = useUser();
  const [tasks, setTasks] = useState([]);
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchTimer = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    tasksApi.getAll().then(setTasks).catch(() => setTasks([]));
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
      } catch {
        /* ignore storage errors */
      }
      return next;
    });
  };

  const doSearch = useCallback((val) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!val || val.trim().length < 2) { setSearchResults(null); return; }
    searchTimer.current = setTimeout(async () => {
      try {
        const r = await searchApi.query(val.trim());
        setSearchResults(r);
        setSearchOpen(true);
      } catch { setSearchResults(null); }
    }, 300);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isMobile && screens.lg === false) setCollapsed(true);
  }, [screens.lg, isMobile]);

  const notifications = useMemo(() => {
    return (tasks || [])
      .filter((t) => t.status !== 'done' && t.endDate && t.owner === currentUser?.name)
      .map((t) => {
        const days = getDaysUntil(t.endDate);
        const level = days < 0 ? 'error' : 'warning';
        const text = days < 0 ? `Quá hạn ${Math.abs(days)} ngày` : `Còn ${days} ngày`;
        return { id: t.id, name: t.title, level, text, days };
      })
      .sort((a, b) => a.days - b.days)
      .slice(0, 5);
  }, [tasks]);

  const userMenu = {
    items: [
      {
        key: 'profile',
        label: (
          <div>
            <div style={{ fontWeight: 600 }}>{currentUser?.name}</div>
            <div style={{ fontSize: 12, color: '#999' }}>{currentUser?.position}</div>
          </div>
        ),
        disabled: true,
      },
      { type: 'divider' },
      { key: 'logout', label: 'Đăng xuất', icon: <LogoutOutlined />, danger: true },
    ],
    onClick: ({ key }) => {
      if (key === 'logout') {
        logout();
      }
    },
  };

  const renderLogo = (showText) => (
    <div
      className="app-logo"
      style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        gap: 10,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 4,
          flexShrink: 0,
        }}
      >
        <img src={companyLogo} alt="Golden Point" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
      </div>
      {showText && (
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 170 }}>
            Golden Point Co., Ltd
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>PM Dashboard</div>
        </div>
      )}
    </div>
  );

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    await createProject(newProjectName.trim(), newProjectDesc.trim());
    setNewProjectName('');
    setNewProjectDesc('');
    setCreateModalOpen(false);
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Đang tải..." />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={240}
          className="app-sider"
          style={{ overflow: 'auto', height: '100vh', position: 'sticky', top: 0, left: 0 }}
        >
          {renderLogo(!collapsed)}
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            style={{ borderRight: 0 }}
          />
        </Sider>
      )}

      <Drawer
        placement="left"
        open={isMobile && mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        width={248}
        closable={false}
        className="app-sider-drawer"
        styles={{ body: { padding: 0 }, header: { display: 'none' } }}
      >
        {renderLogo(true)}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => {
            navigate(key);
            setMobileNavOpen(false);
          }}
          style={{ borderRight: 0 }}
        />
      </Drawer>

      <Layout>
        <Header
          className="app-header"
          style={{
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f0f0f0',
            position: 'sticky',
            top: 0,
            zIndex: 9,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 18, cursor: 'pointer', flexShrink: 0 }} onClick={() => (isMobile ? setMobileNavOpen(true) : toggleCollapsed())}>
              {collapsed || isMobile ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </span>

             {/* Project Selector — compact */}
             <Select
                value={portfolioView ? '__all__' : currentProjectId}
                onChange={(val) => {
                  if (val === '__all__') {
                    selectAllProjects();
                    return;
                  }
                  if (val === '__create__') {
                    setCreateModalOpen(true);
                    return;
                  }
                  selectProject(val);
                }}
                style={{ width: 220, flexShrink: 0 }}
                placeholder="Chọn dự án"
               optionLabelProp="label"
               options={[
                 {
                   value: '__all__',
                   label: (
                     <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
                       <GlobalOutlined style={{ fontSize: 13, flexShrink: 0, color: '#2F5CE0' }} />
                       <span style={{ fontWeight: 600, fontSize: 13 }}>Tất cả dự án</span>
                     </div>
                   ),
                 },
                 { type: 'divider' },
                 ...projects.map((p) => ({
                   value: p.id,
                   label: (
                     <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
                       <ProjectOutlined style={{ fontSize: 13, flexShrink: 0 }} />
                       <span style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                     </div>
                   ),
                 })),
                 { type: 'divider' },
                 {
                   value: '__create__',
                   label: (
                     <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1677ff' }}>
                       <PlusOutlined /> Tạo dự án mới
                     </div>
                   ),
                 },
               ]}
               optionRender={(option) => option.data?.label}
             />

            {/* Global Search */}
            <div ref={searchRef} style={{ position: 'relative', flex: 1, maxWidth: 420, minWidth: 160 }}>
              <Input
                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="Tìm dự án, item, công việc..."
                allowClear
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); doSearch(e.target.value); }}
                onFocus={() => { if (searchResults) setSearchOpen(true); }}
                style={{ borderRadius: 20 }}
              />
              {searchOpen && searchResults && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
                  background: '#fff', borderRadius: 12, boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
                  maxHeight: 380, overflow: 'auto', zIndex: 100, padding: '8px 0',
                }}>
                  {searchResults.projects?.length === 0 && searchResults.items?.length === 0 && searchResults.tasks?.length === 0 ? (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không tìm thấy" style={{ padding: '24px 0' }} />
                  ) : (
                    <>
                      {searchResults.projects?.length > 0 && (
                        <div>
                          <div style={{ padding: '4px 16px', fontSize: 11, color: '#999', fontWeight: 600, textTransform: 'uppercase' }}>Dự án</div>
                          {searchResults.projects.map((p) => (
                            <div key={p.id} style={{ padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              onClick={() => { selectProject(p.id); navigate(p.path); setSearchOpen(false); setSearchQuery(''); }}
                            >
                              <ProjectOutlined style={{ color: '#2F5CE0', fontSize: 13 }} />
                              <span style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {searchResults.items?.length > 0 && (
                        <div>
                          <div style={{ padding: '4px 16px', fontSize: 11, color: '#999', fontWeight: 600, textTransform: 'uppercase', borderTop: '1px solid #f0f0f0', marginTop: 4 }}>Items</div>
                          {searchResults.items.map((it) => (
                            <div key={it.id} style={{ padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              onClick={() => { navigate(it.path); setSearchOpen(false); setSearchQuery(''); }}
                            >
                              <ContainerOutlined style={{ color: '#722ed1', fontSize: 13 }} />
                              <div style={{ fontSize: 13 }}>
                                <span style={{ fontWeight: 600 }}>{it.id}</span>
                                <span style={{ color: '#999', marginLeft: 6 }}>{it.name.split('—')[1]?.trim() || ''}</span>
                                {it.port && <Tag style={{ marginLeft: 6, fontSize: 11 }}>{it.port}</Tag>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {searchResults.tasks?.length > 0 && (
                        <div>
                          <div style={{ padding: '4px 16px', fontSize: 11, color: '#999', fontWeight: 600, textTransform: 'uppercase', borderTop: '1px solid #f0f0f0', marginTop: 4 }}>Công việc</div>
                          {searchResults.tasks.map((t) => (
                            <div key={t.id} style={{ padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              onClick={() => { navigate(t.path); setSearchOpen(false); setSearchQuery(''); }}
                            >
                              <CheckSquareOutlined style={{ color: '#fa8c16', fontSize: 13 }} />
                              <span style={{ fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                              <Tag style={{ margin: 0, fontSize: 11 }}>{t.status}</Tag>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

           <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Popover
              trigger="click"
              placement="bottomRight"
              title="Thông báo"
              content={
                <div style={{ width: 320, maxHeight: 360, overflow: 'auto' }}>
                  {notifications.length === 0 ? (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có thông báo" />
                  ) : (
                    <List
                      size="small"
                      dataSource={notifications}
                      renderItem={(n) => (
                        <List.Item>
                          <List.Item.Meta
                            avatar={<Badge status={n.level === 'error' ? 'error' : 'warning'} />}
                            title={n.name}
                            description={n.text}
                          />
                        </List.Item>
                      )}
                    />
                  )}
                </div>
              }
            >
              <Badge count={notifications.length} size="small" offset={[-2, 2]}>
                <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
              </Badge>
            </Popover>
            <Dropdown menu={userMenu} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{currentUser?.name || 'User'}</div>
                  <div style={{ fontSize: 11, color: '#999' }}>{currentUser?.position}</div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content style={{ margin: 0, background: '#f0f2f5', minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>

      <Modal
        title="Tạo dự án mới"
        open={createModalOpen}
        onOk={handleCreateProject}
        onCancel={() => setCreateModalOpen(false)}
        okText="Tạo"
        cancelText="Hủy"
        centered
        width={480}
      >
        <div style={{ marginBottom: 12 }}>
          <Text strong>Tên dự án *</Text>
          <Input
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="vd: Offshore Platform X"
            style={{ marginTop: 4 }}
            autoFocus
          />
        </div>
        <div>
          <Text strong>Mô tả</Text>
          <Input.TextArea
            value={newProjectDesc}
            onChange={(e) => setNewProjectDesc(e.target.value)}
            placeholder="Khách hàng, địa điểm..."
            rows={2}
            style={{ marginTop: 4 }}
          />
        </div>
        <div style={{ marginTop: 12, padding: 12, background: '#f6ffed', borderRadius: 8, fontSize: 13 }}>
          💡 Sau khi tạo, bạn có thể vào trang <b>Quản lý Dự án</b> để <b>Import Excel</b> hoặc nhập tay từng hạng mục.
        </div>
      </Modal>
    </Layout>
  );
}
