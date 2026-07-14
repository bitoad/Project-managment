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
  InfoCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { costLogsApi, itemsApi } from '../api/api.js';
import { useProject } from '../context/ProjectContext.jsx';
import { COST_TYPES, fmtVND, PORT_COLORS } from '../components/helpers.js';
import { sumActualCost } from '../../shared/formulas.js';
import StatCard from '../components/StatCard.jsx';

const { Text } = Typography;

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
  const { ports, currentProjectId, portfolioView } = useProject();
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
      const [logList, itemList] = await Promise.all([
        costLogsApi.getAll(currentProjectId, portfolioView),
        itemsApi.getAll(currentProjectId, portfolioView),
      ]);
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
  }, [currentProjectId, portfolioView]);

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
    const groups = filteredLogs.reduce((acc, log) => {
      const amount = log.amount || 0;
      const group = getCostGroup(log.costType);
      acc[group] += amount;
      return acc;
    }, { material: 0, production: 0, logistics: 0, other: 0 });
    return { ...groups, total: sumActualCost(filteredLogs) };
  }, [filteredLogs]);

  const openAdd = () => {
    setEditLog(null);
    form.resetFields();
    form.setFieldsValue({
      date: dayjs(),
      portId: filterPort === 'all' ? 'PORT 1' : filterPort,
      costType: 'Material',
      quantity: 1,
      unitPrice: 0,
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
      const quantity = Number(values.quantity) || 0;
      const unitPrice = Number(values.unitPrice) || 0;
      const payload = {
        ...values,
        quantity,
        unitPrice,
        amount: quantity * unitPrice,
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
    <div className="ds-container">
      <div className="ds-page-header">
        <div>
          <div className="ds-h1"><DollarOutlined /> Cost Log</div>
          <div className="ds-caption">Sổ chi phí dự án</div>
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
          <Button className="btn-gradient" icon={<PlusOutlined />} onClick={openAdd} disabled={portfolioView} title={portfolioView ? 'Chọn 1 dự án để thêm chi phí' : undefined}>Thêm chi phí</Button>
        </Space>
      </div>

      <div className="ds-card" style={{ padding: 16 }}>
        <InfoCircleOutlined /> <b>Cost Log</b> ghi nhận chi phí thực tế phát sinh. Mỗi bản ghi thuộc một nhóm: <b>Nhập vật tư</b> (Material), <b>Gia công/Sản xuất</b> (Fabrication/Installation/Subcontractor), <b>Vận chuyển</b> (Logistics/Transport) hoặc <b>Chi phí khác</b>. Tổng thực tế được so sánh với chi phí kế hoạch (từ giá internal của Item) để theo dõi vượt chi.
      </div>

      <div className="ds-stat-grid" style={{ marginTop: 16 }}>
        <StatCard
          icon={<DollarOutlined />}
          accent="linear-gradient(135deg,#2F5CE0,#5b82f0)"
          title="Số bản ghi"
          value={filteredLogs.length}
          formatter={(v) => `${v}`}
        />
        <StatCard
          icon={<DollarOutlined />}
          accent="linear-gradient(135deg,#fa541c,#ff8c5b)"
          title="Tổng chi phí thực tế"
          value={totals.total}
          formatter={(v) => fmtVND(v)}
          valueStyle={{ color: '#fa541c' }}
        />
        <StatCard
          icon={<DollarOutlined />}
          accent="linear-gradient(135deg,#1677ff,#69b1ff)"
          title="Nhập vật tư"
          value={totals.material}
          formatter={(v) => fmtVND(v)}
        />
        <StatCard
          icon={<DollarOutlined />}
          accent="linear-gradient(135deg,#722ed1,#9254de)"
          title="Gia công / sản xuất"
          value={totals.production}
          formatter={(v) => fmtVND(v)}
        />
        <StatCard
          icon={<DollarOutlined />}
          accent="linear-gradient(135deg,#13c2c2,#5cdbd3)"
          title="Vận chuyển"
          value={totals.logistics}
          formatter={(v) => fmtVND(v)}
        />
      </div>

      <Card className="ds-chart-card" bordered={false} style={{ marginTop: 16 }} title="Danh sách chi phí">
        <Table
          className="ds-table-premium"
          dataSource={filteredLogs}
          rowKey={(record) => record.__key || record.id}
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
              title: 'SL',
              dataIndex: 'quantity',
              key: 'quantity',
              width: 70,
              align: 'right',
              render: (value) => <span className="ds-num">{value != null && value !== '' ? value : '-'}</span>,
            },
            {
              title: 'Đơn giá',
              dataIndex: 'unitPrice',
              key: 'unitPrice',
              width: 120,
              align: 'right',
              render: (value) => <span className="ds-num">{value != null && value !== '' ? fmtVND(value) : '-'}</span>,
            },
            {
              title: 'Số tiền',
              dataIndex: 'amount',
              key: 'amount',
              width: 140,
              align: 'right',
              render: (value) => <Text strong style={{ color: '#fa541c' }} className="ds-num">{fmtVND(value)}</Text>,
              sorter: (a, b) => (a.amount || 0) - (b.amount || 0),
            },
            { title: 'Ghi chú', dataIndex: 'remarks', key: 'remarks', ellipsis: true },
            {
              title: '',
              key: 'action',
              width: 90,
              render: (_, record) => (
                <Space>
                  <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} disabled={portfolioView} />
                  <Popconfirm title="Xóa?" onConfirm={() => onDelete(record.id)} disabled={portfolioView}>
                    <Button size="small" danger icon={<DeleteOutlined />} disabled={portfolioView} />
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
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="quantity" label="Số lượng" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="unitPrice" label="Đơn giá (VND)" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} formatter={(value) => `${value || ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item noStyle shouldUpdate>
            {() => {
              const qty = Number(form.getFieldValue('quantity')) || 0;
              const price = Number(form.getFieldValue('unitPrice')) || 0;
              return (
                <Form.Item label="Thành tiền (SL × Đơn giá)">
                  <Text strong style={{ color: '#fa541c', fontSize: 16 }}>{fmtVND(qty * price)}</Text>
                </Form.Item>
              );
            }}
          </Form.Item>
          <Form.Item name="remarks" label="Ghi chú">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
