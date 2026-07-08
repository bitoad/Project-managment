import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Progress,
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
  EditOutlined,
  PlusOutlined,
  ProfileOutlined,
} from '@ant-design/icons';
import { itemsApi, costLogsApi } from '../api/api.js';
import { useProject } from '../context/ProjectContext.jsx';
import { fmtShort, PORT_COLORS, STATUS_LIST, costOf } from '../components/helpers.js';

const { Title, Text } = Typography;

export default function Items({ initialPortFilter = null }) {
  const { ports } = useProject();
  const portOptions = useMemo(() => ports.map((p) => ({ value: p.id, label: p.id })), [ports]);
  const [items, setItems] = useState([]);
  const [costLogs, setCostLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPort, setFilterPort] = useState(initialPortFilter || 'all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form] = Form.useForm();

  const load = async () => {
    try {
      setLoading(true);
      const [itemList, logList] = await Promise.all([itemsApi.getAll(), costLogsApi.getAll()]);
      setItems(itemList);
      setCostLogs(logList);
    } catch (e) {
      message.error('Không tải được Items');
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

  const filteredItems = useMemo(() => (
    filterPort === 'all'
      ? items
      : items.filter((item) => item.port === filterPort || item.portId === filterPort)
  ), [filterPort, items]);

  const openAdd = () => {
    setEditItem(null);
    form.resetFields();
    form.setFieldsValue({
      unit: 'pcs',
      qty: 1,
      progress: 0,
      status: 'Engineering',
      port: filterPort === 'all' ? 'PORT 1' : filterPort,
    });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    form.setFieldsValue(item);
    setModalOpen(true);
  };

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editItem) {
        await itemsApi.update(editItem.code, values);
        message.success('Đã cập nhật Item');
      } else {
        await itemsApi.create(values);
        message.success('Đã thêm Item');
      }
      setModalOpen(false);
      load();
    } catch (e) {
      if (e?.errorFields) return;
      message.error('Lỗi khi lưu');
    }
  };

  const onDelete = async (code) => {
    await itemsApi.remove(code);
    message.success('Đã xóa');
    load();
  };

  // Tính actualCost từ costLogs cho từng item
  const costByItem = useMemo(() => {
    const map = {};
    costLogs.forEach((log) => {
      if (log.itemCode) {
        map[log.itemCode] = (map[log.itemCode] || 0) + (log.amount || 0);
      }
    });
    return map;
  }, [costLogs]);
  const totalRevenue = filteredItems.reduce((sum, item) => sum + ((item.qty || 0) * (item.unitPrice || 0)), 0);
  const totalPlannedCost = filteredItems.reduce((sum, item) => sum + ((item.qty || 0) * costOf(item)), 0);
  const totalActualCost = filteredItems.reduce((sum, item) => sum + (costByItem[item.code] || 0), 0);
  const totalProfit = totalRevenue - totalActualCost;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <Title level={3} style={{ marginBottom: 4 }}><ProfileOutlined /> Item Master</Title>
          <Text type="secondary">Danh mục hạng mục công việc, khối lượng, giá vốn và giá bán theo từng Port.</Text>
        </div>
        <Space wrap>
          <Select
            value={filterPort}
            onChange={setFilterPort}
            style={{ width: 160 }}
            options={[{ value: 'all', label: 'Tất cả Port' }, ...portOptions]}
          />
          <Button className="btn-gradient" icon={<PlusOutlined />} onClick={openAdd}>Thêm Item</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginTop: 20, marginBottom: 8 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small"><Statistic title="Tổng Items" value={filteredItems.length} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small"><Statistic title="Tổng doanh thu" value={fmtShort(totalRevenue)} valueStyle={{ color: '#1677ff' }} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small"><Statistic title="Chi phí thực tế" value={fmtShort(totalActualCost)} valueStyle={{ color: '#fa541c' }} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small"><Statistic title="Lợi nhuận thực tế" value={fmtShort(totalProfit)} valueStyle={{ color: totalProfit >= 0 ? '#52c41a' : '#ff4d4f' }} /></Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }}>
        <Table
          dataSource={filteredItems}
          rowKey="code"
          loading={loading}
          scroll={{ x: 1150 }}
          columns={[
            { title: 'Code', dataIndex: 'code', key: 'code', width: 80, fixed: 'left', render: (code) => <Text strong>{code}</Text> },
            { title: 'Tên hạng mục', dataIndex: 'name', key: 'name', ellipsis: true },
            {
              title: 'Port',
              dataIndex: 'port',
              key: 'port',
              width: 90,
              render: (port) => <Tag color={PORT_COLORS[port] || 'blue'}>{port}</Tag>,
            },
            { title: 'SL', dataIndex: 'qty', key: 'qty', width: 70, align: 'right' },
            { title: 'ĐVT', dataIndex: 'unit', key: 'unit', width: 70 },
            { title: 'Đơn giá vốn', dataIndex: 'internalCost', key: 'internalCost', width: 120, align: 'right', render: (_, record) => fmtShort(costOf(record)) },
            { title: 'Giá bán', dataIndex: 'unitPrice', key: 'unitPrice', width: 120, align: 'right', render: (value) => <Text strong style={{ color: '#1677ff' }}>{fmtShort(value)}</Text> },
            { title: 'Tổng vốn (kế hoạch)', key: 'totalCost', width: 140, align: 'right', render: (_, record) => fmtShort((record.qty || 0) * costOf(record)) },
            { title: 'Chi phí thực tế', key: 'actualCost', width: 140, align: 'right', render: (_, record) => {
              const actual = costByItem[record.code] || 0;
              const planned = (record.qty || 0) * costOf(record);
              const color = actual > planned ? '#ff4d4f' : actual < planned ? '#faad14' : '#52c41a';
              return <Text strong style={{ color }}>{fmtShort(actual)}</Text>;
            } },
            { title: 'Tổng bán', key: 'totalRevenue', width: 120, align: 'right', render: (_, record) => fmtShort((record.qty || 0) * (record.unitPrice || 0)) },
            { title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 120, render: (status) => <Tag>{status}</Tag> },
            { title: 'Tiến độ', dataIndex: 'progress', key: 'progress', width: 130, render: (value) => <Progress percent={value || 0} size="small" /> },
            {
              title: '',
              key: 'action',
              width: 90,
              fixed: 'right',
              render: (_, record) => (
                <Space>
                  <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
                  <Popconfirm title="Xóa item này?" onConfirm={() => onDelete(record.code)}>
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={editItem ? `Sửa Item ${editItem.code}` : 'Thêm Item mới'}
        open={modalOpen}
        onOk={onSubmit}
        onCancel={() => setModalOpen(false)}
        width={720}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="code" label="Mã Item" rules={[{ required: true }]}>
                <Input disabled={!!editItem} placeholder="A014" />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="name" label="Tên hạng mục" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="port" label="Port" rules={[{ required: true }]}>
                <Select options={portOptions} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="qty" label="Số lượng" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="unit" label="Đơn vị" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="unitCost" label="Đơn giá vốn" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} formatter={(value) => `${value || ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="unitPrice" label="Giá bán" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} formatter={(value) => `${value || ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="status" label="Trạng thái">
                <Select options={STATUS_LIST.map((status) => ({ value: status, label: status }))} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="progress" label="Tiến độ (%)">
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="drawingCode" label="Mã bản vẽ">
                <Input placeholder="BB1-LQM-A09-CD0001" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
