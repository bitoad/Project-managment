import React, { useState } from 'react';
import { Card, Typography, Select, Button, Avatar, Space, Divider, Tag } from 'antd';
import { UserOutlined, LoginOutlined, ProjectOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext.jsx';

const { Title, Text, Paragraph } = Typography;

export default function Login() {
  const { team, login } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedName, setSelectedName] = useState(null);

  const handleLogin = () => {
    const member = team.find((m) => m.name === selectedName);
    if (member) {
      login(member);
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    }
  };

  return (
    <div className="login-page" style={{ position: 'relative', overflow: 'hidden' }}>
      <Card className="login-card" styles={{ body: { padding: 32 } }}>
        <div className="login-brand">
          <div className="login-brand-icon">🛢️</div>
          <div className="login-brand-title">Oil & Gas Project Control</div>
          <div className="login-brand-sub">Đăng nhập để quản lý công việc</div>
        </div>

        <Divider />

        <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16 }}>
          <ProjectOutlined /> Chọn tên của bạn trong danh sách nhân sự để tiếp tục:
        </Paragraph>

        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Select
            size="large"
            placeholder="— Chọn tên của bạn —"
            style={{ width: '100%' }}
            value={selectedName}
            onChange={setSelectedName}
            showSearch
            optionFilterProp="label"
            options={team.map((m) => ({
              value: m.name,
              label: (
                <Space>
                  <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />
                  <span>{m.name}</span>
                  <Tag style={{ fontSize: 11 }}>{m.position}</Tag>
                </Space>
              ),
            }))}
          />

          <Button
            className="btn-gradient"
            size="large"
            block
            icon={<LoginOutlined />}
            disabled={!selectedName}
            onClick={handleLogin}
          >
            Đăng nhập
          </Button>
        </Space>

        <Divider />

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Block B Gas Project — Golden Point Co., Ltd
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>
            {team.length > 0 ? `${team.length} thành viên trong dự án` : 'Đang tải danh sách...'}
          </Text>
        </div>
      </Card>
    </div>
  );
}
