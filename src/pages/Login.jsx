import React, { useState } from 'react';
import { Card, Typography, Form, Input, Button, Divider } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext.jsx';

const { Title, Text, Paragraph } = Typography;

export default function Login() {
  const { login } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await login(values);
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (e) {
      // error already surfaced by UserContext
    } finally {
      setLoading(false);
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
          <UserOutlined /> Nhập tài khoản và mật khẩu của bạn:
        </Paragraph>

        <Form form={form} layout="vertical" onFinish={onFinish} disabled={loading}>
          <Form.Item name="username" rules={[{ required: true, message: 'Vui lòng nhập tài khoản' }]}>
            <Input size="large" prefix={<UserOutlined />} placeholder="Tài khoản" autoComplete="username" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}>
            <Input.Password size="large" prefix={<LockOutlined />} placeholder="Mật khẩu" autoComplete="current-password" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              className="btn-gradient"
              size="large"
              block
              type="primary"
              htmlType="submit"
              icon={<LoginOutlined />}
              loading={loading}
            >
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>

        <Divider />
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Block B Gas Project — Golden Point Co., Ltd
          </Text>
        </div>
      </Card>
    </div>
  );
}
