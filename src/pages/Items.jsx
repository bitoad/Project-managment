import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Grid,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Progress,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  ArrowUpOutlined,
  CalculatorOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  DollarOutlined,
  EditOutlined,
  InboxOutlined,
  PercentageOutlined,
  PlusOutlined,
  ProfileOutlined,
} from '@ant-design/icons';
import { itemsApi, costLogsApi, metaApi } from '../api/api.js';
import dayjs from 'dayjs';
import { useProject } from '../context/ProjectContext.jsx';
import StatCard from '../components/StatCard.jsx';
import { fmtVND, PORT_COLORS, STATUS_LIST, STATUS_PROGRESS, PROC_STATUS_LIST, PROC_STATUS_PROGRESS, procStatusColor, costOf, TONE, cardListColumns } from '../components/helpers.js';
import { sumRevenue, sumVAT, revenueInclVAT, sumPlannedCost, sumActualCost, profit, profitMargin, itemMargin, itemTotal } from '../../shared/formulas.js';
import EmptyState from '../components/shared/EmptyState.jsx';

const { Text } = Typography;

export default function Items({ initialPortFilter = null }) {
  const { ports, currentProjectId, portfolioView } = useProject();
  const portOptions = useMemo(() => ports.map((p) => ({ value: p.id, label: p.id })), [ports]);
  const [items, setItems] = useState([]);
  const [costLogs, setCostLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPort, setFilterPort] = useState(initialPortFilter || 'all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [vatRate, setVatRate] = useState(10);
  const [form] = Form.useForm();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  const load = async () => {
    try {
      setLoading(true);
      const [itemList, logList, meta] = await Promise.all([
        itemsApi.getAll(currentProjectId, portfolioView),
        costLogsApi.getAll(currentProjectId, portfolioView),
        metaApi.get(),
      ]);
      setItems(itemList);
      setCostLogs(logList);
      if (meta && meta.vatRate != null) setVatRate(meta.vatRate);
    } catch (e) {
      message.error('Không tải được Items');
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
      procStatus: 'Chưa đặt',
      assigned_to: '',
      qty_received: 0,
      stock_on_hand: 0,
      port: filterPort === 'all' ? 'PORT 1' : filterPort,
      vatRate: vatRate,
    });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    form.setFieldsValue({
      ...item,
      procStatus: item.procStatus != null ? item.procStatus : 'Chưa đặt',
      assigned_to: item.assigned_to || '',
      qty_received: item.qty_received != null ? item.qty_received : 0,
      stock_on_hand: item.stock_on_hand != null ? item.stock_on_hand : 0,
      vatRate: item.vatRate != null ? item.vatRate : vatRate,
      startDate: item.startDate ? dayjs(item.startDate) : null,
      endDate: item.endDate ? dayjs(item.endDate) : null,
      order_date: item.order_date ? dayjs(item.order_date) : null,
      expected_delivery_date: item.expected_delivery_date ? dayjs(item.expected_delivery_date) : null,
      actual_delivery_date: item.actual_delivery_date ? dayjs(item.actual_delivery_date) : null,
    });
    setModalOpen(true);
  };

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        startDate: values.startDate ? (values.startDate.format ? values.startDate.format('YYYY-MM-DD') : values.startDate) : null,
        endDate: values.endDate ? (values.endDate.format ? values.endDate.format('YYYY-MM-DD') : values.endDate) : null,
        order_date: values.order_date ? (values.order_date.format ? values.order_date.format('YYYY-MM-DD') : values.order_date) : null,
        expected_delivery_date: values.expected_delivery_date ? (values.expected_delivery_date.format ? values.expected_delivery_date.format('YYYY-MM-DD') : values.expected_delivery_date) : null,
        actual_delivery_date: values.actual_delivery_date ? (values.actual_delivery_date.format ? values.actual_delivery_date.format('YYYY-MM-DD') : values.actual_delivery_date) : null,
      };
      if (editItem) {
        await itemsApi.update(editItem.code, payload);
        message.success('Đã cập nhật Item');
      } else {
        await itemsApi.create(payload);
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
  const totalRevenue = sumRevenue(filteredItems);
  const itemVat = (item) => (item.vatRate != null ? item.vatRate : vatRate);
  const totalVAT = sumVAT(filteredItems, vatRate);
  const totalRevenueInclVAT = revenueInclVAT(totalRevenue, totalVAT);
  const totalPlannedCost = sumPlannedCost(filteredItems);
  const totalActualCost = sumActualCost(costLogs);
  const totalProfit = profit(totalRevenue, totalPlannedCost);
  const totalMargin = profitMargin(totalProfit, totalRevenue);
  const itemsWithDeadline = filteredItems.filter((i) => i.endDate).length;
  const overdueItems = filteredItems.filter((i) => i.endDate && dayjs(i.endDate).isBefore(dayjs(), 'day') && (i.progress || 0) < 100).length;

  return (
    <div className="ds-container" style={{ maxWidth: 1400, margin: '0 auto' }}>
      <div className="ds-page-header">
        <div>
          <div className="ds-h1"><ProfileOutlined /> Item Master</div>
          <div className="ds-caption">Danh mục vật tư &amp; tiến độ cung ứng</div>
        </div>
        <Space wrap>
          <Select
            value={filterPort}
            onChange={setFilterPort}
            style={{ width: 160 }}
            options={[{ value: 'all', label: 'Tất cả Port' }, ...portOptions]}
          />
          <button className="btn btn-primary" onClick={openAdd} disabled={portfolioView} title={portfolioView ? 'Chọn 1 dự án để thêm Item' : undefined}><PlusOutlined /> Thêm Item</button>
        </Space>
      </div>

      <div className="ds-stat-grid">
        <StatCard
          icon={<ProfileOutlined />}
           accent="var(--accent-primary)"
          title="Tổng Items"
          value={filteredItems.length}
          valueStyle={{ color: TONE.primary }}
          footer={<>{filteredItems.length} hạng mục</>}
        />
        <StatCard
          icon={<DollarOutlined />}
           accent="var(--accent-primary)"
          title="Tổng doanh thu"
          value={totalRevenue}
          formatter={(v) => fmtVND(v)}
          valueStyle={{ color: TONE.primary }}
        />
        <StatCard
          icon={<DollarOutlined />}
           accent="var(--accent-primary)"
          title="Tổng (gồm VAT)"
          value={totalRevenueInclVAT}
          formatter={(v) => fmtVND(v)}
          valueStyle={{ color: TONE.primary }}
        />
        <StatCard
          icon={<PercentageOutlined />}
          accent="linear-gradient(135deg,#fa8c16,#ffc069)"
          title="Thuế VAT"
          value={totalVAT}
          formatter={(v) => fmtVND(v)}
          valueStyle={{ color: TONE.warning }}
        />
        <StatCard
          icon={<CalculatorOutlined />}
          accent="linear-gradient(135deg,#722ed1,#9254de)"
          title="Tổng giá vốn KH"
          value={totalPlannedCost}
          formatter={(v) => fmtVND(v)}
          valueStyle={{ color: '#722ed1' }}
        />
        <StatCard
          icon={<CalculatorOutlined />}
          accent="linear-gradient(135deg,#fa541c,#ff7a45)"
          title="Chi phí thực tế"
          value={totalActualCost}
          formatter={(v) => fmtVND(v)}
          valueStyle={{ color: '#fa541c' }}
        />
        <StatCard
          icon={<ArrowUpOutlined />}
          accent={totalProfit >= 0 ? 'linear-gradient(135deg,#1FA971,#3cc995)' : 'linear-gradient(135deg,#EF4444,#ff7875)'}
          title="Lợi nhuận thực tế"
          value={totalProfit}
          formatter={(v) => fmtVND(v)}
          valueStyle={{ color: totalProfit >= 0 ? TONE.success : TONE.danger }}
        />
        <StatCard
          icon={<PercentageOutlined />}
          accent={totalMargin >= 0 ? 'linear-gradient(135deg,#1FA971,#3cc995)' : 'linear-gradient(135deg,#EF4444,#ff7875)'}
          title="Biên lợi nhuận"
          value={totalMargin}
          formatter={(v) => `${v.toFixed(1)}%`}
          valueStyle={{ color: totalMargin >= 0 ? TONE.success : TONE.danger }}
        />
        <StatCard
          icon={<ClockCircleOutlined />}
          accent={itemsWithDeadline === filteredItems.length ? 'linear-gradient(135deg,#1FA971,#3cc995)' : 'linear-gradient(135deg,#faad14,#ffd666)'}
          title="Deadline"
          value={`${itemsWithDeadline}/${filteredItems.length}`}
          valueStyle={{ color: itemsWithDeadline === filteredItems.length ? TONE.success : TONE.warning }}
          footer={<>{overdueItems > 0 ? <span style={{ color: TONE.danger }}>{overdueItems} quá hạn</span> : 'Không quá hạn'}</>}
        />
      </div>

      <Card className="ds-chart-card" bordered={false} style={{ marginTop: 16 }}>
        <Table
          className="ds-table-premium card-list"
          dataSource={filteredItems}
          rowKey={(record) => record.__key || record.code}
          loading={loading}
          scroll={{ x: 1150 }}
          locale={{
            emptyText: (
              <EmptyState icon={<InboxOutlined />} title="Chưa có item nào" />
            ),
          }}
          columns={cardListColumns([
            ...(portfolioView
              ? [{ title: 'Dự án', dataIndex: 'projectName', key: 'projectName', width: 160, ellipsis: true, fixed: 'left' }]
              : []),
            { title: 'Code', dataIndex: 'code', key: 'code', width: 80, fixed: portfolioView ? undefined : 'left', render: (code) => <Text strong>{code}</Text> },
            { title: 'Tên hạng mục', dataIndex: 'name', key: 'name', ellipsis: true },
            {
              title: 'Port',
              dataIndex: 'port',
              key: 'port',
              width: 90,
              render: (port) => <Tag color={PORT_COLORS[port] || 'blue'}>{port}</Tag>,
            },
            {
              title: 'TT mua hàng',
              dataIndex: 'procStatus',
              key: 'procStatus',
              width: 130,
              render: (value) => <Tag color={procStatusColor(value)}>{value || 'Chưa đặt'}</Tag>,
            },
            {
              title: '% Hoàn thành',
              dataIndex: 'progress',
              key: 'progress',
              width: 130,
              render: (value) => <Progress percent={value || 0} size="small" />,
            },
            { title: 'SL', dataIndex: 'qty', key: 'qty', width: 70, align: 'right', render: (value) => <span className="ds-num">{value}</span> },
            { title: 'ĐVT', dataIndex: 'unit', key: 'unit', width: 70 },
            { title: 'Đơn giá vốn', dataIndex: 'internalCost', key: 'internalCost', width: 140, align: 'right', render: (_, record) => <span className="ds-num">{fmtVND(costOf(record))}</span> },
            { title: 'Giá bán', dataIndex: 'unitPrice', key: 'unitPrice', width: 140, align: 'right', render: (value) => <Text strong className="ds-num" style={{ color: TONE.primary }}>{fmtVND(value)}</Text> },
            { title: 'Tổng vốn (kế hoạch)', key: 'totalCost', width: 150, align: 'right', render: (_, record) => <span className="ds-num">{fmtVND((record.qty || 0) * costOf(record))}</span> },
            { title: 'Chi phí thực tế', key: 'actualCost', width: 150, align: 'right', render: (_, record) => {
              const actual = costByItem[record.code] || 0;
              const planned = (record.qty || 0) * costOf(record);
              const color = actual > planned ? TONE.danger : actual < planned ? TONE.warning : TONE.success;
              return <Text strong className="ds-num" style={{ color }}>{fmtVND(actual)}</Text>;
            } },
            { title: 'Tổng bán', key: 'totalRevenue', width: 150, align: 'right',               render: (_, record) => <span className="ds-num">{fmtVND(itemTotal(record))}</span> },
            {
              title: 'Biên LN',
              key: 'margin',
              width: 90,
              align: 'right',
              render: (_, record) => {
                const margin = itemMargin(record);
                return <Text strong className="ds-num" style={{ color: margin >= 0 ? TONE.success : TONE.danger }}>{margin.toFixed(1)}%</Text>;
              },
            },
            { title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 120, render: (status) => <Tag>{status}</Tag> },
            {
              title: '',
              key: 'action',
              width: 90,
              fixed: 'right',
              render: (_, record) => (
                <Space size={4}>
                  <button className="btn btn-outline btn-sm btn-icon" onClick={() => openEdit(record)} disabled={portfolioView} title="Sửa"><EditOutlined /></button>
                  <Popconfirm title="Xóa item này?" onConfirm={() => onDelete(record.code)} disabled={portfolioView}>
                    <button className="btn btn-danger btn-sm btn-icon" disabled={portfolioView} title="Xóa"><DeleteOutlined /></button>
                  </Popconfirm>
                </Space>
              ),
            },
          ])}
        />
      </Card>

      <Modal
        title={editItem ? `Sửa Item ${editItem.code}` : 'Thêm Item mới'}
        open={modalOpen}
        onOk={onSubmit}
        onCancel={() => setModalOpen(false)}
        width={isMobile ? '92%' : 720}
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
            <Col span={6}>
              <Form.Item name="unitCost" label="Đơn giá vốn" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} formatter={(value) => `${value ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="unitPrice" label="Giá bán" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} formatter={(value) => `${value ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="status" label="Trạng thái">
                <Select
                  options={STATUS_LIST.map((status) => ({ value: status, label: `${status} (${STATUS_PROGRESS[status]}%)` }))}
                  onChange={(value) => form.setFieldsValue({ progress: STATUS_PROGRESS[value] ?? 0 })}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="vatRate" label="VAT (%)">
                <InputNumber min={0} max={100} style={{ width: '100%' }} addonAfter="%" />
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
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startDate" label="Ngày bắt đầu">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endDate" label="Deadline (kết thúc)">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="procStatus" label="Trạng thái mua hàng">
                <Select
                  options={PROC_STATUS_LIST.map((s) => ({ value: s, label: `${s} (${PROC_STATUS_PROGRESS[s]}%)` }))}
                  onChange={(value) => form.setFieldsValue({ progress: PROC_STATUS_PROGRESS[value] ?? 0 })}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="assigned_to" label="Phụ trách">
                <Input placeholder="Tên/Nhà thầu" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="qty_received" label="Đã nhận (SL)">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="order_date" label="Ngày đặt hàng">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="expected_delivery_date" label="Dự kiến giao">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="actual_delivery_date" label="Thực tế giao">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="stock_on_hand" label="Tồn kho">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item noStyle shouldUpdate>
            {() => {
              const qty = Number(form.getFieldValue('qty')) || 0;
              const cost = Number(form.getFieldValue('unitCost')) || 0;
              const price = Number(form.getFieldValue('unitPrice')) || 0;
              const v = Number(form.getFieldValue('vatRate')) || 0;
              const revenue = itemTotal({ qty, unitPrice: price });
              const vat = Math.round(revenue * v / 100);
              const margin = itemMargin({ unitPrice: price, internalCost: cost, unitCost: cost });
              const profitVal = profit(revenue, (cost || 0) * qty);
              return (
                <Row gutter={16} style={{ background: 'var(--color-surface-2)', padding: '12px 16px', borderRadius: 8, marginTop: 4 }}>
                  <Col span={6}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Thành tiền bán</Text>
                    <div><Text strong>{fmtVND(revenue)}</Text></div>
                  </Col>
                  <Col span={6}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Thuế VAT ({v}%)</Text>
                    <div><Text strong style={{ color: TONE.warning }}>{fmtVND(vat)}</Text></div>
                  </Col>
                  <Col span={6}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Biên lợi nhuận</Text>
                    <div><Text strong style={{ color: margin >= 0 ? TONE.success : TONE.danger }}>{margin.toFixed(1)}%</Text></div>
                  </Col>
                  <Col span={6}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Lợi nhuận dự kiến</Text>
                    <div><Text strong style={{ color: TONE.primary }}>{fmtVND(profitVal)}</Text></div>
                  </Col>
                </Row>
              );
            }}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
