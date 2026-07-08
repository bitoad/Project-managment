import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  DeleteOutlined,
  DollarOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { costLogsApi, itemsApi } from '../api/api.js';
import { useProject } from '../context/ProjectContext.jsx';
import { COST_TYPES, fmtShort, PORT_COLORS } from '../components/helpers.js';

const { Title, Text } = Typography;

function getCostGroup(costType = '') {
  const value = String(costType).toLowerCase();
  if (value.includes('material') || value.includes('procurement')) return 'material';
  if (value.includes('logistics') || value.includes('transport')) return 'logistics';
  if (value.includes('fabrication') || value.includes('installation') || value.includes('subcontractor')) return 'production';
  return 'other';
}

const COST_GROUP_LABELS = {
  material: 'Nhập vật tư',
  production: 'Gia công / sản xuất',
  logistics: 'Vận chuyển',
  other: 'Chi phí khác',
};

export default function CostLog({ initialPortFilter = null }) {
  const { ports } = useProject();
  const portOptions = useMemo(() => ports.map((p) => ({ value: p.id, label: p.id })), [ports]);
  const [logs, setLogs] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPort, setFilterPort] = useState(initialPortFilter || 'all');
  const [filterType, setFilterType] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editLog, setEditLog] = useState(null);
  const [form] = Form.useForm();

  const load = async () => {
    try {
      setLoading(true);
      const [logList, itemList] = await Promise.all([costLogsApi.getAll(), itemsApi.getAll()]);
      setLogs(logList);
      setItems(itemList);
    } catch (e) {
      message.error('Không tải được Cost Log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setFilterPort(initialPortFilter || 'all');
  }, [initialPortFilter]);

  const filteredLogs = useMemo(() => logs.filter((log) => {
    const matchesPort = filterPort === 'all' || log.portId === filterPort;
    const matchesType = filterType === 'all' || getCostGroup(log.costType) === filterType;
    return matchesPort && matchesType;
  }), [filterPort, filterType, logs]);

  const itemOptions = useMemo(() => {
    const scopedItems = filterPort === 'all'
      ? items
      : items.filter((item) => item.port === filterPort || item.portId === filterPort);
    return scopedItems.map((item) => ({ value: item.code, label: `${item.code} - ${item.name}` }));
  }, [filterPort, items]);

  const totals = useMemo(() => {
    return filteredLogs.reduce((acc, log) => {
      const amount = log.amount || 0;
      const group = getCostGroup(log.costType);
      acc.total += amount;
      acc[group] += amount;
      return acc;
    }, { total: 0, material: 0, production: 0, logistics: 0, other: 0 });
  }, [filteredLogs]);

  const openAdd = () => {
    setEditLog(null);
    form.resetFields();
    form.setFieldsValue({
      date: dayjs(),
      portId: filterPort === 'all' ? 'PORT 1' : filterPort,
      costType: 'Material',
      amount: 0,
    });
    setModalOpen(true);
  };

  const openEdit = (log) => {
    setEditLog(log);
    form.setFieldsValue({
      ...log,
      date: log.date ? dayjs(log.date) : null,
    });
    setModalOpen(true);
  };

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        date: values.date ? (values.date.format ? values.date.format('YYYY-MM-DD') : values.date) : null,
      };
      if (editLog) {
        await costLogsApi.update(editLog.id, payload);
        message.success('Đã cập nhật');
      } else {
        await costLogsApi.create(payload);
        message.success('Đã thêm chi phí');
      }
      setModalOpen(false);
      load();
    } catch (e) {
      if (e?.errorFields) return;
      message.error('Lỗi khi lưu');
    }
  };

  const onDelete = async (id) => {
    await costLogsApi.remove(id);
    message.success('Đã xóa');
    load();
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <Title level={3} style={{ marginBottom: 4 }}><DollarOutlined /> Cost Log</Title>
          <Text type="secondary">Theo dõi chi phí thực tế: nhập vật tư, gia công/sản xuất, vận chuyển và chi phí phát sinh.</Text>
        </div>
        <Space wrap>
          <Select
            value={filterPort}
            onChange={setFilterPort}
            style={{ width: 160 }}
            options={[{ value: 'all', label: 'Tất cả Port' }, ...portOptions]}
          />
          <Select
            value={filterType}
            onChange={setFilterType}
            style={{ width: 190 }}
            options={[{ value: 'all', label: 'Tất cả loại chi phí' }, ...Object.entries(COST_GROUP_LABELS).map(([value, label]) => ({ value, label }))]}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>Thêm chi phí</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginTop: 20, marginBottom: 8 }}>
        <Col xs={24} sm={12} xl={5}>
          <Card size="small"><Statistic title="Số bản ghi" value={filteredLogs.length} /></Card>
        </Col>
        <Col xs={24} sm={12} xl={5}>
          <Card size="small"><Statistic title="Tổng chi phí thực tế" value={fmtShort(totals.total)} valueStyle={{ color: '#fa541c' }} /></Card>
        </Col>
        <Col xs={24} sm={12} xl={5}>
          <Card size="small"><Statistic title="Nhập vật tư" value={fmtShort(totals.material)} /></Card>
        </Col>
        <Col xs={24} sm={12} xl={5}>
          <Card size="small"><Statistic title="Gia công / sản xuất" value={fmtShort(totals.production)} /></Card>
        </Col>
        <Col xs={24} sm={12} xl={4}>
          <Card size="small"><Statistic title="Vận chuyển" value={fmtShort(totals.logistics)} /></Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }}>
        <Table
          dataSource={filteredLogs}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{ pageSize: 15 }}
          columns={[
            {
              title: 'Ngày',
              dataIndex: 'date',
              key: 'date',
              width: 110,
              render: (value) => (value ? new Date(value).toLocaleDateString('vi-VN') : '-'),
              sorter: (a, b) => new Date(a.date || 0) - new Date(b.date || 0),
            },
            {
              title: 'Port',
              dataIndex: 'portId',
              key: 'port',
              width: 90,
              render: (port) => <Tag color={PORT_COLORS[port] || 'blue'}>{port}</Tag>,
            },
            { title: 'Item', dataIndex: 'itemCode', key: 'item', width: 90 },
            { title: 'Nhóm', key: 'group', width: 150, render: (_, record) => <Tag>{COST_GROUP_LABELS[getCostGroup(record.costType)]}</Tag> },
            { title: 'Loại', dataIndex: 'costType', key: 'type', width: 130, render: (type) => <Tag>{type}</Tag> },
            { title: 'Mô tả', dataIndex: 'description', key: 'description', ellipsis: true },
            {
              title: 'Số tiền',
              dataIndex: 'amount',
              key: 'amount',
              width: 140,
              align: 'right',
              render: (value) => <Text strong style={{ color: '#fa541c' }}>{fmtShort(value)}</Text>,
              sorter: (a, b) => (a.amount || 0) - (b.amount || 0),
            },
            { title: 'Ghi chú', dataIndex: 'remarks', key: 'remarks', ellipsis: true },
            {
              title: '',
              key: 'action',
              width: 90,
              render: (_, record) => (
                <Space>
                  <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
                  <Popconfirm title="Xóa?" onConfirm={() => onDelete(record.id)}>
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={editLog ? 'Sửa chi phí' : 'Thêm chi phí'}
        open={modalOpen}
        onOk={onSubmit}
        onCancel={() => setModalOpen(false)}
        width={600}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="date" label="Ngày" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="portId" label="Port" rules={[{ required: true }]}>
                <Select options={portOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="itemCode" label="Item code">
                <Select allowClear showSearch optionFilterProp="label" options={itemOptions} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="costType" label="Loại chi phí" rules={[{ required: true }]}>
            <Select options={COST_TYPES.map((type) => ({ value: type, label: type }))} />
          </Form.Item>
          <Form.Item name="description" label="Mô tả" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="amount" label="Số tiền (VND)" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} formatter={(value) => `${value || ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
          </Form.Item>
          <Form.Item name="remarks" label="Ghi chú">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
