import React, { useState, useMemo, useEffect } from 'react';
import { Layout, Menu, Avatar, Badge, Dropdown, Typography, Select, Modal, Input, Spin, Button, Tag, Popover, List, Empty } from 'antd';
import {
  DashboardOutlined,
  AppstoreOutlined,
  TeamOutlined,
  ShopOutlined,
  ProfileOutlined,
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
  UserOutlined,
  ProjectOutlined,
  PlusOutlined,
  LogoutOutlined,
  CheckSquareOutlined,
  FieldTimeOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useProject } from '../context/ProjectContext.jsx';
import { useUser } from '../context/UserContext.jsx';
import { tasksApi } from '../api/api.js';

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
    key: 'grp-main',
    type: 'group',
    label: 'TỔNG QUAN',
    children: [
      { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
      { key: '/my-tasks', icon: <CheckSquareOutlined />, label: 'Việc của tôi' },
      { key: '/timeline', icon: <FieldTimeOutlined />, label: 'Timeline (Gantt)' },
      { key: '/projects', icon: <ProjectOutlined />, label: 'Quản lý Dự án' },
    ],
  },
  {
    key: 'grp-project',
    type: 'group',
    label: 'QUẢN LÝ DỰ ÁN',
    children: [
        { key: '/ports', icon: <AppstoreOutlined />, label: 'Hạng mục (Ports)' },
        { key: '/data-entry', icon: <ProfileOutlined />, label: 'Nhập liệu nhanh' },
        { key: '/items', icon: <ProfileOutlined />, label: 'Item Master' },
      { key: '/kanban', icon: <ProfileOutlined />, label: 'Kanban Công việc' },
      { key: '/risks', icon: <WarningOutlined />, label: 'Ma trận Rủi ro' },
    ],
  },
  {
    key: 'grp-cost',
    type: 'group',
    label: 'CHI PHÍ & MUA HÀNG',
    children: [
      { key: '/cost-log', icon: <DollarOutlined />, label: 'Cost Log' },
      { key: '/quotations', icon: <FileSearchOutlined />, label: 'So sánh Báo giá' },
      { key: '/s-curve', icon: <LineChartOutlined />, label: 'S-Curve (EV)' },
    ],
  },
  {
    key: 'grp-resources',
    type: 'group',
    label: 'TÀI NGUYÊN',
    children: [
      { key: '/suppliers', icon: <ShopOutlined />, label: 'Nhà cung cấp' },
      { key: '/documents', icon: <FolderOpenOutlined />, label: 'Bản vẽ & Tài liệu' },
      { key: '/team', icon: <TeamOutlined />, label: 'Team' },
    ],
  },
  {
    key: 'grp-report',
    type: 'group',
    label: 'BÁO CÁO',
    children: [
      { key: '/reports', icon: <FilePdfOutlined />, label: 'Xuất Báo cáo PDF' },
    ],
  },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { projects, currentProject, currentProjectId, selectProject, createProject, loading } = useProject();
  const { currentUser, logout } = useUser();
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    tasksApi.getAll().then(setTasks).catch(() => setTasks([]));
  }, []);

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
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={248}
        className="app-sider"
        style={{ overflow: 'auto', height: '100vh', position: 'sticky', top: 0, left: 0 }}
      >
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
          <span style={{ fontSize: 26 }}>🛢️</span>
          {!collapsed && (
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 170 }}>
                {currentProject?.name || 'Project Control'}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>PM Dashboard</div>
            </div>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['grp-main', 'grp-project', 'grp-cost', 'grp-resources', 'grp-report']}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 18, cursor: 'pointer' }} onClick={() => setCollapsed(!collapsed)}>
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </span>

            {/* Project Selector */}
             <Select
               value={currentProjectId}
               onChange={(val) => {
                 if (val === '__create__') {
                   setCreateModalOpen(true);
                   return;
                 }
                 selectProject(val);
               }}
               style={{ width: 260 }}
               placeholder="Chọn dự án"
               optionLabelProp="label"
               options={[
                 ...projects.map((p) => ({
                   value: p.id,
                   label: (
                     <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
                       <ProjectOutlined style={{ fontSize: 13, flexShrink: 0 }} />
                       <div style={{ overflow: 'hidden', lineHeight: 1.2 }}>
                         <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                         <div style={{ fontSize: 11, color: '#999', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2 }}>{p.description}</div>
                       </div>
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
