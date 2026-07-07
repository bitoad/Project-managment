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
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #001529 0%, #003a70 100%)',
        padding: 20,
      }}
    >
      <Card
        style={{
          width: 440,
          maxWidth: '100%',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
        styles={{ body: { padding: 32 } }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>🛢️</div>
          <Title level={3} style={{ marginBottom: 4 }}>
            Oil & Gas Project Control
          </Title>
          <Text type="secondary">Đăng nhập để quản lý công việc</Text>
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
            type="primary"
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
