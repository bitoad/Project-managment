import React, { useState, useEffect, useMemo } from 'react';
import {
  Typography, Button, Modal, Form, Input, Select, DatePicker, InputNumber,
  Tag, Dropdown, message, Progress, Empty,
} from 'antd';
import dayjs from 'dayjs';
import {
  PlusOutlined, UserOutlined, CalendarOutlined, MoreOutlined, SearchOutlined,
} from '@ant-design/icons';
import { tasksApi } from '../api/api.js';
import { useProject } from '../context/ProjectContext.jsx';
import { PORT_COLORS, priorityColor } from '../components/helpers.js';

const { Title, Text } = Typography;

const COLUMNS = [
  { key: 'todo', label: 'Cần làm', color: '#8c8c8c' },
  { key: 'inprogress', label: 'Đang làm', color: '#1677ff' },
  { key: 'review', label: 'Kiểm tra', color: '#faad14' },
  { key: 'done', label: 'Hoàn thành', color: '#52c41a' },
];

const PRIORITY_LABEL = { high: 'Cao', medium: 'TB', low: 'Thấp' };

const STATUS_PROGRESS = { todo: 0, inprogress: 30, review: 70, done: 100 };

export default function Kanban() {
  const { ports } = useProject();
  const portOptions = useMemo(() => ports.map((p) => ({ value: p.id, label: p.id })), [ports]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [filterPort, setFilterPort] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [search, setSearch] = useState('');
  const [form] = Form.useForm();

  const load = async () => {
    try {
      setLoading(true);
      setTasks(await tasksApi.getAll());
    } catch (e) {
      message.error('Không tải được công việc');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditTask(null);
    form.resetFields();
    form.setFieldsValue({ status: 'todo', priority: 'medium', portId: 'PORT 1', progress: 0 });
    setModalOpen(true);
  };

  const openEdit = (task) => {
    setEditTask(task);
    form.setFieldsValue({
      ...task,
      endDate: task.endDate ? dayjs(task.endDate) : null,
    });
    setModalOpen(true);
  };

  const onSubmit = async () => {
    try {
      const v = await form.validateFields();
      const payload = {
        ...v,
        endDate: v.endDate ? v.endDate.format('YYYY-MM-DD') : null,
      };
      if (editTask) {
        const updated = await tasksApi.update(editTask.id, payload);
        setTasks((prev) => prev.map((t) => (t.id === editTask.id ? updated : t)));
        message.success('Đã cập nhật');
      } else {
        const created = await tasksApi.create(payload);
        setTasks((prev) => [...prev, created]);
        message.success('Đã thêm công việc');
      }
      setModalOpen(false);
    } catch (e) {
      if (e?.errorFields) return;
      message.error('Lỗi khi lưu');
    }
  };

  const onDelete = async (id) => {
    await tasksApi.remove(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    message.success('Đã xóa');
  };

  const onDragStart = (e, taskId) => {
    setDragging(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = async (e, newStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    if (!dragging) return;
    const task = tasks.find((t) => t.id === dragging);
    if (task && task.status !== newStatus) {
      const newProgress = STATUS_PROGRESS[newStatus] ?? (task.progress || 0);
      const updated = await tasksApi.update(task.id, { status: newStatus, progress: newProgress });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
      message.success('Đã chuyển công việc');
    }
    setDragging(null);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (filterPort !== 'all' && t.portId !== filterPort) return false;
      if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
      if (q && !(t.title || '').toLowerCase().includes(q) && !(t.owner || '').toLowerCase().includes(q) && !(t.itemCode || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [tasks, filterPort, filterPriority, search]);

  const counts = COLUMNS.reduce((acc, c) => {
    acc[c.key] = filtered.filter((t) => t.status === c.key).length;
    return acc;
  }, {});

  const renderCard = (task) => {
    const isOverdue = task.endDate && task.status !== 'done' && new Date(task.endDate) < new Date();
    const menu = {
      items: [
        { key: 'edit', label: 'Sửa', onClick: () => openEdit(task) },
        { key: 'del', label: 'Xóa', danger: true, onClick: () => onDelete(task.id) },
      ],
    };
    return (
      <div
        key={task.id}
        className="kanban-card"
        draggable
        onDragStart={(e) => onDragStart(e, task.id)}
        style={{
          opacity: dragging === task.id ? 0.5 : 1,
          borderLeft: `3px solid ${priorityColor[task.priority] || '#d9d9d9'}`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text strong style={{ fontSize: 13 }}>{task.title}</Text>
          <Dropdown menu={menu} trigger={['click']}>
            <MoreOutlined style={{ cursor: 'pointer' }} />
          </Dropdown>
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
          <Tag color={PORT_COLORS[task.portId]} style={{ fontSize: 11 }}>{task.portId}</Tag>
          {task.itemCode && <Tag style={{ fontSize: 11 }}>{task.itemCode}</Tag>}
          <Tag color={priorityColor[task.priority]} style={{ fontSize: 11 }}>{PRIORITY_LABEL[task.priority]}</Tag>
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
          <UserOutlined /> {task.owner}
          {task.endDate && (
            <span style={{ marginLeft: 12, color: isOverdue ? '#ff4d4f' : '#8c8c8c' }}>
              <CalendarOutlined /> {dayjs(task.endDate).format('DD/MM/YYYY')}
              {isOverdue && <Tag color="red" style={{ fontSize: 10, marginLeft: 4, lineHeight: '16px' }}>Quá hạn</Tag>}
            </span>
          )}
        </div>
        {task.progress > 0 && task.status !== 'done' && (
          <Progress percent={task.progress} size="small" style={{ marginTop: 8, marginBottom: 0 }} />
        )}
      </div>
    );
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <Title level={3} style={{ marginBottom: 4 }}>📋 Kanban Công việc</Title>
          <Text type="secondary">Kéo thả thẻ để đổi trạng thái</Text>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Tìm tên / người làm / item"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 200 }}
          />
          <Select
            value={filterPort}
            onChange={setFilterPort}
            style={{ width: 140 }}
            options={[{ value: 'all', label: 'Tất cả Port' }, ...portOptions]}
          />
          <Select
            value={filterPriority}
            onChange={setFilterPriority}
            style={{ width: 130 }}
            options={[{ value: 'all', label: 'Mọi ưu tiên' }, ...Object.keys(PRIORITY_LABEL).map((p) => ({ value: p, label: PRIORITY_LABEL[p] }))]}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>Thêm việc</Button>
        </div>
      </div>

      <div className="kanban-board">
        {COLUMNS.map((col) => (
          <div
            key={col.key}
            className="kanban-column"
            style={dragOverCol === col.key ? { outline: `2px dashed ${col.color}`, outlineOffset: -2 } : undefined}
            onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.key); }}
            onDragLeave={() => setDragOverCol((c) => (c === col.key ? null : c))}
            onDrop={(e) => onDrop(e, col.key)}
          >
            <div className="kanban-column-header">
              <Text strong>{col.label}</Text>
              <Tag color={col.color}>{counts[col.key] || 0}</Tag>
            </div>

            <div style={{ flex: 1 }}>
              {filtered.filter((t) => t.status === col.key).map(renderCard)}
              {counts[col.key] === 0 && (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có việc" style={{ marginTop: 24, opacity: 0.5 }} />
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        title={editTask ? 'Sửa công việc' : 'Thêm công việc'}
        open={modalOpen}
        onOk={onSubmit}
        onCancel={() => setModalOpen(false)}
        width={560}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Tên công việc" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="owner" label="Người phụ trách" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="portId" label="Port" rules={[{ required: true }]}>
            <Select options={portOptions} />
          </Form.Item>
          <Form.Item name="itemCode" label="Item code">
            <Input placeholder="A001" />
          </Form.Item>
          <Form.Item name="endDate" label="Deadline">
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="status" label="Trạng thái">
            <Select options={COLUMNS.map((c) => ({ value: c.key, label: c.label }))} />
          </Form.Item>
          <Form.Item name="priority" label="Ưu tiên">
            <Select options={Object.keys(PRIORITY_LABEL).map((p) => ({ value: p, label: PRIORITY_LABEL[p] }))} />
          </Form.Item>
          <Form.Item name="progress" label="Tiến độ (%)">
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
