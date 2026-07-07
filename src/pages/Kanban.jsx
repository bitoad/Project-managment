import React, { useState, useEffect } from 'react';
import {
  Typography, Button, Modal, Form, Input, Select, DatePicker, InputNumber,
  Tag, Dropdown, message, Progress,
} from 'antd';
import dayjs from 'dayjs';
import {
  PlusOutlined, UserOutlined, CalendarOutlined, MoreOutlined,
} from '@ant-design/icons';
import { tasksApi } from '../api/api.js';
import { PORT_LIST, PORT_COLORS, priorityColor } from '../components/helpers.js';

const { Title, Text } = Typography;

const COLUMNS = [
  { key: 'todo', label: 'Cần làm', color: '#8c8c8c' },
  { key: 'inprogress', label: 'Đang làm', color: '#1677ff' },
  { key: 'review', label: 'Kiểm tra', color: '#faad14' },
  { key: 'done', label: 'Hoàn thành', color: '#52c41a' },
];

const PRIORITY_LABEL = { high: 'Cao', medium: 'TB', low: 'Thấp' };

export default function Kanban() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [filterPort, setFilterPort] = useState('all');
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
        await tasksApi.update(editTask.id, payload);
        message.success('Đã cập nhật');
      } else {
        await tasksApi.create(payload);
        message.success('Đã thêm công việc');
      }
      setModalOpen(false);
      load();
    } catch (e) {
      if (e?.errorFields) return;
      message.error('Lỗi khi lưu');
    }
  };

  const onDelete = async (id) => {
    await tasksApi.remove(id);
    message.success('Đã xóa');
    load();
  };

  const onDragStart = (e, taskId) => {
    setDragging(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = async (e, newStatus) => {
    e.preventDefault();
    if (!dragging) return;
    const task = tasks.find((t) => t.id === dragging);
    if (task && task.status !== newStatus) {
          const newProgress = newStatus === 'done' ? 100 : (task.progress || 0);
          await tasksApi.update(task.id, { status: newStatus, progress: newProgress });
      message.success('Đã chuyển công việc');
      load();
    }
    setDragging(null);
  };

  const filtered = filterPort === 'all' ? tasks : tasks.filter((t) => t.portId === filterPort);
  const counts = COLUMNS.reduce((acc, c) => {
    acc[c.key] = filtered.filter((t) => t.status === c.key).length;
    return acc;
  }, {});

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <Title level={3} style={{ marginBottom: 4 }}>📋 Kanban Công việc</Title>
          <Text type="secondary">Kéo thả thẻ để đổi trạng thái</Text>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Select
            value={filterPort}
            onChange={setFilterPort}
            style={{ width: 140 }}
            options={[{ value: 'all', label: 'Tất cả Port' }, ...PORT_LIST.map((p) => ({ value: p, label: p }))]}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>Thêm việc</Button>
        </div>
      </div>

      <div className="kanban-board">
        {COLUMNS.map((col) => (
          <div
            key={col.key}
            className="kanban-column"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e, col.key)}
          >
            <div className="kanban-column-header">
              <Text strong>{col.label}</Text>
              <Tag>{counts[col.key] || 0}</Tag>
            </div>

            <div style={{ flex: 1 }}>
              {filtered.filter((t) => t.status === col.key).map((task) => {
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
                    style={{ opacity: dragging === task.id ? 0.5 : 1 }}
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
                         </span>
                       )}
                     </div>
                    {task.progress > 0 && task.status !== 'done' && (
                      <Progress percent={task.progress} size="small" style={{ marginTop: 8, marginBottom: 0 }} />
                    )}
                  </div>
                );
              })}
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
            <Select options={PORT_LIST.map((p) => ({ value: p, label: p }))} />
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
