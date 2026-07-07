import React, { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Typography, Button, Modal, Form, Input, Select,
  Space, message, Popconfirm, Row, Col, Statistic, Avatar,
} from 'antd';
import {
  TeamOutlined, PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined,
  IdcardOutlined, PhoneOutlined,
} from '@ant-design/icons';
import { teamApi, tasksApi } from '../api/api.js';
import { PORT_LIST, PORT_COLORS } from '../components/helpers.js';

const { Title, Text } = Typography;

export default function Team() {
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMem, setEditMem] = useState(null);
  const [form] = Form.useForm();

  const load = async () => {
    try {
      setLoading(true);
      const [m, t] = await Promise.all([teamApi.getAll(), tasksApi.getAll()]);
      setMembers(m);
      setTasks(t);
    } catch (e) {
      message.error('Không tải được team');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditMem(null);
    form.resetFields();
    form.setFieldsValue({ role: 'Technician', ports: ['PORT 1'] });
    setModalOpen(true);
  };

  const openEdit = (mem) => {
    setEditMem(mem);
    form.setFieldsValue({ ...mem, ports: mem.ports || [] });
    setModalOpen(true);
  };

  const onSubmit = async () => {
    try {
      const v = await form.validateFields();
      if (editMem) {
        await teamApi.update(editMem.id, v);
        message.success('Đã cập nhật');
      } else {
        await teamApi.create(v);
        message.success('Đã thêm thành viên');
      }
      setModalOpen(false);
      load();
    } catch (e) {
      if (e?.errorFields) return;
      message.error('Lỗi khi lưu');
    }
  };

  const onDelete = async (id) => {
    await teamApi.remove(id);
    message.success('Đã xóa');
    load();
  };

  const taskCountByOwner = (name) => tasks.filter((t) => t.owner === name).length;
  const doneCountByOwner = (name) => tasks.filter((t) => t.owner === name && t.status === 'done').length;

  const roleColors = {
    Director: 'purple', Manager: 'gold', Lead: 'blue', Coordinator: 'cyan',
    Supervisor: 'geekblue', Technician: 'green', CAD: 'default', QC: 'orange',
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title level={3} style={{ marginBottom: 4 }}><TeamOutlined /> Quản lý Team</Title>
          <Text type="secondary">Danh sách nhân sự & phân công công việc (REGISTRATION LIST)</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>Thêm thành viên</Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginTop: 20, marginBottom: 8 }}>
        <Col xs={6}><Card size="small"><Statistic title="Tổng nhân sự" value={members.length} prefix={<TeamOutlined />} /></Card></Col>
        <Col xs={6}><Card size="small"><Statistic title="Quản lý/Lead" value={members.filter(m => ['Director', 'Manager', 'Lead'].includes(m.role)).length} valueStyle={{ color: '#1677ff' }} /></Card></Col>
        <Col xs={6}><Card size="small"><Statistic title="Kỹ thuật" value={members.filter(m => ['Technician', 'CAD', 'QC'].includes(m.role)).length} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col xs={6}><Card size="small"><Statistic title="Tổng công việc" value={tasks.length} valueStyle={{ color: '#fa8c16' }} /></Card></Col>
      </Row>

      <Card style={{ marginTop: 16 }}>
        <Table
          dataSource={members}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={false}
          columns={[
            {
              title: 'Thành viên', dataIndex: 'name', key: 'name',
              render: (t, r) => (
                <Space>
                  <Avatar size="small" style={{ backgroundColor: '#1677ff' }} icon={<UserOutlined />} />
                  <div>
                    <div><Text strong>{t}</Text></div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{r.position}</Text>
                  </div>
                </Space>
              ),
            },
            {
              title: 'Vai trò', dataIndex: 'role', key: 'role', width: 120,
              render: (t) => <Tag color={roleColors[t] || 'default'}>{t}</Tag>,
            },
            {
              title: 'Port phụ trách', dataIndex: 'ports', key: 'ports', width: 220,
              render: (ports) => (
                <Space size={[4, 4]} wrap>
                  {(ports || []).map((p) => <Tag key={p} color={PORT_COLORS[p] || 'blue'} style={{ fontSize: 11 }}>{p}</Tag>)}
                </Space>
              ),
            },
            {
              title: 'CCCD', dataIndex: 'idNumber', key: 'idnum', width: 140,
              render: (t) => t ? <span><IdcardOutlined /> {t}</span> : '-',
            },
            {
              title: 'SĐT', dataIndex: 'phone', key: 'phone', width: 130,
              render: (t) => t ? <span><PhoneOutlined /> {t}</span> : <Text type="secondary">-</Text>,
            },
            {
              title: 'Việc giao', key: 'tasks', width: 130, align: 'center',
              render: (_, r) => {
                const total = taskCountByOwner(r.name);
                const done = doneCountByOwner(r.name);
                return <Tag color={done === total && total > 0 ? 'green' : 'blue'}>{done}/{total}</Tag>;
              },
            },
            {
              title: '', key: 'action', width: 90,
              render: (_, r) => (
                <Space>
                  <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
                  <Popconfirm title="Xóa?" onConfirm={() => onDelete(r.id)}>
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={editMem ? 'Sửa thành viên' : 'Thêm thành viên'}
        open={modalOpen}
        onOk={onSubmit}
        onCancel={() => setModalOpen(false)}
        width={560}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="Họ tên" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="position" label="Chức danh" rules={[{ required: true }]}>
                <Input placeholder="vd: Site Supervisor" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="role" label="Vai trò">
                <Select options={['Director', 'Manager', 'Lead', 'Coordinator', 'Supervisor', 'Technician', 'CAD', 'QC'].map((r) => ({ value: r, label: r }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="idNumber" label="CCCD">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="phone" label="SĐT">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="ports" label="Port phụ trách">
            <Select mode="multiple" options={[...PORT_LIST, 'All'].map((p) => ({ value: p, label: p }))} />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
