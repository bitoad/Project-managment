import React, { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Typography, Button, Modal, Form, Input, Select,
  Space, message, Popconfirm, Row, Col, Avatar,
} from 'antd';
import {
  TeamOutlined, PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined,
  IdcardOutlined, PhoneOutlined,
} from '@ant-design/icons';
import { teamApi, tasksApi } from '../api/api.js';
import { PORT_LIST, PORT_COLORS } from '../components/helpers.js';
import { useProject } from '../context/ProjectContext.jsx';
import StatCard from '../components/StatCard.jsx';

const { Text } = Typography;

export default function Team() {
  const { currentProjectId, portfolioView } = useProject();
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMem, setEditMem] = useState(null);
  const [form] = Form.useForm();

  const load = async () => {
    try {
      setLoading(true);
      const [m, t] = await Promise.all([
        teamApi.getAll(currentProjectId, portfolioView),
        tasksApi.getAll(currentProjectId, portfolioView),
      ]);
      setMembers(m);
      setTasks(t);
    } catch (e) {
      message.error('Không tải được team');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [currentProjectId, portfolioView]);

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
    <div className="ds-container">

      <div className="ds-page-header">
        <div>
          <div className="ds-h1">Team</div>
          <div className="ds-caption">Nhân sự dự án</div>
        </div>
        <Button className="btn-gradient" icon={<PlusOutlined />} onClick={openAdd} disabled={portfolioView} title={portfolioView ? 'Chọn 1 dự án để thêm thành viên' : undefined}>Thêm thành viên</Button>
      </div>

      <div className="ds-stat-grid">
        <StatCard
          icon={<TeamOutlined />}
          accent="linear-gradient(135deg,#2F5CE0,#5b82f0)"
          title="Tổng nhân sự"
          value={members.length}
          valueStyle={{ color: '#2F5CE0' }}
        />
        <StatCard
          icon={<TeamOutlined />}
          accent="linear-gradient(135deg,#722ed1,#9254de)"
          title="Quản lý/Lead"
          value={members.filter(m => ['Director', 'Manager', 'Lead'].includes(m.role)).length}
          valueStyle={{ color: '#722ed1' }}
        />
        <StatCard
          icon={<TeamOutlined />}
          accent="linear-gradient(135deg,#1FA971,#3cc995)"
          title="Kỹ thuật"
          value={members.filter(m => ['Technician', 'CAD', 'QC'].includes(m.role)).length}
          valueStyle={{ color: '#1FA971' }}
        />
        <StatCard
          icon={<TeamOutlined />}
          accent="linear-gradient(135deg,#FA8C16,#ffa940)"
          title="Tổng công việc"
          value={tasks.length}
          valueStyle={{ color: '#FA8C16' }}
        />
      </div>

      <Card className="ds-chart-card" style={{ marginTop: 16 }} title={<span className="ds-card-head-icon"><TeamOutlined style={{ color: '#2F5CE0' }} /> Danh sách nhân sự</span>}>
        <Table
          className="ds-table-premium"
          dataSource={members}
          rowKey={(r) => r.__key || r.id}
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={false}
          columns={[
            ...(portfolioView
              ? [{ title: 'Dự án', dataIndex: 'projectName', key: 'projectName', width: 160, ellipsis: true }]
              : []),
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
                return <Tag color={done === total && total > 0 ? 'green' : 'blue'}><span className="ds-num">{done}/{total}</span></Tag>;
              },
            },
            {
              title: '', key: 'action', width: 90,
              render: (_, r) => (
                <Space>
                  <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} disabled={portfolioView} />
                  <Popconfirm title="Xóa?" onConfirm={() => onDelete(r.id)} disabled={portfolioView}>
                    <Button size="small" danger icon={<DeleteOutlined />} disabled={portfolioView} />
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
